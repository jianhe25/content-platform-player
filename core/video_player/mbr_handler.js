(function() {
  HP.VideoPlayer.MBRHandler = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.MBRHandler.prototype */
  {
    /**
     * Switching rRules to adapt quality
     * @type {Array}
     */
    _switchingRules: null,

    _reason: '',

    /**
     * MBR Handler
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
      this._switchingRules = [];
    },

    /**
     * Add one or multiple switching rules which are used when adaptive switching quality.
     * @param  {SwitchingRule} switchingRule the switchingRule which is used by the MbrHandler
     */
    addSwitchingRule: function(switchingRule) {
      this._switchingRules.push(switchingRule);
    },

    /**
     * Clear all switching rules.
     */
    clearSwitchingRule: function() {
      this._switchingRules = [];
    },

    /**
     * Returns the selected quality from a given quality array under all switching rules and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    adaptCurrentQuality: function(metrics, qualities) {
      var newQuality = this._switchingRules[0].getNewQuality(metrics, qualities);
      var newBitRate = newQuality.getBitRate();
      this._reason = this._switchingRules[0].getReason();
      for (var i = 1; i < this._switchingRules.length; i++) {
          var selectedQuality = this._switchingRules[i].getNewQuality(metrics, qualities);
          var selectedBitRate = selectedQuality.getBitRate();
          if (selectedBitRate < newBitRate) {
              newQuality = selectedQuality;
              newBitRate = selectedBitRate;
              this._reason = this._switchingRules[i].getReason();
          } 
      }
      return newQuality;
    },

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {
      return this._reason;
    }
  }).implement(HP.Interfaces.IMBRHandler)
}).call(this);