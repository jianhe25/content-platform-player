(function() {
  HP.VideoPlayer.BandwidthSwitchingRule = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.BandwidthSwitchingRule.prototype */
  {
    _reason: '',

    /**
     * Base switching rule
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
    },

    /**
     * Returns the selected quality from a given quality array under current switching rule and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    getNewQuality: function(metrics, qualities) {
      var currentBandwidth = metrics.getAverageBandwidth();
      var rtt = metrics.getRTT();
      var bestQuality;

      for (var i = 0; i < qualities.length; i++) {
        //Should consider the RTT here
        if (currentBandwidth > 0 && (qualities[i].getSafeBandwidth() <= (5 - rtt) / 5 * currentBandwidth)) {
          bestQuality = qualities[i];
          continue;
        }
        break;
      }

      if(bestQuality) {
        this._reason = 'it is the maximum one with a safe bandwidth ' +  parseInt(bestQuality.getSafeBandwidth() / 1024) + ' that is smaller than the avg bandwidth ' + parseInt(currentBandwidth / 1024);
        return bestQuality;
      } else {
        this._reason = 'it is the minimum one when all the safe bandwidth of qualities are larger than the avg bandwidth ' + parseInt(currentBandwidth / 1024);
        return qualities[0];
      }
    },

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {
      return this._reason;
    }
  }).implement(HP.Interfaces.ISwitchingRule)
}).call(this);