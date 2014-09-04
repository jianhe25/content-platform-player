(function() {
  /**
   * The size of the recent bandwidths array
   * @type {int}
   * @constant
   * @private
   */
  var BANDWIDTH_SAMPLE_SIZE = 10;

  HP.VideoPlayer.MetricsProvider = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MetricsProvider.prototype */
  {
    /**
     * Available MediaElement for player
     * @type {HP.Interfaces.IMediaElement}
     */
    _mediaElement: null,

    /**
     * Store recent bandwidths
     * @type {Array}
     */
    _historyBandwidths: [],

    /**
     * The max bandwidth in history
     * @type {Number}
     */
    _maxBandwidth: 0,

    /**
     * The average bandwidth in history
     * @type {Number}
     */
    _averageBandwidth: 0,

    /**
     * The current buffer length
     * @type {Number}
     */
    _currentBufferLength: 0,

    /**
     * Store the latest 20 fragements byte length and loading time to calculate the bandwidth and RTT.
     * @type {Array}
     */
    _fragmentsLoadTime: [],
    
    /**
     * Estimated RTT value.
     * @type {Number}
     */
    _RTT: 0,

    /**
     * Indicate if the bandwidth is over estimated in the last few fragments.
     * @type {Number}
     */
    _overEstimatedTimes: 0,

    /**
     * Metrics provider
     * @param  {HP.Interfaces.IMediaElement} MediaElement available MediaElement
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(MediaElement) {
      this._mediaElement = MediaElement;
    },

    /**
     * Init properties
     * @param  {Object} params some configs fot properties
     */
    init: function(params) {
      params = params || {};

      this._currentBufferLength = 0;
      this._historyBandwidths = [];
      this._maxBandwidth = 0;
      this._averageBandwidth = 0;
      this._RTT = 0;
      this._overEstimatedTimes = 0;

      if(params.initBandwidth) {
        var initBandwidth = parseInt(params.initBandwidth);
        this._historyBandwidths.push(initBandwidth);
        this._maxBandwidth = initBandwidth;
        this._averageBandwidth = initBandwidth;
      }
    },

    /**
     * This is an internal method.
     * Update bandwidth according to data.
     * @param  {Number} byteLength Fragment byte length
     * @param  {Number} time Fragment download time
     * @param  {Boolean} isVideo Indicate whether the fragment is video fragment
     */
    updateBandwidth: function(byteLength, time, isVideo) {
      // check if the bandwidht is over estimated;
      if (this._averageBandwidth > 0 && this._RTT > 0) {
        var predictTime = this._RTT + byteLength * 8 / this._averageBandwidth;
        var isAbnormal = false;
        if (isVideo) {
          if (time >= 5) { // load time is too long, the bandwidth should be over estimated
            this._overEstimatedTimes += ((time > 7 || this._currentBufferLength <= 10) ? 2 : 1);
            isAbnormal = true;
          } else if(time >= 4 && (time - predictTime)/time > 0.2) { // load time is much longer than predict one, bandwidth could be over estimated
            this._overEstimatedTimes += 1;
            isAbnormal  = true;
          } else {
            this._overEstimatedTimes = Math.max(this._overEstimatedTimes - 1, 0);
          }
        }
      }
      //bandwidth is over estimated, switch down
      if (this._overEstimatedTimes >= 2) {
        this._overEstimatedTimes  = 0;
        this.trigger(HP.Events.MetricsProvider.BANDWIDTH_OVER_ESTIMATED);
        return;
      }
      // if byte length is too short, or the fragment is cached, ignore the fragment.
      if (byteLength > 40000 && time > this._RTT && !isAbnormal) {
        this._fragmentsLoadTime.push([byteLength, time]);
      }
      // if there are enough fragments, then calculate the bandwidth and RTT by linear regression
      // time = RTT + fragmentByteLength/bandwidht;
      var fragmentsNumber = this._fragmentsLoadTime.length;
      if(fragmentsNumber >= 20) {
        var sumX = 0;
        var sumY = 0;
        var corXY = 0;
        var squaX = 0;
        for (var i = 0; i < fragmentsNumber; i++) {
          sumX += this._fragmentsLoadTime[i][0];
          sumY += this._fragmentsLoadTime[i][1];
          corXY += this._fragmentsLoadTime[i][0] * this._fragmentsLoadTime[i][1];
          squaX += this._fragmentsLoadTime[i][0] * this._fragmentsLoadTime[i][0];
        }
        var bandwidth = (fragmentsNumber * squaX - sumX * sumX) / (fragmentsNumber * corXY - sumX * sumY);
        this._RTT = (sumY - sumX / bandwidth) / fragmentsNumber;
        this._averageBandwidth = 8 * bandwidth;
        this._maxBandwidth = Math.max(this._maxBandwidth, this._averageBandwidth);
        this._historyBandwidths.unshift(this._averageBandwidth);
        if(this._historyBandwidths.length > BANDWIDTH_SAMPLE_SIZE) {
          this._historyBandwidths.pop();
        }
        this._fragmentsLoadTime.shift();
        this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
      }
    },

    /**
     * Reset bandwidth to a given value or 0
     * @param  {data} data the data which is used to reset bandwidth
     */
    resetBandwidth: function(data) {
      if(data) {
        var currentBandwidth = parseInt(data);
        this._historyBandwidths = [currentBandwidth];
        this._maxBandwidth = currentBandwidth;
        this._averageBandwidth = currentBandwidth;
      } else {
        this._historyBandwidths = [];
        this._maxBandwidth = 0;
        this._averageBandwidth = 0;
      }
      this._fragmentsLoadTime = [];
      this._RTT = 0;
      this._overEstimatedTimes = 0;
      this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
    * This is an internal method.
    * Update buffer length according to data.
    * @param  {Number} bufferLength the current buffer length
    */
    updateBufferLength: function(data) {
     this._currentBufferLength = parseInt(data);
     this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
     * Reset buffer length
     */
    resetBufferLength: function() {
      this._currentBufferLength = 0;
      this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
     * Returns the max bandwidth.
     * @Return {Number} the max bandwidth.
     */
    getMaxBandwidth: function(){
      return this._maxBandwidth;
    },

    /**
     * Returns the avg bandwidth.
     * @Return {Number} the avg bandwidth.
     */
    getAverageBandwidth: function() {
      return this._averageBandwidth;
    },

    /**
     * Returns the current buffer length.
     * @Return {Number} the current buffer length.
     */
    getCurrentBufferLength: function() {
      return this._currentBufferLength;
    },

    getRTT:function() {
      return this._RTT;
    },

    _getAllMetrics: function() {
      return {
        historyBandwidths: this._historyBandwidths,
        maxBandwidth: this._maxBandwidth,
        averageBandwidth: this._averageBandwidth,
        currentBufferLength: this._currentBufferLength
      };
    }
  })
}).call(this);








