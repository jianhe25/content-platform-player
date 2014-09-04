(function() {
  HP.VideoPlayer.MediaElement = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MediaElement.prototype */
  {
    /**
     * Html video tag
     * @type {HTMLVideoElement}
     */
    _videoTag: null,

    /**
     * The owner of this MediaElement
     * @type {HP.VideoPlayer.BaseVideoPlayer}
     */
    _owner: null,

    _initializedForEME: false,

    /**
     * Video media element
     * @param  {HTMLVideoElement} videoTag html video tag
     * @extends {HP.HP.Events.EventDispatcher}
     * @constructs
     */
    constructor: function(videoTag) {
      this._videoTag = videoTag;
      this._owner = null;

      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.SEEKING, this._onSeeking.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.SEEKED, this._onSeeked.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.PAUSE, this._onPause.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.PLAYING, this._onPlaying.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.TIME_UPDATE, this._onTimeUpdate.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.ERROR, this._onError.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.ENDED, this._onEnded.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.CAN_PLAY, this._onCanPlay.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.CAN_PLAY_THROUGH, this._onCanPlayThrough.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.LOAD_START, this._onLoadStart.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.STALLED, this._onStalled.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.MOZ_FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_BEGIN_FULL_SCREEN, this._onBeginFullscreen.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_END_FULL_SCREEN, this._onEndFullscreen.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.VOLUME_CHANGE, this._onVolumeChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.DURATION_CHANGE, this._onDurationChanged.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.LOADED_METADATA, this._onLoadedMetadata.bind(this));
    },

    /**
     * Attach this MediaElement to a given VideoPlayer
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    attach: function(owner) {
      if(this._owner == owner) {
        return;
      }
      this.detach(this._owner);
      this._owner = owner;
      this._owner.onAttachMediaElement();
    },

    /**
     * Detach this MediaElement from its owner
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    detach: function(owner) {
      if(this._owner == null || this._owner != owner) {
        return;
      }
      this._owner.onDetachMediaElement();
      this._owner = null;
      // TODO: How to notify owner it's attached?
    },

    /**
     * Get current owner
     * @return {BaseVideoPlayer} current owner
     */
    getOwner: function() {
      return this._owner;
    },

    /**
     * Attach MediaSource to the html video tag
     * @param  {MediaSource} mediaSource MediaSource to be attached
     */
    addMediaSource: function(mediaSource) {
      mediaSource.attachTo(this._videoTag);
    },

    /**
     * Reset MediaElement to original state
     */
    reset: function() {

    },

    /**
     * Play video from current time
     */
    play: function() {
      HP.Logger.log('mediaElement play COMMAND: videoTag.play()');
      this._videoTag.play();
    },

    /**
     * Pause video at current time
     */
    pause: function() {
      HP.Logger.log('mediaElement pause COMMAND: videoTag.pause()');
      this._videoTag.pause();
    },

    /**
     * Seek video to a given position
     * @param  {Number} position the target seek position in millisecond
     */
    seek: function(position) {
      position /= 1000;
      if(Math.abs(this._videoTag.currentTime - position) < 1 || isNaN(this._videoTag.duration)) {
        return;
      }
      this._videoTag.currentTime = position;
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {

    },

      /**
     * Mute player
     */
    mute: function() {
      this._videoTag.muted = true;
    },

    /**
     * Unmute player
     */
    unmute: function() {
      this._videoTag.muted = false;
    },

    /**
     * Get whether it's muted
     * @return {Boolean} Return true if it's muted
     */
    getMuted: function() {
      return this._videoTag.muted;
    },

    /**
     * Get current position of video
     * @return {Int} current position of video in millisecond
     */
    getPosition: function() {
      return parseInt(this._videoTag.currentTime * 1000);
    },

    /**
     * Get current duration of video
     * @return {Int} current duration of video  in millisecond
     */
    getDuration: function(){
      return parseInt(this._videoTag.duration * 1000);
    },

    /**
     * Get current volume of video
     * @return {Number} current volume of video
     */
    getVolume: function() {
      return this._videoTag.volume;
    },

    /**
     * Set current volume of video to a target value
     * @param  {Number} volume target volume
     */
    setVolume: function(volume) {
      this._videoTag.volume = volume;
    },

    trigger: function(event, data) {
      this._super(event, data);
      if (this._owner) {
        this._owner.onMediaElementEvent(event, data);
      }
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.PAUSE
     * @fires HP.Events.MediaElement.PAUSE
     */
    _onPause: function() {
      this.trigger(HP.Events.MediaElement.PAUSE);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.PLAY
     * @fires HP.Events.MediaElement.PLAY
     */
    _onPlaying: function() {
      this.trigger(HP.Events.MediaElement.PLAYING);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.SEEKING
     * @fires HP.Events.MediaElement.SEEKING
     */
    _onSeeking: function() {
      this.trigger(HP.Events.MediaElement.SEEKING);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.SEEKED
     * @fires HP.Events.MediaElement.SEEKED
     */
    _onSeeked: function() {
      this.trigger(HP.Events.MediaElement.SEEKED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.TIME_UPDATE
     * @fires HP.Events.MediaElement.TIME_UPDATE
     */
    _onTimeUpdate: function(event) {
      this.trigger(HP.Events.MediaElement.TIME_UPDATE, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.ERROR
     * @fires HP.Events.MediaElement.ERROR
     */
    _onError: function(event) {
      this.trigger(HP.Events.MediaElement.ERROR, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.ENDED
     * @fires HP.Events.MediaElement.ENDED
     */
    _onEnded: function() {
      this.trigger(HP.Events.MediaElement.ENDED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.CAN_PLAY
     * @fires HP.Events.MediaElement.CAN_PLAY
     */
    _onCanPlay: function() {
      this.trigger(HP.Events.MediaElement.CAN_PLAY);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.CAN_PLAY_THROUGH
     * @fires HP.Events.MediaElement.CAN_PLAY_THROUGH
     */
    _onCanPlayThrough: function() {
      this.trigger(HP.Events.MediaElement.CAN_PLAY_THROUGH);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.LOAD_START
     * @fires HP.Events.MediaElement.LOAD_START
     */
    _onLoadStart: function() {
      this.trigger(HP.Events.MediaElement.LOAD_START);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.STALLED
     * @fires HP.Events.MediaElement.STALLED
     */
    _onStalled: function() {
      this.trigger(HP.Events.MediaElement.STALLED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.FULL_SCREEN_CHANGE
     * @fires HP.Events.MediaElement.FULL_SCREEN_CHANGE
     */
    _onFullscreenChange: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.WEBKIT_BIGIN_FULL_SCREEN
     * @fires HP.Events.MediaElement.WEBKIT_BIGIN_FULL_SCREEN
     */
    _onBeginFullscreen: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE, {isFullscreen: true});
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.WEBKIT_END_FULL_SCREEN
     * @fires HP.Events.MediaElement.WEBKIT_END_FULL_SCREEN
     */
    _onEndFullscreen: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE, {isFullscreen: false});
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.VOLUME_CHANGE
     * @fires HP.Events.MediaElement.VOLUME_CHANGE
     */
    _onVolumeChange: function() {
      this.trigger(HP.Events.MediaElement.VOLUME_CHANGE);
    },

    /**
     * Init media element for EME
     * @return {String} the prefix of current browser(webkit..)
     */
    initForEME: function() {
      if (this._initializedForEME) return;

      this._initializedForEME = true;

      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.NEED_KEY, this._onNeedKey.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError.bind(this));
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.NEED_KEY
     * @param  {Event} event
     * @fires HP.Events.MediaElement.NEED_KEY
     */
    _onNeedKey: function(event) {
      this.trigger(HP.Events.MediaElement.NEED_KEY, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.KEY_MESSAGE
     * @param  {Event} event
     * @fires HP.Events.MediaElement.KEY_MESSAGE
     */
    _onKeyMessage: function(event) {
      this.trigger(HP.Events.MediaElement.KEY_MESSAGE, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.KEY_ERROR
     * @param  {Event} event
     * @fires HP.Events.MediaElement.KEY_ERROR
     */
    _onKeyError: function(event) {
      this.trigger(HP.Events.MediaElement.KEY_ERROR, event);
    },

    _onDurationChanged: function(event) {
      this.trigger(HP.Events.MediaElement.DURATION_CHANGE, event);
    },

    _onLoadedMetadata: function(event) {
      this.trigger(HP.Events.MediaElement.LOADED_METADATA, event);
    },

    /**
     * Consider whether the player can play this type of video
     * @param  {String} type the video type
     * @param  {String} keySystem key systeam for the EME
     * @return {Boolean} True it can play
     */
    canPlayType: function(type, keySystem) {
      return this._videoTag.canPlayType(type, keySystem);
    },

    /**
     * Get the MediaKeys
     * @return {MediaKeys} the MediaKeys
     */
    getMediaKeys: function() {
      if(window.MSMediaKeys) {
        return this._videoTag.msKeys;
      } else {
        return this._videoTag.keys;
      }
    },

    /**
     * Set the MediaKeys
     * @param  {MediaKeys} mediaKeys the MediaKeys
     */
    setMediaKeys: function(mediaKeys) {
      this._videoTag.setMediaKeys(mediaKeys);
    },

    /**
     * Generate MediaKey request
     * @param  {String} keySystem the key system
     * @param  {ArrayBuffer} initData the init data
     */
    generateKeyRequest: function(keySystem, initData) {
      this._videoTag.generateKeyRequest(keySystem, initData);
    },

    /**
     * Add key to player
     * @param  {String} keySystem the key system
     * @param  {String} license the license
     * @param  {ArrayBuffer} initData the init data
     * @param  {MediaKeySession} session the MediaKeySession
     */
    addKey: function(keySystem, license, initData, session) {
      this._videoTag.addKey(keySystem, license, initData, session);
    },

    /**
     * Load video
     * @param  {String} src video source
     */
    load: function(src) {
      HP.Logger.log('mediaElement load COMMAND: videoTag.load() - ' + src);
      this._videoTag.src = src;
      this._videoTag.load();
    },

    /**
     * Indicate whether the player has been paused
     * @return {Boolean} whether the player has been paused
     */
    isPaused: function() {
      return this._videoTag.paused;
    },

    /**
     * Indicate whether the video meets the end.
     * @return {Boolean}
     */
    isEnded: function() {
      return this._videoTag.ended && (this._videoTag.duration - this._videoTag.currentTime < 0.001);
    },

    /**
     * Indicate whether the video is seeking.
     * @return {Boolean}
     */
    isSeeking: function() {
      return this._videoTag.seeking;
    },

    /**
     * Returns a value that expresses the current state of the element with respect to rendering the current playback position
     * @return {Number} a value that expresses the current state of the element with respect to rendering the current playback position
     */
    getReadyState: function() {
      return this._videoTag.readyState;
    }
  }).implement(HP.Interfaces.IMediaElement)
}).call(this);