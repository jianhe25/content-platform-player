(function() {
  var PLAY_TIMEOUT = 200;

  HP.VideoPlayer.MobileVideoPlayer = HP.VideoPlayer.BaseVideoPlayer.extend(
  /** @lends HP.VideoPlayer.MobileVideoPlayer.prototype */
  {
    _checkStartPosition: false,
    _firstZeroTimeUpdate: false,
    _checkPlayingTimer: -1,

  	constructor: function(mediaElement) {
      this._super(mediaElement);
      try {
        this.mediaElement.play();
        this.mediaElement.pause();
      } catch (e) {
      }
    },

    onTimeUpdate: function() {
      //Resume video from non-fullscreen to fullscreen will fire a timeupdate event with the position 0, and we should also consider the case that user seeks to 0.
      if(HP.Utils.isFullscreen() && HP.Utils.Mobile.isIOS() && HP.Utils.Mobile.isPhone() && HP.Utils.Mobile.getIOSVersion() >= 7 && this.mediaElement.getPosition() == 0 && this._firstZeroTimeUpdate) {
        this._checkStartPosition = true;
        this._firstZeroTimeUpdate = false;
      }

      //Checku two cases:
      //1. Resume video from non-fullscreen to fullscreen on IOS 7
      //2. Resume video after ad break on IOS
      if(this._checkStartPosition && Math.abs(this.mediaElement.getPosition() - this.getPosition()) > 1000) {
        if(this.getState() != HP.VideoPlayer.State.LOADING) {
          this.seek(this.getPosition());
        }
        return;
      }

      this._checkStartPosition = false;

      if(this.getState() == HP.VideoPlayer.State.SEEKING && !this.mediaElement.isPaused()) {
        this.onSeeked();
      }

      // 1. When player source is chagned, it will fire a timeupdate event with the position 0 and duration NaN, we should ignore this event
      // 2. When player exits fullscreen on IOS, it will fire a timeupdate event with the position 0 and the player is paused.
      if (isNaN(this.mediaElement.getDuration()) || this.getState() == HP.VideoPlayer.State.SEEKING || this.autoSeekPending || this.mediaElement.isPaused()) {
        return;
      }
      this._hasTimeUpdate = true;
      this._position = this.mediaElement.getPosition();
      this.trigger(HP.Events.VideoPlayer.TIME_UPDATE, {position: this.getPosition(), duration: this.getDuration()});
    },

    onFullscreenChange: function(params) {
      this._super();
      if(params) {
        if(params.isFullscreen && HP.Utils.Mobile.isPhone() && HP.Utils.Mobile.isIOS() && this.playbackStartFired) {
          //Need handle the first time update 0 when resuming video into fullscreen
          this._firstZeroTimeUpdate = true;
          this.play();
        } else if(!params.isFullscreen && HP.Utils.Mobile.isIOS() && !this.playbackStartFired && window.Hulu && window.Hulu.videoPlayerApp && window.Hulu.videoPlayerApp.hideAndStop) {
          //Exit fullscreen when loading on IOS will let player into a strange state and hard to recover it.
          Hulu.videoPlayerApp.hideAndStop();
        }
      }
    },

    _onHttpProgress: function() {
      if (!this.isOwningElement() || HP.VideoPlayer.State.ENDED == this.getState()) {
        this.clearProgressTimer();
        return;
      }

      //For fullscreeen native player on IOS
      if(HP.Utils.isFullscreen() && HP.Utils.Mobile.isIOS() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        return;
      }

      this._super();
    },

    play: function(start) {
      this._super();
      this._checkPlayingTimer = window.setTimeout(this._checkPlaying.bind(this), PLAY_TIMEOUT);
    },

    _checkPlaying: function() {
      if (this.getState() != HP.VideoPlayer.State.PLAYING) {
        this.play();
      }
    },

    onCanPlay: function() {
      this._super();
      this._autoSeeking();
      this.play();
    },

    onCanPlayThrough: function() {
      this._super();
      this._autoSeeking();
      this.play();
    },

    stop: function() {
      window.clearTimeout(this._checkPlayingTimer);
      this._checkPlayingTimer = -1;
      this._super();
    },

    onAttachMediaElement: function() {
      this._super();
      //True if resume video from last position
      this._checkStartPosition = this.autoSeekPending;
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
        HP.Utils.NewSite.videoStateChange(state.replace("HP.VideoPlayer.State.", "").toLowerCase());
      }
    },

    onLoadedMetadata: function() {
       HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.MediaElement.LOADED_METADATA);
       this.play();
    },

    onEnded: function() {
      if(!this.mediaElement.isEnded()) {
        return;
      }
      this._super();
    },

    onError: function(event) {
      window.clearTimeout(this._checkPlayingTimer);
      this._checkPlayingTimer = -1;
      this._super(event);
    }
  })
}).call(this);