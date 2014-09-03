(function() {
  /**
   * @interface HP.Interfaces.ISwitchingRule
   */
  HP.Interfaces.ISwitchingRule = HP.Interfaces.create(
  /** @lends HP.Interfaces.ISwitchingRule.prototype */
  {
    /**
     * Returns the selected quality from a given quality array under current switching rule and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    getNewQuality: function(metrics, qualities) {},

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {}
  })
}).call(this);