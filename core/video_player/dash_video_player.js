(function() {
  /**
   * The default maximum seconds of buffered
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_MAX_BUFFERED_SECS = 20;

  /**
   * The maximum retry time for requesting segment
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_RETRY_TIME = 1;

  /**
   * The number of milliseconds a segment request can take before receiving onload event.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_DONE_TIMEOUT = 10000;

  /**
   * The number of milliseconds a segment request can take before receiving onprogress event.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_PROGRESS_TIMEOUT = 8000;

  /**
   * Player will start playing when buffer length is greater than this variable
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_QUICK_START_SECS = 2;

  /**
   * Player will resume when buffer length is greater than this variable
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_RESUME_SECS = 5;

  /**
     * Player will trigger rebuffer event when buffer length is less than this variable.
     * @type {Number}
     * @constant
     * @protected
     */
  var DEFAULT_REBUFFER_SECS = 0.8;

  /**
     * The number of seconds till the end of range to detect the end of the segment.
     * @type {Number}
     * @constant
     * @protected
     */
  var DEFAULT_RANGE_END_SECS = 10; // this should be set to the length of a typical segment

  /**
   * The maximum re-connect time
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_STREAM_RETRY_TIME = 1;

  /**
   * Reason for reseting source buffer
   * @type {Object}
   * @constant
   * @private
   */
  var RESET_REASONS =  {
    MBR: "mbr",
    SEEK: "seek",
    STOP: "stop",
    DETACH: "detach"
  };

  HP.VideoPlayer.DashVideoPlayer = HP.VideoPlayer.BaseVideoPlayer.extend(
  /** @lends HP.VideoPlayer.DashVideoPlayer.prototype */
  {
    /**
     * Data of video sources
     * @type {HP.VideoPlayer.MPD}
     */
    _mpd: null,

    /**
     * DRM license URL
     * @type {String}
     * @private
     */
    _licenseUrl: null,

    /**
     * The content key For clearkey DRM
     * @type {String}
     * @private
     */
    _contentKey: null,

    /**
     * Metrics provider
     * @type {HP.VideoPlayer.MetricsProvider}
     */
    _metrics: null,

    /**
     * EMEHandler, to control playback of protected content
     * @type {HP.VideoPlayer.EMEHandler}
     */
    _emeHandler: null,

    /**
     * MediaSource, to allow JavaScript to generate media streams for playback
     * @type {MediaSource}
     */
    _mediaSource: null,

    /**
     * Save source buffer list in media souce
     * Fix for DASHJS-205: Playback ended abnormally
     * Save at local to avoid being cleared. Will still invesgate why.
     * @type {Array}
     */
    _sourceBuffers: null,

    /**
     * Player will resume when buffer length is greater than this variable
     * @type {Number}
     */
    _quickStartSecs: DEFAULT_QUICK_START_SECS,

    /**
     * Player will resume when buffer length is greater than this variable
     * @type {Number}
     */
    _resumeSecs: DEFAULT_RESUME_SECS,

    /**
     * Player will trigger rebuffer event when buffer length is less than this variable.
     * @type {Number}
     */
     _rebufferSecs: DEFAULT_REBUFFER_SECS,

    /**
     * The maximum seconds of buffered
     * @type {Number}
     */
    _maxBufferedSecs: DEFAULT_MAX_BUFFERED_SECS,

    /**
     * The number of milliseconds a segment request can take before receiving onload event.
     * @type {Number}
     */
    _xhrDoneTimeout: DEFAULT_XHR_DONE_TIMEOUT,

    /**
     * The number of milliseconds a segment request can take before receiving onprogress event.
     * @type {Number}
     */
    _xhrProgressTimeout: DEFAULT_XHR_PROGRESS_TIMEOUT,

    /**
     * The maximum retry time for requesting segment
     * @type {Number}
     * @constant
     * @private
     */
    _xhrRetryTime: DEFAULT_XHR_RETRY_TIME,

    /**
     * The maximum re-connect time
     * @type {Number}
     * @constant
     * @private
     */
    _streamRetryTime: DEFAULT_STREAM_RETRY_TIME,

    /**
     * The number of seconds till the end of range to detect the end of the segment.
     * @type {Number}
     */
     _rangeEndSecs: DEFAULT_RANGE_END_SECS,

    /**
     * Current type of video quality
     * @type {String}
     */
    _currentQualityType: null,

    /**
     * Current video quality
     * @type {VideoQuality}
     */
    _currentQuality: null,

    _retryTime: 0,

    _mpdUrl: null,

    /**
     * Save off the _mpdXhr incase we need to cancel it before it loads
     * @type {XMLHttpRequest}
     */
    _mpdXhr: null,

    log_prefix: "dash player",

    /**
     * Dash video player
     * @param  {HP.Interfaces.IMediaElement} MediaElement available MediaElement
     * @extends {HP.VideoPlayer.BaseVideoPlayer}
     * @constructs
     */
    constructor: function(mediaElement) {
      this._super(mediaElement);
    },

    /**
     * Load video by stream url
     * @param  {String} streamUrl video source
     * @param  {Object} options initialization configs {autoplayer, preload, startPosition}
     */
    load: function(streamUrl, options) {
      this.reset();
      if(/^(https?:\/\/)(\w|\/|\.)*(\.mpd)/.test(streamUrl)) {
        this._mpdUrl = streamUrl;
        this._createManifestXHR(options);
        this.setState(HP.VideoPlayer.State.LOADING);
      } else {
        this._super(streamUrl, options)
      }

    },

    _createManifestXHR: function(options, retryTime) {
      this._mpdXhr = new XMLHttpRequest();
      this._mpdXhr.options = options;
      this._mpdXhr.retryTime = retryTime || 0;
      this._mpdXhr.retryTimer = setTimeout(this._retryManifest.bind(this), this._xhrDoneTimeout);
      this._mpdXhr.addEventListener('load', this._onManifestLoad.bind(this));
      this._mpdXhr.addEventListener('error', this._retryManifest.bind(this));
      this._mpdXhr.open("GET", this._mpdUrl);
      this._mpdXhr.send();
    },

    _onManifestLoad: function() {
      clearTimeout(this._mpdXhr.retryTimer);
      this.loadByMpd(this._mpdXhr.responseText, this._mpdXhr.options);
      this._mpdXhr = null;
    },

    _retryManifest: function() {
      clearTimeout(this._mpdXhr.retryTimer);
      this._mpdXhr.abort();
      if(this._mpdXhr.retryTime >= this._xhrRetryTime) {
        this._mpdXhr = null;
        this.onError({type: HP.VideoPlayer.Error.MPD_LOAD_FAILURE});
      } else {
        this._createManifestXHR(this._mpdXhr.options, this._mpdXhr.retryTime + 1);
      }
    },

    /**
     * Initial configs
     * @param  {Object} options initialization configs
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Number}  [options.quickStartSecs=DEFAULT_QUICK_START_SECS] Player will start playing when buffer length is greater than this variable
     * @param  {Number}  [options.resumeSecs=DEFAULT_RESUME_SECS] Player will resume when buffer length is greater than this variable
     * @param  {Number} [options.rebufferSecs=DEFAULT_REBUFFER_SECS] Player will trigger rebuffer event when buffer length is less than this variable.
     * @param  {Number}  [options.maxBufferedSecs=DEFAULT_MAX_BUFFERED_SECS] The maximum seconds of buffered
     * @param  {Number}  [options.xhrDoneTimeout=DEFAULT_XHR_DONE_TIMEOUT] The number of milliseconds a segment request can take before receiving onload event.
     * @param  {Number}  [options.xhrProgressTimeout=DEFAULT_XHR_PROGRESS_TIMEOUT] The number of milliseconds a segment request can take before receiving onprogress event.
     * @param  {Number}  [options.xhrRetryTime=DEFAULT_XHR_RETRY_TIME] The maximum retry time for requesting segment.
     * @param  {Number}  [options.streamRetryTime=DEFAULT_STREAM_RETRY_TIME] The maximum re-connect time
     * @param  {Number}  [options.rangeEndSecs=DEFAULT_RANGE_END_SECS] The number of seconds till the end of range to detect the end of the segment
     * @param  {HP.VideoPlayer.VideoQuality.QualityType}  [options.initQualityType=HP.VideoPlayer.VideoQuality.QualityType.AUTO] The initial quality type
     * @param  {Object}  [options.externalTimeoutChecker] Timeout check for different state. Need to sort as follow
     *                                                    @partial "./external_timeout_checker.jsdoc"
     * @protected
     */
    initConfigs: function(options) {
      this._super(options);

      this._quickStartSecs = options.quickStartSecs || DEFAULT_QUICK_START_SECS;
      this._resumeSecs = options.resumeSecs || DEFAULT_RESUME_SECS;
      this._rebufferSecs = options.rebufferSecs || DEFAULT_REBUFFER_SECS;
      this._maxBufferedSecs = options.maxBufferedSecs || DEFAULT_MAX_BUFFERED_SECS;
      this._xhrDoneTimeout = options.xhrDoneTimeout || DEFAULT_XHR_DONE_TIMEOUT;
      this._xhrProgressTimeout = options.xhrProgressTimeout || DEFAULT_XHR_PROGRESS_TIMEOUT;
      this._xhrRetryTime = options.xhrRetryTime || DEFAULT_XHR_RETRY_TIME;
      this._streamRetryTime = options.streamRetryTime || DEFAULT_STREAM_RETRY_TIME;
      this._rangeEndSecs = options.rangeEndSecs || DEFAULT_RANGE_END_SECS;
      this._currentQualityType = options.initQualityType || HP.VideoPlayer.VideoQuality.QualityType.AUTO;
      this._currentQuality = null;
      this._sourceBuffers = [];
      this._retryTime = 0;
      this._mpdUrl = null;

      this.playbackStartFired = false;
    },

    /**
     * Load video by mpd xml
     * @param  {String} mpdXML mpd xml text
     * @param  {Object} options initialization options<a name="loadByMpd.options"></a>
     * @param  {String} [options.licenseUrl] DRM License URL, required for encrypted content
     * @param  {String} [options.contentKey] DRM Content Key, required for encrypted content
     * @param  {String} [options.mpdXML] String blob of the MPD xml, must specify either mpdXML or mpd
     * @param  {Boolean} [options.autoplay=false] Whethe auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Number}  [options.quickStartSecs=DEFAULT_QUICK_START_SECS] Player will start playing when buffer length is greater than this variable
     * @param  {Number}  [options.resumeSecs=DEFAULT_RESUME_SECS] Player will resume when buffer length is greater than this variable
     * @param  {Number} [options.rebufferSecs=DEFAULT_REBUFFER_SECS] Player will trigger rebuffer event when buffer length is less than this variable.
     * @param  {Number}  [options.maxBufferedSecs=DEFAULT_MAX_BUFFERED_SECS] The maximum seconds of buffered
     * @param  {Number}  [options.xhrDoneTimeout=DEFAULT_XHR_DONE_TIMEOUT] The number of milliseconds a segment request can take before receiving onload event.
     * @param  {Number}  [options.xhrProgressTimeout=DEFAULT_XHR_PROGRESS_TIMEOUT] The number of milliseconds a segment request can take before receiving onprogress event.
     * @param  {Number}  [options.xhrRetryTime=DEFAULT_XHR_RETRY_TIME] The maximum retry time for requesting segment.
     * @param  {Number}  [options.streamRetryTime=DEFAULT_STREAM_RETRY_TIME] The maximum re-connect time
     * @param  {Number}  [options.rangeEndSecs=DEFAULT_RANGE_END_SECS] The number of seconds till the end of range to detect the end of the segment
     * @param  {Number}  [options.initBandwidth] The initial bandwidth
     * @param  {HP.VideoPlayer.VideoQuality.QualityType}  [options.initQualityType=HP.VideoPlayer.VideoQuality.QualityType.AUTO] The initial quality type
     * @param  {HP.VideoPlayer.MPD} [options.mpd] MPD object, must specify either mpdXML or mpd
     * @param  {HP.VideoPlayer.MBRHandler} [options.mbrHandler] Custom MBRHandler
     * @param  {HP.VideoPlayer.MetricsProvider} [options.metricsProvider] Custom MetricsProvider
     * @param  {Array}  [options.externalTimeoutChecker] <a name="externalTimeoutChecker"></a>
     *                                                   Timeout check for different state. Need to sort as follow
     *                                                   @partial "./external_timeout_checker.jsdoc"
     */
    loadByMpd: function(mpdXML, options) {
      options = options || {};

      this.initConfigs(options);

      this._licenseUrl = options.licenseUrl;
      this._contentKey = options.contentKey;
      this._mpdUrl = options.mpdUrl;
      this.httpUrl = null;

      try {
        this._mpd = options.mpd || new HP.VideoPlayer.MPD(mpdXML, options.mpdUrl || "");
      } catch(ex) {
        this.onError(ex);
        return;
      }

      if(options.mbrHandler) {
        this._mbrHandler = options.mbrHandler;
      } else {
        this._mbrHandler = new HP.VideoPlayer.MBRHandler();
        this._mbrHandler.addSwitchingRule(new HP.VideoPlayer.BandwidthSwitchingRule());
      }

      this._metrics = options.metricsProvider || new HP.VideoPlayer.MetricsProvider(this.mediaElement);
      this._metrics.init({initBandwidth: options.initBandwidth});
      this._metrics.on(HP.Events.MetricsProvider.METRICS_UPDATE, this._onMetricsUpdate, this);
      this._metrics.on(HP.Events.MetricsProvider.BANDWIDTH_OVER_ESTIMATED, this._onBandwidthOverEstimated, this);

      if (options.preload) {
        this.preload();
      } else {
        this.mediaElement.attach(this);
      }
    },

    /**
     * Preload video data and won't play
     */
    preload: function() {
      this._generateSourceBuffers();

      this.switchQuality(this._currentQualityType);

      if (this.progressTimer == -1) {
        this.progressTimer = window.setInterval(this._onPreload.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);
      }

      this.setState(HP.VideoPlayer.State.LOADING);
    },

    /**
     * Called when attach to the media element
     * @protected
     */
    onAttachMediaElement: function() {
      if(this.httpUrl) {
        this._super();
      } else {
        this.clearProgressTimer();

        this.firstBufferFull = false;
        this.autoSeekPending = this.getPosition() > 0 ? true : false;

        this._emeHandler = new HP.VideoPlayer.EMEHandler(this.mediaElement, this._licenseUrl, this._contentKey);
        this._emeHandler.on(HP.Events.EME.ERROR, this.onError, this);

        this._mediaSource = new MediaSource();

        HP.NativeEventHelper.bind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);

        this.mediaElement.addMediaSource(this._mediaSource);

        this.setState(HP.VideoPlayer.State.LOADING);
      }
    },

    /**
     * Called when detach from the media element
     * @protected
     */
    onDetachMediaElement: function() {
      if(this.httpUrl) {
        this._super();
      } else {
        this.clearProgressTimer();

        this._closeSource(RESET_REASONS.DETACH);

        if (this._emeHandler != null) {
          this._emeHandler.off(HP.Events.EME.ERROR, this.onError, this);
          this._emeHandler.dispose();
          this._emeHandler = null;
        }

        if (this._mediaSource != null) {
          HP.NativeEventHelper.unbind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);
          this._mediaSource = null;
        }
      }
    },

    /**
     * Init sourceBuffers and quality when HP.Events.MediaSource.SOURCE_OPEN
     */
    _onSourceOpen: function(event) {
      if (!this.isOwningElement()) return;

      this.clearProgressTimer();
      this.progressTimer = window.setInterval(this._onDashProgress.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);

      this._mediaSource.duration = this._mpd.getDuration();

      this._generateSourceBuffers();

      this.switchQuality(this._currentQualityType);

      //Just call once when mediaSource first changes state from closed to open. No need to call this when mediaSource changes state from ended to open.
      HP.NativeEventHelper.unbind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);
    },

    /**
     * Reset all source buffer when HP.Events.MediaElement.SEEKING
     */
    onSeeking: function() {
      this._super();
      if(this._mediaSource && this._mediaSource.sourceBuffers) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          this._resetSourceBuffer(this._mediaSource.sourceBuffers[i], RESET_REASONS.SEEK);
        }
      }
    },

    /**
     * Aborts the current segment of the given source buffer
     * @param  {SourceBuffer} buf source buffer
     * @param  {String} reason why to reset
     */
    _resetSourceBuffer: function(buf, reason) {
      HP.Logger.log('resetSourceBuffer for ' + reason);

      switch(reason) {
        case RESET_REASONS.DETACH:
        case RESET_REASONS.STOP:
          if (this._isSourceOpen()) {
            buf.abort();
          }
        case RESET_REASONS.SEEK:
          if (buf.xhr != null) {
            clearTimeout(buf.xhr.doneRetryTimer);
            clearTimeout(buf.xhr.progressRetryTimer);
            buf.xhr.abort();
            buf.xhr = null;
          }
          if (buf.mime.indexOf('video') >= 0) {
            this._metrics.resetBufferLength();
          }
          buf.queue = [];
          buf.segIdx = null;
        case RESET_REASONS.MBR:
        default:
          buf.lastInit = null;
          break;
      }
    },

    /**
     * Check buffer on each progress timer
     */
    _onDashProgress: function() {
      //Hack: sometimes html media element fails to fire the "ended" event when video is completed.
      //      Even the ended property on videotag is true and mediasource readystate is ended. This
      //      makes video player cannot ended correctly. So add a check here to fore the player end.
      if(HP.VideoPlayer.State.PLAYING == this.getState() && this.mediaElement.isEnded() && "ended" == this._mediaSource.readyState) {
        this.onEnded();
      }

      if (!this.isOwningElement() || HP.VideoPlayer.State.ENDED == this.getState() || !this._isSourceOpen()) {
        this.clearProgressTimer();
        return;
      }

      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      var ended = true;
      var ranges = new Array();
      for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
        var buf = this._mediaSource.sourceBuffers[i];
        var rep = buf.reps[buf.currentRep];

        if(!this._isRepReady(rep)) {
          return;
        }

        if (this._isSourceOpen() && buf.queue.length > 0) {
          if (buf.lastInit != rep.init) {
            this._appendInit(buf, rep.init);
          } else if (buf.appendBuffer && !buf.updating) {
            this._appendBuffer(buf, buf.queue.shift());
          }

          if (!buf.appendBuffer) {
            while(buf.queue.length > 0) {
              buf.append(new Uint8Array(buf.queue.shift()));
            }
          }
        }

        ended &= (rep.index && buf.segIdx >= rep.index.getCount());

        this._fetchNextFragment(buf);

        ranges.push(this._findRangeForPlaybackTime(buf.buffered, this.getPosition()/1000));

        if (buf.mime.indexOf('video') >= 0) {
            this._updateBufferLength(buf);
        }
      }

      this.checkTimeout();

      if (HP.VideoPlayer.State.SEEKING != this.getState()) {
        this._checkDashBuffer(ranges);
      }

      if(ended) {
        this._endOfStream(false);
      }
    },

    _onPreload: function() {
      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      for (var i = 0; i < this._sourceBuffers.length; i++) {
        var buf = this._sourceBuffers[i];

        if(!this._isRepReady(buf.reps[buf.currentRep])) {
          return;
        }

        this._fetchNextFragment(buf);
      }
    },

    _isRepReady: function(rep) {
      if(rep.error) {
        if(rep.error["http_status"] == 404) {
          buf.allQualities.splice(buf.currentRep, 1);
          buf.reps.splice(buf.currentRep, 1);
          if(buf.reps.length == 0) {
            this.onError(rep.error);
          } else if(buf.mime.indexOf('video') >= 0) {
            this.switchQuality(this._currentQualityType);
          }
        } else {
          this.onError(rep.error);
        }
        return false;
      }

      if(rep.init.value == null || rep.index == null) {
        return false;
      }

      return true;
    },

    /**
     * Fetch next fragment for the given source buffer
     * @param  {SourceBuffer} buf source buffer
     */
    _fetchNextFragment: function(buf) {
      if (buf.xhr) {
        return;
      }

      var rep = buf.reps[buf.currentRep];

      if(rep.index && buf.segIdx >= rep.index.getCount()) {
        return;
      }

      var append_time;
      if (!this._isSourceClosed()) {
        var time = this.getPosition() / 1000;
        var range = this._findRangeForPlaybackTime(buf.buffered, time);
        append_time = (range && range.end) || time;
        if (append_time > time + this._maxBufferedSecs) {
          return;
        }

        if(this._adaptQuality(buf)) {
          return;
        }

      } else {
        if (buf.queue.length >= 2) {
          return;
        }
        append_time = this.getPosition()/1000;
      }

      if (buf.segIdx == null) {
        buf.segIdx = Math.max(0, rep.index.findForTime(append_time));
      } else {
        if (range == null) {
          // If buf.segIdx is set, we're continuing to append data consecutively
          // from some previous point, as opposed to choosing a new location to
          // start appending from. The only reason a the playback head *should* be
          // outside of a buffered region is that we've seeked, which should have
          // triggered an append location change if the current head fell outside
          // of a buffered region (or in the future, if the current buffered region
          // has content from a different quality level - but we don't track that
          // yet or flush the buffer on quality change). It's normal to see this
          // message once or maybe even twice after a seek, since seeking near the
          // end of a high-bitrate segment may mean the first append didn't cover
          // the full time between segment start and current time, but seeing this
          // any more than that is a pretty big error.
          // Seeing this outside of a seek means something's lying, or we
          // underflowed and playback didn't stall.
          HP.Logger.log(this.log_prefix + ": Current playback head outside of buffer in append-continue state.");
        }
      }
      var offset = rep.index.getOffset(buf.segIdx);
      var size = rep.index.getByteLength(buf.segIdx);
      var xhr = this._createXHR(buf, rep.url, offset, offset + size - 1, rep.init);
    },

    /**
     * Create XMLHttpRequest
     * @param  {SourceBuffer} buf source buffer
     * @param  {String} url the url of request
     * @param  {Float64} start the offset of start
     * @param  {Float64} end th offest of end
     * @param  {Object}  initRef the init data of the given source buffer
     * @return {XMLHttpRequest} the created xhr
     */
    _createXHR: function(buf, url, start, end, initRef, retryTime) {
      if (url == null) {
        throw "Null URL";
      }

      var xhr = new XMLHttpRequest();
      xhr.open("GET", url);

      var range = this._createRange(start, end);
      if (range != null) {
        xhr.setRequestHeader('Range', range);
      }

      xhr.responseType = 'arraybuffer';
      xhr.startByte = start;
      xhr.endByte = end;
      xhr.buf = buf;
      xhr.init = initRef;
      xhr.url = url;
      xhr.startTime = (new Date()).getTime();
      xhr.retryTime = retryTime || 0;
      xhr.doneRetryTimer = setTimeout(this._retryXHR.bind(this, xhr),
        this._metrics.getAverageBandwidth() > 0 ?
        Math.max(2 * 8 * 1000 * (end - start) / this._metrics.getAverageBandwidth(), this._xhrDoneTimeout) :
        this._xhrDoneTimeout
      );
      xhr.progressRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), this._xhrProgressTimeout);
      xhr.isPreload = this._isSourceClosed();
      xhr.addEventListener('load', this._onXHRLoad.bind(this));
      xhr.addEventListener('progress', this._onXHRProgress.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      buf.xhr = xhr;

      xhr.send();

      return xhr;
    },

    /**
     * Create range for XMLHttpRequest's header
     * @param  {Float64} start the offset of start
     * @param  {Float64} end th offest of end
     * @return {String} the created range
     */
    _createRange:function (start, end) {
      if (start != null && end != null) {
        return 'bytes=' + start + '-' + end;
      }
      return null;
    },

    /**
     * Handle data when load event
     * @param  {XMLHttpRequest.Event} evt the event
     */
    _onXHRLoad: function(evt) {
      var xhr = evt.target;
      clearTimeout(xhr.doneRetryTimer);
      clearTimeout(xhr.progressRetryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var buf = xhr.buf;
      buf.xhr = null;

      var endTime = (new Date()).getTime();
      var ellapsedTime = endTime - xhr.startTime;
      if (xhr.startTime != null && endTime >= xhr.startTime) {
        //ellapsedTime = Math.max((ellapsedTime - 150), Math.min(50, ellapsedTime));
        //var bandwidth = 8 * 1000 * (new Uint8Array(xhr.response)).length / ellapsedTime; // use xhr.response.byteLength?
        this._metrics.updateBandwidth(xhr.response.byteLength, (endTime - xhr.startTime) / 1000, buf.mime.indexOf('audio') < 0);
      }

      if (buf.lastInit !== xhr.init) {
        this._appendInit(buf, xhr.init);
      }

      this._queueAppend(buf, xhr.response, xhr.isPreload);
      buf.segIdx++;
    },

    _onXHRProgress: function(evt) {
      var xhr = evt.target;

      if (xhr.readyState == xhr.LOADING) {
        clearTimeout(xhr.progressRetryTimer);
        xhr.progressRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), this._xhrProgressTimeout);
      }
    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.doneRetryTimer);
      clearTimeout(xhr.progressRetryTimer);

      var status = "";

      try {
        // xhr.status might throw exception if it's not completed
        status = xhr.status;
      } catch (ex) {
      }
      xhr.abort();

      this._forceSwitchQualityDownHalf(xhr.buf);

      if(this._adaptQuality(xhr.buf)) {
        var buf = xhr.buf;
        buf.xhr = null;
        return;
      }

      if(xhr.retryTime >= this._xhrRetryTime) {
        if(status == 404) {
          var buf = xhr.buf;
          buf.allQualities.splice(buf.currentRep, 1);
          buf.reps.splice(buf.currentRep, 1);
          if(buf.reps.length == 0) {
            this.onError({type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1});
          } else if(buf.mime.indexOf('video') >= 0) {
            this.switchQuality(this._currentQualityType);
          }
        } else {
          this.onError({type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1});
        }
      } else {
        this._createXHR(xhr.buf, xhr.url, xhr.startByte, xhr.endByte, xhr.init, xhr.retryTime + 1);
      }
    },

    /**
     * Append init data to source buffer
     * @param  {SourceBUffer} buf the given source buffer
     * @param  {Uint8Array} init the initdata
     */
    _appendInit: function(buf, init) {
      if (!this._isSourceClosed()) {
        buf.timestampOffset = -buf.reps[buf.currentRep].index.getStartTime(0);
        this._queueAppend(buf, init.value);
        buf.lastInit = init;
      }
    },

    /**
     * Append data to the queue of the given source buffer
     * @param  {SourceBuffer} buf the given source buffer
     * @param  {ArrayBuffer} val data to be appended
     * @param  {Boolean} isPreload Indicate whether the data is requested for preload
     */
    _queueAppend: function(buf, val, isPreload) {
      if (!isPreload) {
        if (buf.updating) {
          buf.queue.push(val);
        } else if (buf.appendBuffer) {
          this._appendBuffer(buf, val);
        } else {
          buf.append(new Uint8Array(val));
          this._updateBufferLength(buf);
        }
      } else {
        buf.queue.push(val);
      }
    },

    _appendBuffer: function(buf, val) {
      for(var attempts = 0; attempts < 2; attempts++) {
        try {
          buf.appendBuffer(val);
          break;
        } catch (ex) {
          //The video tag of IE browsers has met invalid state error when appending data to source buffers.
          //Still not know why this happens and in order to not break the preload logic, we can only retry appending one time for it.
          HP.Logger.warn('InvalidState error when appending data to source buffers');
        }
      }
      if(attempts == 2) {
        this.onError({type: HP.VideoPlayer.Error.MEDIA_TIMEOUT_ERROR});
      }
    },

    _generateSourceBuffers: function() {
      if (!this._isSourceClosed()) {
        //MediaSource changes state from ended to open when replaying
        if (this._mediaSource.sourceBuffers.length) {
          this._sourceBuffers = [];
          for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
            var buf = this._mediaSource.sourceBuffers[i];
            this._sourceBuffers.push(buf);
          }
          return;
        } else if(this._sourceBuffers.length) {
        //Have preloaded data when MediaSource changes state to open
          for (var i = 0; i < this._sourceBuffers.length; i++) {
            var oldBuf = this._sourceBuffers[i];
            var buf = this._mediaSource.addSourceBuffer(oldBuf.mime + '; codecs="' + oldBuf.codecs + '"');

            buf = HP.Utils.extend(buf, {
              reps: oldBuf.reps,
              currentRep: oldBuf.currentRep,
              mime: oldBuf.mime,
              codecs: oldBuf.codecs,
              queue: oldBuf.queue,
              segIdx: oldBuf.segIdx,
              lastInit: oldBuf.lastInit,
              allQualities: oldBuf.allQualities,
              availableQualities: oldBuf.availableQualities
            });

            if (oldBuf.xhr != null) {
              buf.xhr = oldBuf.xhr;
              buf.xhr.buf = buf;
            }

            if (buf.appendBuffer) {
              buf.addEventListener('updateend', this._onBufferUpdateEnd.bind(this, buf));
            }

            this._sourceBuffers[i] = buf;
          }
          return;
        }
      }

      this._sourceBuffers = [];
      var adaptationSets = this._mpd.getAdaptationSets();
      for (var i = 0; i < adaptationSets.length; i++) {
        var aset = adaptationSets[i];
        var reps = aset.representations.slice(0);
        var mime = aset.mimeType;
        var codecs = aset.codecs;
        var allQualities = this._generateQualities(reps);

        var buf = {};

        if (this._isSourceOpen()) {
          buf = this._mediaSource.addSourceBuffer(mime + '; codecs="' + codecs + '"');
        }

        buf = HP.Utils.extend(buf, {
          reps: reps,
          currentRep: mime.indexOf('video') >= 0 ? -1 : 0,
          mime: mime,
          codecs: codecs,
          queue: [],
          segIdx: null,
          lastInit: null,
          allQualities: allQualities
        });

        if (buf.appendBuffer) {
          buf.addEventListener('updateend', this._onBufferUpdateEnd.bind(this, buf));
        }

        this._sourceBuffers.push(buf);
      }
    },

    _generateQualities: function(reps) {
      var qualities = [];
      for (var index = 0; index < reps.length; index++) {
        var rep = reps[index];
        var videoQuality = new HP.VideoPlayer.VideoQuality({
          bitRate: Math.round(rep.bandwidth / 1024),
          height: rep.height
        });
        qualities.push(videoQuality);
      }
      return qualities;
    },

    /**
     * Adapt quality of source buffer
     * @param  {SourceBuffer} buf the target source buffer
     * @return {Boolean} if the quality is actually changed
     */
    _adaptQuality: function(buf) {
      if(buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 0) {
        var adaptQuality;
        if(buf.availableQualities.length > 1) {
          adaptQuality = this._mbrHandler.adaptCurrentQuality(this._metrics, buf.availableQualities);
        } else {
          adaptQuality = buf.availableQualities[0];
        }
        var adaptQualityIndex = buf.allQualities.indexOf(adaptQuality);
        if(adaptQualityIndex != buf.currentRep && adaptQualityIndex != -1) {
          this._resetSourceBuffer(buf, RESET_REASONS.MBR);
          buf.currentRep = adaptQualityIndex;
          this._currentQuality = adaptQuality;
          this.trigger(HP.Events.VideoPlayer.QUALITY_CHANGED, adaptQuality, this._currentQualityType == HP.VideoPlayer.VideoQuality.QualityType.AUTO ? this._mbrHandler.getReason() : 'user manually changes to ' + this._currentQualityType);
          HP.Logger.log(this.log_prefix + ' switch quality to ' + this._currentQuality.getBitRate());
          return true;
        }
      }
      return false;
    },

    /**
     * Switch video quality
     * @param  {string} qualityType 'low, medium, high, HD, auto'
     */
    switchQuality: function(qualityType) {
      var currentQualitiesTypes = this._mpd.getAvailableQualitiesTypes();
      if(currentQualitiesTypes.length == 0) {
        return;
      }
      //open mbr as default.
      if(!HP.VideoPlayer.VideoQuality.isValidQualityType(qualityType)) {
        qualityType = HP.VideoPlayer.VideoQuality.QualityType.AUTO;
      }
      //if user prefer quality is not available, select the nearest higher quality.
      if (qualityType != HP.VideoPlayer.VideoQuality.QualityType.AUTO && currentQualitiesTypes.indexOf(qualityType) < 0) {
        var priorities = [
          HP.VideoPlayer.VideoQuality.QualityType.LOW,
          HP.VideoPlayer.VideoQuality.QualityType.MEDIUM,
          HP.VideoPlayer.VideoQuality.QualityType.HIGH,
          HP.VideoPlayer.VideoQuality.QualityType.HD];
        var targetQualityPriority = priorities.indexOf(qualityType);
        for (var i = 0; i < currentQualitiesTypes.length; ++i) {
          if (priorities.indexOf(currentQualitiesTypes[i]) > targetQualityPriority) {
            qualityType = currentQualitiesTypes[i];
            break;
          }
        }
        if (i == currentQualitiesTypes.length) {
          qualityType = currentQualitiesTypes[currentQualitiesTypes.length - 1];
        }
      }

      this._currentQualityType = qualityType;
      for (i = 0; i < this._sourceBuffers.length; i++) {
        var buf = this._sourceBuffers[i];
        if (buf.mime.indexOf('video') >= 0) {
          if(qualityType == HP.VideoPlayer.VideoQuality.QualityType.AUTO) {
            buf.availableQualities = buf.allQualities;
          } else {
            var availableQualities = [];
            for(var j = 0; j < buf.allQualities.length; j++) {
              if(buf.allQualities[j].getType() == qualityType) {
                availableQualities.push(buf.allQualities[j]);
              }
            }
            buf.availableQualities = availableQualities;
          }
          this._adaptQuality(buf);
        }
      }
    },

    /**
     * Returns current video quality
     * @return {string} current video quality
     */
    getCurentQuality: function() {
      return this._currentQuality;
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {
      this._closeSource(RESET_REASONS.STOP);
      this._super();
    },

    reset: function() {
      this._quickStartSecs = DEFAULT_QUICK_START_SECS;
      this._resumeSecs = DEFAULT_RESUME_SECS;
      this._rebufferSecs = DEFAULT_REBUFFER_SECS;
      this._maxBufferedSecs = DEFAULT_MAX_BUFFERED_SECS;
      this._xhrDoneTimeout = DEFAULT_XHR_DONE_TIMEOUT;
      this._xhrProgressTimeout = DEFAULT_XHR_PROGRESS_TIMEOUT;
      this._xhrRetryTime = DEFAULT_XHR_RETRY_TIME;
      this._streamRetryTime = DEFAULT_STREAM_RETRY_TIME;
      this._rangeEndSecs = DEFAULT_RANGE_END_SECS;
      this._licenseUrl = null;
      this._contentKey = null;
      this._retryTime = 0;
      this._mpdUrl = null;
      if (this._mpdXhr != null) {
        this._mpdXhr.abort();
        this._mpdXhr = null;
      }
      this._super();
    },

    _isSourceOpen: function() {
      return this._mediaSource && this._mediaSource.readyState == 'open';
    },

    _isSourceClosed: function() {
      return this._mediaSource == null || this._mediaSource.readyState == 'closed';
    },

    _closeSource: function(reason) {
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          this._resetSourceBuffer(this._mediaSource.sourceBuffers[i], reason);
        }
      }
      this._endOfStream(true);
    },

    _onMetricsUpdate: function(params) {
      this.trigger(HP.Events.VideoPlayer.METRICS_UPDATE, params);
    },

    _onBandwidthOverEstimated: function() {
      this._switchVideoQualityDown();
    },

    onError: function(event) {
      //In ad state, the content player will preload, but is not owning the media element. So we should not reload and trigger error event in this case.
      if(this.isOwningElement()) {
        if(this._retryTime < this._streamRetryTime) {
          this._retryTime++;
          this.trigger(HP.Events.VideoPlayer.RECONNECTING);
          this._sourceBuffers = [];
          this.mediaElement.detach(this);
          this.mediaElement.attach(this);
          this.play();
          return;
        }
        this._super(event);
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.TIME_UPDATE
     * @fires HP.Events.VideoPlayer.TIME_UPDATE
     * @protected
     */
    onTimeUpdate: function() {
      if (this.getState() == HP.VideoPlayer.State.PLAYING) {
        this._retryTime = 0;
      }
      this._super();
    },

    /**
     * Find the range of the given source buffer for a given playback time
     * @param  {TimeRanges} timeRanges buffered time ranges
     * @param  {Number} time the given playback time
     * @return {Object} range if the playback time is in one of the ranges of the given source buffer
     */
    _findRangeForPlaybackTime: function(timeRanges, time) {
      for (var i = 0; i < timeRanges.length; i++) {
        if (timeRanges.start(i) <= time && timeRanges.end(i) >= time) {
          return {start: timeRanges.start(i), end: timeRanges.end(i)};
        }
      }
    },

    /**
     * Check whether the buffer is enough to play
     * @param  {TimeRanges} ranges available time ranges
     */
    _checkDashBuffer: function(ranges) {
      var notEnoughBuffered = false;

      if(!ranges || ranges.length == 0) {
        notEnoughBuffered = true;
      }

      for(var i = 0; i < ranges.length && !notEnoughBuffered; i++) {
        var range = ranges[i];
        if (!range) {
          notEnoughBuffered = true;
        } else if (Math.abs(this.getDuration()/1000 - range.end) < this._rangeEndSecs) {
          continue;
        } else if (!this.firstBufferFull) {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._quickStartSecs);
        } else if (this.isRebuffering) {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._resumeSecs);
        } else {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._rebufferSecs);
        }
      }

      //For MediaKeys browser, seek in onLoadedMetadata event will cause exception. So move it to onCanPlayThrough
      if (window.MediaKeys && !notEnoughBuffered && this.autoSeekPending) {
        this._autoSeeking();
        return;
      }

      if (this.mediaElement.isPaused()) {
        if (this.autoPaused) {
          if (!notEnoughBuffered) {
            HP.Logger.log(this.log_prefix + ' checkDashBuffer COMMAND: mediaElement.play()');
            this.mediaElement.play();
          }
        }
      } else {
        if (notEnoughBuffered) {
          this.autoPausePending = true;
          HP.Logger.log(this.log_prefix + ' checkDashBuffer COMMAND: mediaElement.pause()');
          this.mediaElement.pause();
        }
      }

      this.hasEnoughBuffer = !notEnoughBuffered;
    },

    /**
     * Retures current video stream source
     * @return {String} current video stream source
     */
    getCurrentSource: function() {
      if(this.httpUrl) {
        return this.httpUrl;
      } else {
        return this._mpdUrl;
      }
    },

    _forceSwitchQualityDown: function(buf) {
      var adaptQuality;
      if (buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 1) {
        for (var i = 0; i < buf.availableQualities.length; i++) {
          if(buf.availableQualities[i].getBitRate() < this._currentQuality.getBitRate()) {
            adaptQuality = buf.availableQualities[i];
            continue;
          }
          break;
        }
      }

      if(adaptQuality) {
        this._metrics.resetBandwidth(adaptQuality.getSafeBandwidth());
      }
    },

    _forceSwitchQualityDownHalf: function(buf) {
      var adaptQuality;
      if (buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 1) {
        for (var i = 0; i < buf.availableQualities.length; i++) {
          if(buf.availableQualities[i].getBitRate() < this._currentQuality.getBitRate() * 0.5) {
            adaptQuality = buf.availableQualities[i];
            continue;
          }
          break;
        }
        if (i == 0 && this._currentQuality.getBitRate() != buf.availableQualities[0].getBitRate()) {
            adaptQuality = buf.availableQualities[0];
        }
      }

      if(adaptQuality) {
        this._metrics.resetBandwidth(adaptQuality.getSafeBandwidth());
      }
    },

    _switchVideoQualityDown: function() {
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          if(this._mediaSource.sourceBuffers[i].mime.indexOf('video') >= 0) {
            this._forceSwitchQualityDown(this._mediaSource.sourceBuffers[i]);
            break;
          }
        }
      }
    },

    onRebufferStart: function() {
      this._switchVideoQualityDown();
    },

    _endOfStream: function(force) {
      if(this._isSourceOpen()) {
        var updating = false;

        if(!force) {
          for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
            if(this._mediaSource.sourceBuffers[i].updating) {
              updating = true;
              break;
            }
          }
        }

        if(!updating) {
          this._mediaSource.endOfStream();
        }
      }
    },

    _updateBufferLength: function(buf) {
      if(buf.mime.indexOf('video') >= 0) {
        try {
          var time = this.getPosition() / 1000;
          var range = this._findRangeForPlaybackTime(buf.buffered, time);
          var append_time = (range && range.end) || time;
          this._metrics.updateBufferLength(append_time - time);
        } catch (ex) {
          HP.Logger.warn('InvalidState error when finding buffered data');
        }
      }
    },

    _onBufferUpdateEnd: function(buf) {
      this._updateBufferLength(buf);
      if (buf.queue.length) {
        this._appendBuffer(buf, buf.queue.shift());
      }
    },

    getRebufferParams: function(isRebuffering) {
      var time = this.getPosition() / 1000;
      var params = {
        'event': isRebuffering ? 'start' : 'end',
        'position': time
      };
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          var range = this._findRangeForPlaybackTime(this._mediaSource.sourceBuffers[i].buffered, time);
          var append_time = (range && range.end) || time;
          if(this._mediaSource.sourceBuffers[i].mime.indexOf('video') >= 0) {
            params['video_append_time'] = append_time;
          } else {
            params['audio_append_time'] = append_time;
          }
        }
      }

      if(this._currentQuality) {
        params['current_quality_type'] = this._currentQualityType;
        params['current_quality_bitrate'] = this._currentQuality.getBitRate();
        params['current_quality_safe_bandwidth'] = this._currentQuality.getSafeBandwidth();
      }

      params['current_avg_bandwidth'] = this._metrics.getAverageBandwidth();

      return params;
    }
  }).implement(HP.Interfaces.IDashVideoPlayer)
}).call(this);