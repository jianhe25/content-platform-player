(function() {
  /**
   * @interface HP.Interfaces.IMBRHandler
   */
  HP.Interfaces.IMBRHandler = HP.Interfaces.create(
  /** @lends HP.Interfaces.IMBRHandler.prototype */
  {
    /**
     * Add one or multiple switching rules which are used when adaptive switching quality.
     * @param  {SwitchingRule} switchingRule the switchingRule which is used by the MbrHandler
     */
    addSwitchingRule: function(switchingRule) {},

    /**
     * Clear all switching rules.
     */
    clearSwitchingRule: function() {},

    /**
     * Returns the selected quality from a given quality array under all switching rules and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    adaptCurrentQuality: function(metrics, qualities) {},

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {}
  })
}).call(this);