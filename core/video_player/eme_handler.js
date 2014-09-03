(function() {
  /**
   * The retry time of a xhr request.
   * @type {Number}
   * @constant
   * @private
   */
  var XHR_MAX_RETRY_TIME = 1;

  /**
   * The number of milliseconds a request can take before automatically being terminated.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_TIMEOUT = 20000;

  function hex2a(ss) {
    var l = [];
    for (var i=0; i<=ss.length-1; i+=2) {
      l.push(parseInt("0x"+ss.substring(i,i+2)));
    }
    return new Uint8Array(l);
  };
  HP.VideoPlayer.EMEHandler = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.EMEHandler.prototype */
  {
    /**
     * Map from key to system
     * @type {Object}
     * @private
     */
    _keyToSystem: {
      'widevine': ['com.widevine.alpha'],
      'playready': ['com.youtube.playready', 'com.microsoft.playready'],
      'clearkey': ['webkit-org.w3.clearkey', 'org.w3.clearkey']
    },

    /**
     * Init data queue
     * @type {Array}
     * @private
     */
    _initDataQueue: [],

    /**
     * The current key
     * @type {String}
     * @private
     */
    _key: null,

    /**
     * The current key system
     * @type {String}
     * @private
     */
    _keySystem: null,

    /**
     * The current license server url
     * @type {String}
     * @private
     */
    _licenseServerURL: null,

    /**
     * The content key For clearkey DRM
     * @type {String}
     * @private
     */
    _contentKey: null,

    /**
     * The current mime type
     * @type {String}
     * @private
     */
    _mimeType: null,

    /**
     * Available MediaElement for playing
     * @type {HP.Interfaces.MediaElement}
     * @private
     */
    _mediaElement: null,

    /**
     * Whether it already has key (or send key request) in current session
     * @type {Boolean}
     * @private
     */
    _hasKey: false,

    /**
     * The active media key session
     * @type {MediaKeySession}
     * @private
     */
    _mediaKeySession: null,

    /**
     * EME Handler, to control playback of protected content
     * @param  {HP.Interfaces.IMediaElement} mediaElement available MediaElement
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(mediaElement, licenseUrl, contentKey) {
      this._mediaElement = mediaElement;
      this._licenseServerURL = licenseUrl;
      this._contentKey = contentKey

      this._init();
    },

    /**
     * Dispose the handler
     */
    dispose: function() {
      if(this._mediaKeySession) {
        HP.NativeEventHelper.unbind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage, this);
        HP.NativeEventHelper.unbind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError, this);
        this._mediaKeySession.close();
        this._mediaKeySession = null;
      }

      this._mediaElement.off(HP.Events.MediaElement.NEED_KEY, this._onNeedKey, this);
      this._mediaElement.off(HP.Events.MediaElement.KEY_MESSAGE, this._onKeyMessage, this);
      this._mediaElement.off(HP.Events.MediaElement.KEY_ERROR, this._onKeyError, this);
      this._mediaElement = null;
      this._hasKey = false;
    },

    /**
     * Init key system
     * @param  {String} mimeType the mime type of video
     */
    _init: function() {
      this._mediaElement.initForEME();

      this._mediaElement.on(HP.Events.MediaElement.NEED_KEY, this._onNeedKey, this);
      this._mediaElement.on(HP.Events.MediaElement.KEY_MESSAGE, this._onKeyMessage, this);
      this._mediaElement.on(HP.Events.MediaElement.KEY_ERROR, this._onKeyError, this);

      this._selectKeySystem('video/mp4');
    },

    /**
     * Selected ky system
     * @param  {String} mimeType the mime type of video
     */
    _selectKeySystem: function(mimeType) {
      for (var key in this._keyToSystem) {
        var systems = this._keyToSystem[key];
        if (!systems) {
          continue;
        }

        for (var i in systems) {
          if (window.MediaKeys && MediaKeys.isTypeSupported) {
            if(!MediaKeys.isTypeSupported(systems[i], mimeType)) {
              continue;
            }
          } else if (!this._mediaElement.canPlayType(mimeType, systems[i])) {
            continue;
          }
          this._key = key;
          this._keySystem = systems[i];
          this._mimeType = mimeType;
          return;
        }
      }
      this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_UNSUPPORTED_ERROR, 'keySystem': this._keySystem});
    },

    _extractBMFFClearKeyID: function(initData) {
      // Accessing the Uint8Array's underlying ArrayBuffer is impossible, so we
      // copy it to a new one for parsing.
      var abuf = new ArrayBuffer(initData.length);
      var view = new Uint8Array(abuf);
      view.set(initData);

      var dv = new DataView(abuf);
      var pos = 0;
      while (pos < abuf.byteLength) {
        var box_size = dv.getUint32(pos, false);
        var type = dv.getUint32(pos + 4, false);

        if (type != 0x70737368) {
          HP.Logger.log('Box type ' + type.toString(16) + ' not equal to "pssh"');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        // Scan for Clear Key header
        if ((dv.getUint32(pos + 12, false) == 0x58147ec8) &&
            (dv.getUint32(pos + 16, false) == 0x04234659) &&
            (dv.getUint32(pos + 20, false) == 0x92e6f52c) &&
            (dv.getUint32(pos + 24, false) == 0x5ce8c3cc)) {
          var size = dv.getUint32(pos + 28, false);
          if (size != 16) {
            HP.Logger.log('Unexpected KID size ' + size);

            this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
          }
          return new Uint8Array(abuf.slice(pos + 32, pos + 32 + size));
        }

        // Failing that, scan for Widevine protobuf header
        if ((dv.getUint32(pos + 12, false) == 0xedef8ba9) &&
            (dv.getUint32(pos + 16, false) == 0x79d64ace) &&
            (dv.getUint32(pos + 20, false) == 0xa3c827dc) &&
            (dv.getUint32(pos + 24, false) == 0xd51d21ed)) {
          return new Uint8Array(abuf.slice(pos + 36, pos + 52));
        }
        pos += box_size;
      }
      // Couldn't find it, give up hope.
      return initData;
    },

    /**
     * Handle data when HP.Events.MediaElement.NEED_KEY
     * @param  {Event} event
     */
    _onNeedKey: function(event) {
      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.NEED_KEY + ' - ' + this._keySystem);

      if (!this._keySystem) {
        this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_UNSUPPORTED_ERROR, 'keySystem': this._keySystem});
      }
      if (event['initData'].length == 16) {
        HP.Logger.log('Dropping non-BMFF needKey event');
        return;
      }
      // We only need process the first need key event in one session. And since the EmeHandler is re-created
      // for every session, so we can use this instance field as condition check
      if (this._hasKey) {
        return;
      }
      this._hasKey = true;
      var initData = event['initData'];
      if (this._isClearKey()) {
        initData = this._extractBMFFClearKeyID(event['initData']);
      }
      if (window.MediaKeys) {
        if (!this._mediaElement.getMediaKeys()) {
          try {
            this._mediaElement.setMediaKeys(new MediaKeys(this._keySystem));
          } catch (e) {
          }
        }
        this._mediaKeySession = this._mediaElement.getMediaKeys().createSession(this._mimeType, initData);
        HP.NativeEventHelper.bind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage, this);
        HP.NativeEventHelper.bind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError, this);
      } else {
        this._mediaElement.generateKeyRequest(this._keySystem, initData);
      }
      this._initDataQueue.push(initData);
    },

    /**
     * Handle data when HP.Events.MediaElement.KEY_MESSAGE
     * @param  {Event} event
     */
    _onKeyMessage: function(event) {
      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.KEY_MESSAGE);

      var initData = this._initDataQueue.shift();
      var session = event['sessionId'] || event.target;
      if (this._isClearKey()) {
        var license = hex2a(this._contentKey);
        if (window.MediaKeys) {
          session.update(license);
        } else {
          this._mediaElement.addKey(this._keySystem, license, initData, session);
        }
      } else if (this._isPlayReady()) {
        if (window.MediaKeys)
          var keyMessage = String.fromCharCode.apply(null, new Uint16Array(event.message.buffer));
        else
          var keyMessage = String.fromCharCode.apply(null, event.message);
        var keyMessageXML = new DOMParser().parseFromString(keyMessage, "application/xml");

        var challenge;
        if (keyMessageXML.getElementsByTagName("Challenge")[0]) {
          var nodeValue = keyMessageXML.getElementsByTagName("Challenge")[0].childNodes[0];
          if (window.MediaKeys) {
            challenge = atob(nodeValue.nodeValue);
          } else {
            challenge = keyMessage;
          }
        } else {
          HP.Logger.log('Can not find <Challenge> in key message');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        var headerNames = keyMessageXML.getElementsByTagName("name");
        var headerValues = keyMessageXML.getElementsByTagName("value");
        if (headerNames.length !== headerValues.length) {
          HP.Logger.log('Mismatched header <name>/<value> pair in key message');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        this._createXHR(initData, session, {headerNames: headerNames, headerValues: headerValues, challenge: challenge});
      } else {
        this._createXHR(initData, session, event['message']);
      }
    },

    _createXHR: function(initData, session, data, retryTime) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", this._licenseServerURL);
      xhr.responseType = 'arraybuffer';
      xhr.initData = initData;
      xhr.session = session;
      xhr.data = data;
      xhr.startTime = (new Date()).getTime();
      xhr.retryTime = retryTime || 0;
      xhr.retryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_TIMEOUT);

      xhr.addEventListener('load', this._onXHRLoad.bind(this, initData, session));
      xhr.addEventListener('progress', this._onXHRProgress.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      if (this._isPlayReady()) {
        for (var i = 0; i < data.headerNames.length; i++) {
          xhr.setRequestHeader(data.headerNames[i].childNodes[0].nodeValue, data.headerValues[i].childNodes[0].nodeValue);
        }

        xhr.send(data.challenge);
      } else {
        xhr.send(data);
      }
    },

    /**
     * Handle data when HP.Events.MediaElement.KEY_ERROR
     * @param  {Event} event
     */
    _onKeyError: function(event) {
      if(event['currentTarget'] && event['currentTarget']['error']) {
        var keySystem = event['currentTarget']['keySystem'];
        var error = event['currentTarget']['error'];
        var systemCode = event['currentTarget']['error']['systemCode'];
      } else {
        var keySystem = event['keySystem'];
        var error = event['errorCode'];
        var systemCode = event['systemCode'];
      }

      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.KEY_ERROR + ' - ' + keySystem + ', ' + error.code + ', ' + systemCode);

      var params = {'keySystem': keySystem, 'systemCode': systemCode};
      switch(error.code) {
        case error['MEDIA_KEYERR_UNKNOWN']:
        case error['MS_MEDIA_KEYERR_UNKNOWN']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_UNKNOWN_ERROR;
          break;
        case error['MEDIA_KEYERR_CLIENT']:
        case error['MS_MEDIA_KEYERR_CLIENT']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_CLIENT_ERROR;
          break;
        case error['MEDIA_KEYERR_SERVICE']:
        case error['MS_MEDIA_KEYERR_SERVICE']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_SERVICE_ERROR;
          break;
        case error['MEDIA_KEYERR_OUTPUT']:
        case error['MS_MEDIA_KEYERR_OUTPUT']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_OUTPUT_ERROR;
          break;
        case error['MEDIA_KEYERR_HARDWARECHANGE']:
        case error['MS_MEDIA_KEYERR_HARDWARECHANGE']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_HARDWARECHANGE_ERROR;
          break;
        case error['MEDIA_KEYERR_DOMAIN']:
        case error['MS_MEDIA_KEYERR_DOMAIN']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_DOMAIN_ERROR;
          break;
      }
      this.trigger(HP.Events.EME.ERROR, params);
    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.retryTimer);

      var statusCode = xhr.status ? (xhr.status + ' ') : '';
      if(xhr && xhr['response']) {
        var response = this._arrayToString(new Uint8Array(xhr['response'])).match(/status\scode\s[\w]*/);
        if (response != null && response.length > 0) {
          statusCode = statusCode + response[0];
        }
      }

      xhr.abort();

      if(xhr.retryTime >= XHR_MAX_RETRY_TIME) {
        this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_REQUEST_ERROR, 'statusCode': statusCode, 'attempt': xhr.retryTime + 1});
      } else {
        this._createXHR(xhr.initData, xhr.session, xhr.data, xhr.retryTime + 1);
      }
    },

    /**
     * Handle data when load event
     * @param  {Event} event
     */
    _onXHRLoad: function(initData, session, event) {
      var xhr = event.target;
      clearTimeout(xhr.retryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var license = new Uint8Array(event.target['response']);

      if (window.MediaKeys) {
        session.update(license);
      } else if(this._mediaElement){
        this._mediaElement.addKey(this._keySystem, license, initData, session);
      }
    },

    _onXHRProgress: function(event) {
      var xhr = event.target;

      if (xhr.readyState == xhr.LOADING) {
        clearTimeout(xhr.retryTimer);
        xhr.retryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_TIMEOUT);
      }
    },

    /**
     * Convert Uint8Array to String
     * @param  {Uint8Array} a the source Uint8Array
     * @return {String} the converted String
     */
    _arrayToString: function(a) {
      return String.fromCharCode.apply(String, a);
    },

    _isClearKey: function() {
      return this._key == "clearkey";
    },

    _isPlayReady: function() {
      return this._key == "playready";
    }
  })
}).call(this);