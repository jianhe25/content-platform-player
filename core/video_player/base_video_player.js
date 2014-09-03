(function() {
  /**
   * The number of milliseconds for time update timer.
   * @type {Number}
   * @constant
   * @private
   */
  var TIME_UPDATE_TIMEOUT = 20000;

  /**
   * Enum for media element's ready state
   * @enum {int}
   */
  var READY_STATE =  {
    HAVE_NOTHING: 0,
    HAVE_METADATA : 1,
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
    HAVE_ENOUGH_DATA: 4
  };

  /**
   * Enum for timeout checker
   * the state of player we should check timeout
   * @type {Object}
   * @param {int} state state code
   * @param {Number} interval the interval to timeout
   * @param {Boolean} needTimeUpdate If true, the player can not stay in this state for too long without any time update event.
   */
  var TIMEOUT_CHECKER = {
    //Player is in playing state but not receive any time update event.
    PLAYING:                               {state: 0, interval: 20000, needTimeUpdate: true},
    //When rebuffer happens, player is paused automatically and don't have enough buffer to play.
    AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER:     {state: 1, interval: 20000, needTimeUpdate: false},
    //When rebuffer happens, player is paused automatically and have enough buffer to play.
    AUTO_PAUSED_WITH_ENOUGH_BUFFER:        {state: 2, interval: 5000,  needTimeUpdate: false},
    //Player don't have enough buffer to player after seeking.
    SEEKING_WITHOUT_ENOUGH_BUFFER:         {state: 3, interval: 20000, needTimeUpdate: false},
    //Player has enough buffer to play after seeking but still not enter playing state.
    SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING: {state: 4, interval: 5000,  needTimeUpdate: false},
    //Player has finished to video but still not receive the video end event.
    VIDEO_END:                             {state: 5, interval: 3000,  needTimeUpdate: false},
    //Http player is in loading state.
    HTTP_LOADING:                          {state: 6, interval: 15000, needTimeUpdate: false},
    //Player will seek at first when resuming, and have enought buffer to resume.
    SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING:{state: 7, interval: 2000,  needTimeUpdate: false}
  };

  HP.VideoPlayer.BaseVideoPlayer = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.BaseVideoPlayer.prototype */
  {
    /**
     * Available MediaElement for player
     * @type {HP.Interfaces.IMediaElement}
     * @protected
     */
    mediaElement: null,

    /**
     * The next pause is called automatically and not by user
     * @type {Boolean}
     * @protected
     */
    autoPausePending: false,

    /**
     * True if the player is not paused by user
     * @type {Boolean}
     * @protected
     */
    autoPaused: true,

    /**
     * Indicate whether we have fired PLAYBACK_START event
     * @type {Boolean}
     * @protected
     */
    playbackStartFired: false,

    /**
     * Player should seek first when playing video if true
     * @type {Boolean}
     * @protected
     */
    autoSeekPending: false,

    /**
     * Pause the player should the buffer not be full enough
     * @type {Boolean}
     * @protected
     */
    pauseOnReadyStateBuffering: true,

    /**
     * Indicate whether the buffer is first full after first playing or seeking
     * @type {Boolean}
     * @protected
     */
    firstBufferFull: false,

    /**
     * Indicate whether th player is in rebuffer sate
     * @type {Boolean}
     * @protected
     */
    isRebuffering:  false,

    /**
     * Indicate whether the player has enough buffer to play
     * @type {Boolean}
     */
    hasEnoughBuffer: false,

    /**
     * Progress timer
     * @type {int}
     * @protected
     */
    progressTimer: -1,

    /**
     * Stream url
     * @type {String}
     */
    httpUrl: null,

    /**
     * State of player
     * @type {String}
     * @private
     */
    _state: HP.VideoPlayer.State.INIT,

    _duration: NaN,

    _position: 0,

    _volume: 1,

    _muted: false,

    _pendingStateAfterSeek: null,

    _timeoutTimerCount: 0,

    _hasTimeUpdate: false,

    _timeoutChecker: null,

    _mediaElementEventHandlers: null,

    _externalTimeoutChecker: null,

    log_prefix: "http player",

    /**
     * Base video player
     * @param  {HP.Interfaces.IMediaElement} mediaElement available MediaElement
     * @extends {HP.Events.EventDispatcher}
     * @constructs
     */
    constructor: function(mediaElement) {
      this.mediaElement = mediaElement;
      this._mediaElementEventHandlers = {};

      this._setHandler(HP.Events.MediaElement.SEEKING, this.onSeeking);
      this._setHandler(HP.Events.MediaElement.SEEKED, this.onSeeked);
      this._setHandler(HP.Events.MediaElement.PAUSE, this.onPause);
      this._setHandler(HP.Events.MediaElement.PLAYING, this.onPlaying);
      this._setHandler(HP.Events.MediaElement.TIME_UPDATE, this.onTimeUpdate);
      this._setHandler(HP.Events.MediaElement.ERROR, this.onError);
      this._setHandler(HP.Events.MediaElement.ENDED, this.onEnded);
      this._setHandler(HP.Events.MediaElement.CAN_PLAY, this.onCanPlay);
      this._setHandler(HP.Events.MediaElement.CAN_PLAY_THROUGH, this.onCanPlayThrough);
      this._setHandler(HP.Events.MediaElement.LOAD_START, this.onLoadStart);
      this._setHandler(HP.Events.MediaElement.STALLED, this.onStalled);
      this._setHandler(HP.Events.MediaElement.FULL_SCREEN_CHANGE, this.onFullscreenChange);
      this._setHandler(HP.Events.MediaElement.VOLUME_CHANGE, this.onVolumeChange);
      this._setHandler(HP.Events.MediaElement.DURATION_CHANGE, this.onDurationChanged);
      this._setHandler(HP.Events.MediaElement.LOADED_METADATA, this.onLoadedMetadata);

      this.setState(HP.VideoPlayer.State.INIT);
    },

    /**
     * Callback called when media element is triggering events
     * @param  {String} event triggered event
     * @param  {Object} data  event data
     * @internal this should be only called by media element when this player is owning it
     */
    onMediaElementEvent: function(event, data) {
      if (this._mediaElementEventHandlers[event]) {
        this._mediaElementEventHandlers[event].call(this, data);
      }
    },

    _setHandler: function(event, handler) {
      this._mediaElementEventHandlers[event] = handler;
    },

    /**
     * Reset VideoPlayer to original state
     * @todo Make it private.
     */
    reset: function() {
      this.mediaElement.detach(this);
      this.setState(HP.VideoPlayer.State.INIT);
      this._resetTimeoutChecker();
      this._duration = NaN;
      this._position = 0;
      this._volume = 1;
      this._muted = false;
      this._pendingStateAfterSeek = null;
      this.autoPausePending = false;
      this.autoSeekPending = false;
      this.playbackStartFired = false;
      this.firstBufferFull = false;
      this.isRebuffering = false;
      this.hasEnoughBuffer = false;
      this.httpUrl = null;
      this._externalTimeoutChecker = null;
    },

    /**
     * Play video from current time
     */
    play: function(start) {
      if (!this.isOwningElement()) {
        this.mediaElement.attach(this);
      }
      if(start && start > 0) {
        this.seek(start);
      }
      HP.Logger.log(this.log_prefix + ' play COMMAND: mediaElement.play()');
      this.mediaElement.play();
    },

    /**
     * Pause video at current time
     */
    pause: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' pause COMMAND: mediaElement.pause()');
      this.mediaElement.pause();
      this._position = this.mediaElement.getPosition();
    },

    /**
     * Seek video to a given position
     * @param  {Number} position the target seek position in millisecond
     */
    seek: function(position) {
      //HACK: if seek to a position less than 0.5 sec before the end of the video,
      //      there will no seeked or time update event dispatched when seeking completed.
      //      This will lead player to a timeout error state.
      //Note: If seek position is larger than video duration, a time update event will
      //      be dispatched correctly.
      position = Math.min(position, this._duration - 1000);
      this._position = position;
      if (!this.isOwningElement()) {
        return;
      }
      this._switchRebufferState(false);
      HP.Logger.log(this.log_prefix + ' seek COMMAND: mediaElement.seek() - ' + position);
      this.mediaElement.seek(position);
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {
      if (!this.isOwningElement()) {
        return;
      }
      this.pause();
      HP.Logger.log(this.log_prefix + ' stop COMMAND: mediaElement.load()');
      this.mediaElement.load("");
      this.reset();
    },

    /**
     * Mute player
     */
    mute: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' mute COMMAND: mediaElement.mute()');
      this.mediaElement.mute();
      this._muted = this.mediaElement.getMuted();
    },

    /**
     * Unmute player
     */
    unmute: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' unmute COMMAND: mediaElement.unmute()');
      this.mediaElement.unmute();
      this._muted = this.mediaElement.getMuted();
    },

    /**
     * Get whether it's muted
     * @return {Boolean} Return true if it's muted
     */
    getMuted: function() {
      return this._muted;
    },

    /**
     * Set current state of this VideoPlayer
     * @param {string} current state
     */
    setState: function(state) {
      if(this._state != state) {
        HP.Logger.log(this.log_prefix + ' state changed from ' + this._state + ' to ' + state);

        this._state = state;
        this._resetTimeoutChecker();
      }
    },

    _resetTimeoutChecker: function() {
      this._timeoutTimerCount = 0;
      this._timeoutChecker = null;
      this._hasTimeUpdate = false;
    },

    /**
     * Checkt player state to choose the timeout checker
     * @return {Object} the timeout checker. null means no need to check timeout.
     */
    _getTimeoutChecker: function() {
      if (!this.mediaElement.isPaused() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        if(this.getDuration() - this.getPosition() < 1500) {
          return TIMEOUT_CHECKER.VIDEO_END;
        } else {
          return TIMEOUT_CHECKER.PLAYING;
        }
      }
      if (this.mediaElement.isPaused() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        if (this.hasEnoughBuffer) {
          return TIMEOUT_CHECKER.AUTO_PAUSED_WITH_ENOUGH_BUFFER;
        } else if (this.isRebuffering || this.httpUrl){
          return TIMEOUT_CHECKER.AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER;
        }
      }
      if (this.getState() == HP.VideoPlayer.State.SEEKING) {
        if(this.hasEnoughBuffer) {
          if(this._pendingStateAfterSeek == HP.VideoPlayer.State.PLAYING) {
            return TIMEOUT_CHECKER.SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING;
          }
          //DASHJS-708: Blank when resume from last position
          //Player will seek at first when resuming, but in IE11, it won't fire seeked event. So check this timeout to let player retry once.
          if(this._pendingStateAfterSeek == HP.VideoPlayer.State.READY) {
            return TIMEOUT_CHECKER.SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING;
          }
        }
        if (!this.hasEnoughBuffer && this.httpUrl) {
          return TIMEOUT_CHECKER.SEEKING_WITHOUT_ENOUGH_BUFFER;
        }
      }
      if (this.httpUrl && (this.getState() == HP.VideoPlayer.State.LOADING || (this.getState() == HP.VideoPlayer.State.READY && this.autoPaused))) {
        return TIMEOUT_CHECKER.HTTP_LOADING;
      }
      return null;
    },

    /**
     * Check whether the player is timeout in some states
     * @protected
     */
    checkTimeout: function() {
      if(!this.isOwningElement()) {
        return;
      }

      //If no need to check timeout or the timeout checker is changed, then reset.
      var newTimeoutChecker = this._getTimeoutChecker();

      if (!newTimeoutChecker) {
        this._resetTimeoutChecker();
        return;
      }

      if(this._timeoutChecker == null || this._timeoutChecker.state != newTimeoutChecker.state) {
        this._resetTimeoutChecker();
        this._timeoutChecker = newTimeoutChecker;
        return;
      }

      var interval = this._timeoutChecker.interval;
      if(this._externalTimeoutChecker && this._externalTimeoutChecker.length > 0 && this._externalTimeoutChecker[this._timeoutChecker.state]) {
        interval = this._externalTimeoutChecker[this._timeoutChecker.state];
      }

      if (this._timeoutTimerCount >= interval / HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL) {
        if(this._timeoutChecker.state == TIMEOUT_CHECKER.VIDEO_END.state) {
          this.onEnded();
        } else {
          this.onError({type: HP.VideoPlayer.Error.MEDIA_TIMEOUT_ERROR, 'timeoutState': this._timeoutChecker.state});
        }
      } else if (this._timeoutChecker.needTimeUpdate && this._hasTimeUpdate) {
        this._hasTimeUpdate = false;
        this._timeoutTimerCount = 0;
      } else {
        this._timeoutTimerCount ++;
      }
    },

    /**
     * Get current state of this VideoPlayer
     * @return {string} current state
     */
    getState: function() {
      return this._state;
    },

    /**
     * Get current position of video
     * @return {Number} current position of video in millisecond
     */
    getPosition: function() {
      return this._position;
    },

    /**
     * Get current duration of video
     * @return {Number} current duration of video in millisecond
     */
    getDuration: function(){
      return this._duration;
    },

    /**
     * Get current volume of video
     * @return {Number} current volume of video
     */
    getVolume: function() {
      return this._volume;
    },

    /**
     * Set current volume of video to a target value
     * @param  {Number} volume target volume
     */
    setVolume: function(volume) {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' volume COMMAND: mediaElement.setVolume() - ' + volume);
      this.mediaElement.setVolume(volume);
      this._volume = this.mediaElement.getVolume();
    },

    _switchRebufferState: function(isRebuffering) {
      if(this.isRebuffering != isRebuffering && this.firstBufferFull) {
        this.trigger(isRebuffering ? HP.Events.VideoPlayer.REBUFFER_START : HP.Events.VideoPlayer.REBUFFER_STOP, this.getRebufferParams(isRebuffering));
        if(isRebuffering) {
          this.onRebufferStart();
        }
      }
      this.isRebuffering = isRebuffering;
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.PAUSE
     * @fires HP.Events.VideoPlayer.PAUSE
     * @protected
     */
    onPause: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PAUSE);

      this.autoPaused = this.autoPausePending;
      this.autoPausePending = false;
      if(!this.autoPaused) {
        this.setState(HP.VideoPlayer.State.PAUSED);
        this.trigger(HP.Events.VideoPlayer.PAUSE);
      } else {
        this._switchRebufferState(true);
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.PLAY
     * @fires HP.Events.VideoPlayer.PLAYING
     * @protected
     */
    onPlaying: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PLAYING);

      this._switchRebufferState(false);
      this.firstBufferFull = true;
      this.autoPausePending = false;
      this.autoPaused = false;
      this.setState(HP.VideoPlayer.State.PLAYING);

      if(!this.playbackStartFired) {
        this.trigger(HP.Events.VideoPlayer.PLAYBACK_START);
        HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PLAYBACK_START);
        this.playbackStartFired = true;
      }

      this.trigger(HP.Events.VideoPlayer.PLAYING);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.SEEKING
     * @fires HP.Events.VideoPlayer.SEEKING
     * @protected
     */
    onSeeking: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.SEEKING);

      this._switchRebufferState(false);

      //if still in another seeking process, don't change the pending state.
      if(this.getState() != HP.VideoPlayer.State.SEEKING) {
        this._pendingStateAfterSeek = this.getState();
      }
      this.setState(HP.VideoPlayer.State.SEEKING);
      this.trigger(HP.Events.VideoPlayer.SEEKING);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.SEEKED
     * @fires HP.Events.VideoPlayer.SEEKED
     * @protected
     */
    onSeeked: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.SEEKED);

      this.firstBufferFull = false;
      if(this.getState() == HP.VideoPlayer.State.SEEKING) {
        this.setState(this._pendingStateAfterSeek);
      }
      this.trigger(HP.Events.VideoPlayer.SEEKED, {state: this.getState(), position: this.getPosition(), duration: this.getDuration()});
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.TIME_UPDATE
     * @fires HP.Events.VideoPlayer.TIME_UPDATE
     * @protected
     */
    onTimeUpdate: function() {
      // When player source is chagned, it will fire a timeupdate event
      // with the position 0 and duration NaN, we should ignore this event
      if (isNaN(this.mediaElement.getDuration()) || this.getState() == HP.VideoPlayer.State.SEEKING || this.autoSeekPending) {
        return;
      }
      this._hasTimeUpdate = true;
      this._position = this.mediaElement.getPosition();
      this.trigger(HP.Events.VideoPlayer.TIME_UPDATE, {position: this.getPosition(), duration: this.getDuration()});
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.ERROR
     * @fires HP.Events.VideoPlayer.ERROR
     * @protected
     */
    onError: function(event) {
      var params = {};
      try {
        params['playerState'] = this.getState();
        params['playerPosition'] = this.getPosition();
        params['playerDuration'] = this.getDuration();
        params['playerAutoPaused'] = this.autoPaused;
        params['playerBufferEnough'] = this.hasEnoughBuffer;
        params['videoTagPosition'] = this.mediaElement.getPosition();
        params['videoTagDuration'] = this.mediaElement.getDuration();
        params['videoTagPaused'] = this.mediaElement.isPaused();
        params['videoTagEnded'] = this.mediaElement.isEnded();
        params['videoTagSeeking'] = this.mediaElement.isSeeking();
      } catch (ex) {
      }

      event = event || {};

      if(event.target && event.target.error){
        var error = event.target.error;
        switch(error.code) {
          case error['MEDIA_ERR_ABORTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_ABORTED_ERROR;
            break;
          case error['MEDIA_ERR_NETWORK']:
            params.type = HP.VideoPlayer.Error.MEDIA_NETWORK_ERROR;
            break;
          case error['MEDIA_ERR_DECODE']:
            params.type = HP.VideoPlayer.Error.MEDIA_DECODE_ERROR;
            break;
          case error['MEDIA_ERR_SRC_NOT_SUPPORTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_SRC_NOT_SUPPORTED_ERROR;
            break;
          case error['MS_MEDIA_ERR_ENCRYPTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_ENCRYPTED_ERROR;
            break;
        }
      } else {
        HP.Utils.extend(params, event);
      }

      if(!params.type || params.type == '') {
        HP.Logger.warn('Should have type filed when trigger error event');
        params.type = HP.VideoPlayer.Error.MEDIA_UNKNOWN_ERROR;
      }

      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.ERROR + ' - ' + params.type);

      this.setState(HP.VideoPlayer.State.ERROR);
      this.trigger(HP.Events.VideoPlayer.ERROR, params);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.ENDED
     * @fires HP.Events.VideoPlayer.ENDED
     * @protected
     */
    onEnded: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.ENDED);

      this.setState(HP.VideoPlayer.State.ENDED);
      this.trigger(HP.Events.VideoPlayer.ENDED);
    },

    _autoSeeking: function() {
      if (this.autoSeekPending) {
        try {
          HP.Logger.log(this.log_prefix + ' autoSeeking COMMAND: mediaElement.seek()');
          this.mediaElement.seek(this.getPosition());
        }
        finally {
          this.autoSeekPending = false;
        }
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.CAN_PLAY
     * @fires HP.Events.VideoPlayer.CAN_PLAY
     * @protected
     */
    onCanPlay: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.CAN_PLAY);

      if(this.getState() == HP.VideoPlayer.State.LOADING) {
        this.setState(HP.VideoPlayer.State.READY);
      }
      this.trigger(HP.Events.VideoPlayer.CAN_PLAY);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.CAN_PLAY_THROUGH
     * @fires HP.Events.VideoPlayer.CAN_PLAY_THROUGH
     * @protected
     */
    onCanPlayThrough: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.CAN_PLAY_THROUGH);

      if(this.getState() == HP.VideoPlayer.State.LOADING) {
        this.setState(HP.VideoPlayer.State.READY);
      }
      this.trigger(HP.Events.VideoPlayer.CAN_PLAY_THROUGH);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.LOAD_START
     * @fires HP.Events.VideoPlayer.LOAD_START
     * @protected
     */
    onLoadStart: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.LOAD_START);

      this.setState(HP.VideoPlayer.State.LOADING);
      this.trigger(HP.Events.VideoPlayer.LOAD_START);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.STALLED
     * @fires HP.Events.VideoPlayer.STALLED
     * @protected
     */
    onStalled: function() {
      this.trigger(HP.Events.VideoPlayer.STALLED);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.FULL_SCREEN_CHANGE
     * @fires HP.Events.VideoPlayer.FULL_SCREEN_CHANGE
     * @protected
     */
    onFullscreenChange: function(params) {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.FULL_SCREEN_CHANGE);

      this.trigger(HP.Events.VideoPlayer.FULL_SCREEN_CHANGE, params);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.VOLUME_CHANGE
     * @fires HP.Events.VideoPlayer.VOLUME_CHANGE
     * @protected
     */
    onVolumeChange: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.VOLUME_CHANGE + ' - ' + this.getVolume());

      this.trigger(HP.Events.VideoPlayer.VOLUME_CHANGE, {value: this.getVolume()});
    },

    /**
     * Triggered when duration is changed
     * @protected
     */
    onDurationChanged: function() {
      this._duration = this.mediaElement.getDuration();

      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.DURATION_CHANGE + ' - ' + this._duration);

      if (!isNaN(this._duration) && this._duration > 0) {
        this.trigger(HP.Events.VideoPlayer.DURATION_CHANGE);

      }
    },

    /**
     * Triggered when player just determined the duration and dimensions of the media resource
     * @protected
     */
    onLoadedMetadata: function(event) {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.MediaElement.LOADED_METADATA);

      //For MediaKeys browser, seek in onLoadedMetadata event will cause exception. So move it to onCanPlayThrough
      if (!window.MediaKeys) {
        this._autoSeeking();
      }
    },

    /**
     * Called when attach to the media element
     * @protected
     */
    onAttachMediaElement: function() {
      this.firstBufferFull = false;
      this.autoSeekPending = this.getPosition() > 0 ? true : false;

      this.clearProgressTimer();
      this.progressTimer = window.setInterval(this._onHttpProgress.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);

      HP.Logger.log(this.log_prefix + ' onAttachMediaElement COMMAND: mediaElement.load() - ' + this.httpUrl);
      this.mediaElement.load(this.httpUrl);
      this.setState(HP.VideoPlayer.State.LOADING);
    },

    /**
     * Called when detach from the media element
     * @protected
     */
    onDetachMediaElement: function() {
      this.clearProgressTimer();

      HP.Logger.log(this.log_prefix + ' onDetachMediaElement COMMAND');
    },

    /**
     * Whether it's owning the MediaElement
     * @return {Boolean} True if it's owning the MediaElement
     * @protected
     */
    isOwningElement: function() {
      return this.mediaElement.getOwner() == this;
    },

    /**
     * Initial configs
     * @param  {Object} options initialization configs {autoplayer, preload, startPosition}
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Array}  [options.externalTimeoutChecker] Timeout check for different state. Need to sort as follow
     * {
     *   PLAYING, /Player is in playing state but not receive any time update event.
     *   AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER, /When rebuffer happens, player is paused automatically and don't have enough buffer to play.
     *   AUTO_PAUSED_WITH_ENOUGH_BUFFER, //When rebuffer happens, player is paused automatically and have enough buffer to play.
     *   SEEKING_WITHOUT_ENOUGH_BUFFER, //Player don't have enough buffer to player after seeking.
     *   SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING, //Player has enough buffer to play after seeking but still not enter playing state.
     *   VIDEO_END, //Player has finished to video but still not receive the video end event.
     *   HTTP_LOADING, //Http player is in loading state.
     *   SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING, //Player will seek at first when resuming, and have enought buffer to resume.
     * }
     * @protected
     */
    initConfigs: function(options) {
      if(this.getState() != HP.VideoPlayer.State.INIT) {
        this.reset();
      }

      this.autoPaused = options.autoplay && !options.preload;
      this._externalTimeoutChecker = options.externalTimeoutChecker || [];

      if(options.startPosition > 0) {
        this._position = options.startPosition;
        this.autoSeekPending = true;
      }
    },

    /**
     * Load video by stream url
     * @param  {String} streamUrl video source
     * @param  {Object} options initialization configs
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     *
     */
    load: function(streamUrl, options) {
      options = options || {};

      this.initConfigs(options);

      if (options.pauseOnBuffering === false) {
          this.pauseOnReadyStateBuffering = false;
      }

      if(this.httpUrl != streamUrl) {
        this.playbackStartFired = false;
      }
      this.httpUrl = streamUrl;

      this.mediaElement.attach(this);
    },

    /**
     * Clear progress timer
     */
    clearProgressTimer: function() {
      if(this.progressTimer >= 0) {
        window.clearInterval(this.progressTimer);
        this.progressTimer = -1;
      }
    },

    _onHttpProgress: function() {
      if (!this.isOwningElement()) {
        this.clearProgressTimer();
        return;
      }

      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      this.checkTimeout();
      if (HP.VideoPlayer.State.SEEKING != this.getState()) {
        this._checkHttpBuffer()
      }
    },

    /**
     * Check whether the buffer is enough to play
     * @protected
     */
    _checkHttpBuffer: function() {
      var readyState = this.mediaElement.getReadyState();
      var notEnoughBuffered = false;

      if (!this.firstBufferFull || this.isRebuffering) {
        notEnoughBuffered |= (this.mediaElement.getReadyState() < READY_STATE.HAVE_ENOUGH_DATA);
      } else {
        notEnoughBuffered |= (this.mediaElement.getReadyState() < READY_STATE.HAVE_FUTURE_DATA);
      }

      if (this.pauseOnReadyStateBuffering) {
        if (this.mediaElement.isPaused()) {
          if (this.autoPaused) {
            if (!notEnoughBuffered) {
              HP.Logger.log(this.log_prefix + ' checkHttpBuffer COMMAND: mediaElement.play()');
              this.mediaElement.play();
            }
          }
        } else {
          if (notEnoughBuffered) {
            this.autoPausePending = true;
            HP.Logger.log(this.log_prefix + ' checkHttpBuffer COMMAND: mediaElement.pause()');
            this.mediaElement.pause();
          }
        }
      }

      this.hasEnoughBuffer = !notEnoughBuffered;
    },

    /**
     * Retures current video stream source
     * @return {String} current video stream source
     */
    getCurrentSource: function() {
      return this.httpUrl;
    },

    checkVideoEnd: function() {
      return (this.mediaElement.getDuration() - this.mediaElement.getPosition() < 1000);
    },

    onRebufferStart: function() {

    },

    getRebufferParams: function(isRebuffering) {

    }
  },
  /** @lends HP.VideoPlayer.BaseVideoPlayer */
  {
    /**
     * The interval of milliseconds for progress timer.
     * @type {Number}
     * @constant
     * @protected
     */
    PROGRESS_TIMER_INTERVAL: 500
  }).implement(HP.Interfaces.IBaseVideoPlayer)
}).call(this);
