(function() {
  /**
   * The retry time of a xhr request.
   * @type {Number}
   * @constant
   * @private
   */
  var XHR_MAX_RETRY_TIME = 2;

  /**
   * The number of milliseconds a request can take before automatically being terminated.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_DONE_TIMEOUT = 10000;

  HP.VideoPlayer.MPD = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MPD.prototype */
  {
    /**
     * the main manifest
     * @type {Object}
     */
    _manifest: null,

    /**
     * MPD
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(text, url) {
      this._manifest = this._parseDASHManifest(text, url);

      this._duration = this._manifest.periods[0].duration || this._manifest.mediaPresentationDuration;

      this._adaptationSets = [];
      this._availableQualitiesTypes = [];
      for (var i = 0; i < this._manifest.periods[0].adaptationSets.length; i++) {
        var aset = this._manifest.periods[0].adaptationSets[i];
        var mimeType = aset.representations[0].mimeType || aset.mimeType;
        var reps = aset.representations.map(this._normalizeRepresentation.bind(this));
        reps.sort(function(a,b){return a.bandwidth - b.bandwidth});
        this._adaptationSets.push({
          representations: reps,
          mimeType: mimeType,
          codecs: aset.representations[0].codecs || aset.codecs,
          contentProtection: aset.contentProtection
        });

        if(mimeType.indexOf('video') >= 0){
          var allQualities = [];
          for (var j = 0; j < reps.length; j++) {
            var rep = reps[j];
            allQualities.push(Math.round(reps[j].height));
          }
          allQualities.sort(function(a,b){return a-b});

          for (var j = 0; j < allQualities.length; j++) {
            var qualityType = HP.VideoPlayer.VideoQuality.getQualityType(allQualities[j]);
            if(this._availableQualitiesTypes.indexOf(qualityType) == -1) {
              this._availableQualitiesTypes.push(qualityType);
            }
          }
        }
      }
    },

    /**
     * Get duration of video
     * @return {Number} duration of video
     */
    getDuration: function() {
      return this._duration;
    },

    /**
     * Get all adaptation sets
     * @return {Array} all adaptation sets
     */
    getAdaptationSets: function() {
      return this._adaptationSets;
    },

    /**
     * Get all available video qualities
     * @return {Array} all available video qualities
     */
    getAvailableQualitiesTypes: function() {
      return this._availableQualitiesTypes;
    },

    _normalizeRepresentation: function(repSrc) {
      var rep = {
        url: this._absolutizeURL(this._manifest.manifestURL, repSrc.baseURLs[0]),
        bandwidth: repSrc.bandwidth,
        duration: this._duration,
        height: repSrc.height
      };
      var init = null;
      var index = null;
      if (repSrc.segmentBase != null) {
        var segSrc = repSrc.segmentBase;
        init = segSrc.initialization;
        if (segSrc.indexRange != null) {
          index = segSrc.indexRange;
        }
      }
      rep.indexRange = {
        start: index.start,
        end: index.end,
      };
      rep.init = {
        start: init.start,
        end: init.end,
        value: null
      };

      this._createXHR(rep, rep.init.start, rep.init.end, true, false);

      return rep;
    },

    _createRange:function (start, end) {
      if (start != null && end != null) {
        return 'bytes=' + start + '-' + end;
      }
      return null;
    },

    _createXHR: function(rep, start, end, isInit, isIndex, retryTime) {
      if (rep.url == null) {
        throw "Null URL";
      }

      var xhr = new XMLHttpRequest();
      xhr.open("GET", rep.url);

      var range = this._createRange(start, end);
      if (range != null) {
        xhr.setRequestHeader('Range', range);
      }

      xhr.responseType = 'arraybuffer';
      xhr.rep = rep;
      xhr.startByte = start;
      xhr.endByte = end;
      xhr.isInit = isInit;
      xhr.isIndex = isIndex;
      xhr.retryTime = retryTime || 0;
      xhr.doneRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_DONE_TIMEOUT);

      xhr.addEventListener('load', this._onXHRLoad.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      xhr.send();
    },

    _onXHRLoad: function(evt) {
      var xhr = evt.target;

      clearTimeout(xhr.doneRetryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var rep = xhr.rep;

      if(xhr.isInit) {
        rep.init.value = new Uint8Array(xhr.response);
        this._createXHR(rep, rep.indexRange.start, rep.indexRange.end, false, true);
      } else if(xhr.isIndex) {
        rep.index = new HP.VideoPlayer.DashSegmentIndex();
        rep.index.parseSidx(xhr.response, rep.indexRange.start);
      }

    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.doneRetryTimer);

      var status = "";

      try {
        // xhr.status might throw exception if it's not completed
        status = xhr.status;
      } catch (ex) {
      }
      xhr.abort();

      if(xhr.retryTime >= XHR_MAX_RETRY_TIME) {
        xhr.rep.error = {type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1};
      } else {
        this._createXHR(xhr.rep, xhr.startByte, xhr.endByte, xhr.isInit, xhr.isIndex, xhr.retryTime + 1);
      }
    },

    _absolutizeURL: function(base, target) {
      if (/^(https?:\/\/)/.test(target)) {
        return target;
      }
      var rel_url;
      if (target[0] == '/') {
        rel_url = base.match(/^[a-z]*:\/\/[^\/]*/)[0];
      } else {
        rel_url = base.replace(/\/[^\/]*$/, '/');
      }
      return rel_url + target;
    },

    _id: function(x) {
      return x;
    },

    _parseDuration: function(durStr) {
      // Unsupported: date part of ISO 8601 durations
      var re = /PT(([0-9]*)H)?(([0-9]*)M)?(([0-9.]*)S)?/;
      var match = re.exec(durStr);
      if (!match) return parseFloat(durStr);
      return (parseFloat(match[2] || 0) * 3600 +
              parseFloat(match[4] || 0) * 60 +
              parseFloat(match[6] || 0));
    },

    _parseChildElements: function(nodeName, parseFunc, xml, required) {
      var result = [];
      if (xml != null) {
        for (var child = xml.firstElementChild; child != null; child = child.nextElementSibling) {
          if (child.nodeName == nodeName) {
            result.push(parseFunc.call(this, child));
          }
        }
      }
      if (result.length == 0 && required) {
        throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'childElement', name: nodeName};
      }
      return result;
    },

    _parseChildElement: function(nodeName, parseFunc, xml, required) {
      return this._parseChildElements(nodeName, parseFunc, xml, required)[0] || null;
    },

    _parseAttributes: function(attrMap, xml, result) {
      result = result || {};
      for (var k in attrMap) {
        if(attrMap[k].attr && attrMap[k].parseFunc) {
          if (xml.attributes.getNamedItem(attrMap[k].attr) != null) {
            result[k] = attrMap[k].parseFunc(xml.attributes[attrMap[k].attr].value);
          }
        } else {
          if (xml.attributes.getNamedItem(k) != null)
            result[k] = attrMap[k](xml.attributes[k].value);
        }
        if (result[k] == undefined && attrMap[k].required) {
          throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'attribute', name: attrMap[k].attr};
        }
      }
      return result;
    },

    _parseFrameRate: function(str) {
      var match = /([0-9]+)(\/([0-9]+))?/.exec(str);
      if (!match) return 1;
      if (!match[3]) return parseFloat(match[1]);
      return parseFloat(match[1]) / (parseFloat(match[3]) || 1);
    },

    _parseByteRange: function(str) {
      var match = /([0-9]+)-([0-9]+)/.exec(str);
      if (!match) return null;
      var start = parseInt(match[1]), end = parseInt(match[2]);
      return { start: start, end: end, length: end - start + 1 };
    },

    _parseSegmentURL: function(xml) {
      return this._parseAttributes({
          media: {attr: 'media', parseFunc: this._id},
          mediaRange: {attr: 'mediaRange', parseFunc: this._parseByteRange},
          index: {attr: 'index', parseFunc: this._id},
          indexRange: {attr: 'indexRange', parseFunc: this._parseByteRange}
        }, xml);
    },

    _parseBaseURL: function(xml) {
      if (xml.textContent && xml.textContent != '') {
        return xml.textContent;
      }
      throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'childElement', name: 'baseUrl'};
    },

    _parseInitialization: function(xml) {
      // MP4 specific
      return this._parseByteRange(xml.attributes['range'].value);
    },

    _parseSegmentBase: function(xml) {
      // Unsupported: @indexRangeExact, RepresentationIndex, SegmentTimeline, BitstreamSwitching
      var result = this._parseAttributes({
          timescale: {attr: 'timescale', parseFunc: parseInt},
          duration: {attr: 'duration', parseFunc: parseInt},
          indexRange: {attr: 'indexRange', parseFunc: this._parseByteRange, required: true},
          presentationTimeOffset: {attr: 'presentationTimeOffset', parseFunc: parseInt},
          startNumber: {attr: 'startNumber', parseFunc: parseInt}
        }, xml);
      result.initialization = this._parseChildElement('Initialization', this._parseInitialization, xml, true);
      return result;
    },

    _parseSegmentList: function(xml) {
      // Unsupported: @xlinks, @actuate, SegmentTimeline, BitstreamSwiching
      var result = this._parseSegmentBase(xml);
      if (result.timescale && result.duration) {
        result.durationSeconds = result.duration / result.timescale;
      } else {
        result.durationSeconds = result.duration;
      }
      result.segmentURLs = this._parseChildElements('SegmentURL', parseSegmentURL, xml);
      return result;
    },

    _parseContentProtection: function(node) {
      var schemeUri = node.attributes['schemeIdUri'];
      if (!schemeUri) {
        // Unsupported scheme, ignore.
        return null;
      }
      return {};
    },

    _parseRepresentationBase: function(xml, requiredMap) {
      // Unsupported: @sar, @segmentProfiles, @maximumSAPPeriod, @startWithSAP,
      // @maxPlayoutRate, @codingDependency, @scanType, FramePacking,
      // AudioChannelConfiguration, ContentProtection, SegmentBase
      requiredMap = requiredMap || [];
      var result = this._parseAttributes({
          id: {attr: 'id', parseFunc: parseInt},
          profiles: {attr: 'profiles', parseFunc: this._id},
          width: {attr: 'width', parseFunc: parseInt},
          height: {attr: 'height', parseFunc: parseInt},
          frameRate: {attr: 'frameRate', parseFunc: this._parseFrameRate},
          audioSamplingRate: {attr: 'audioSamplingRate', parseFunc: parseInt},
          mimeType: {attr: 'mimeType', parseFunc: this._id, required: requiredMap.indexOf('mimeType') != -1},
          codecs: {attr: 'codecs', parseFunc: this._id, required: requiredMap.indexOf('codecs') != -1}
        }, xml);
      result.baseURLs = this._parseChildElements('BaseURL', this._parseBaseURL, xml, requiredMap.indexOf('baseURLs') != -1);
      result.segmentBase = this._parseChildElement('SegmentBase', this._parseSegmentBase, xml, requiredMap.indexOf('SegmentBase') != -1);
      result.segmentList = this._parseChildElement('SegmentList', this._parseSegmentList, xml);
      result.contentProtection = this._parseChildElement('ContentProtection', this._parseContentProtection, xml, requiredMap.indexOf('contentProtection') != -1);
      return result;
    },

    _parseRepresentation: function(xml) {
      // Unsupported: @dependencyId, @mediaStreamStructureId, SubRepresentation,
      // SegmentTemplate
      var result = this._parseRepresentationBase(xml, ['codecs', 'baseURLs', 'segmentBase']);
      this._parseAttributes({
          bandwidth: {attr: 'bandwidth', parseFunc: parseInt, required: true},
          qualityRanking: {attr: 'qualityRanking', parseFunc: parseInt},
        }, xml, result);
      return result;
    },

    _parseAdaptationSet: function(xml) {
      // Unsupported: @lang, @contentType, @par, @minBandwidth, @maxBandwidth,
      // @minWidth, @maxWidth, @minHeight, @maxHeight, @minFrameRate,
      // @maxFrameRate, @segmentAlignment, @bitstreamSwitching,
      // @subsegmentAlignment, @subsegmentStartsWithSAP, Accessibility,
      // Role, Rating, Viewpoint, ContentComponent, SegmentTemplate
      var result = this._parseRepresentationBase(xml, ['mimeType', 'contentProtection']);
      result.representations = this._parseChildElements('Representation', this._parseRepresentation, xml, true);
      return result;
    },

    _parsePeriod: function(xml) {
      // Unsupported: @href, @actuate, @bitstreamSwitching, SegmentTemplate
      var result = this._parseRepresentationBase(xml);
      this._parseAttributes({
          id: {attr: 'id', parseFunc: parseInt},
          start: {attr: 'start', parseFunc: this._parseDuration},
          duration: {attr: 'duration', parseFunc: this._parseDuration},
        }, xml, result);
      result.adaptationSets = this._parseChildElements('AdaptationSet', this._parseAdaptationSet, xml, true);
      return result;
    },

    _parseMPD: function(xml) {
      // Unsupported: @id, @profiles, @type, @availabilityStartTime,
      // @availabilityEndTime, @minimumUpdatePeriod,
      // @minbufferTime, @timeShiftBufferDepth, @suggestedPresentationDelay,
      // @maxSegmentDuration, @maxSubsegmentDuration, ProgramInformation,
      // Location, Metrics
      var result = {};
      this._parseAttributes({mediaPresentationDuration: {attr: 'mediaPresentationDuration', parseFunc: this._parseDuration, required: true}}, xml, result);
      result.periods = this._parseChildElements('Period', this._parsePeriod, xml, true);
      result.baseURLs = this._parseChildElements('BaseURL', this._parseBaseURL, xml);
      return result;
    },

    _normalizeRepresentations: function(mpd, url) {
      mpd.manifestURL = url;
      return mpd;
    },

    _parseDASHManifest: function(text, url) {
      var parser = new DOMParser();
      var dom = parser.parseFromString(text, 'text/xml');

      this._checkDOMError(dom);

      return this._normalizeRepresentations(this._parseMPD(dom.firstChild), url);
    },

    _checkDOMError: function(dom) {
      //Internet Explorer
      try {
        if (dom.parseError.errorCode != 0) {
          throw {type: HP.VideoPlayer.Error.MPD_DOM_PARSER_ERROR};
        }
      } catch (e) {

      }

      //Firefox
      try {
        if (dom.documentElement.nodeName == "parsererror") {
          throw {type: HP.VideoPlayer.Error.MPD_DOM_PARSER_ERROR};
        }
      } catch (e) {

      }
    }
  })
}).call(this);
