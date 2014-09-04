(function() {
  /**
   * @interface HP.Interfaces.IVideoQuality
   */
  HP.Interfaces.IVideoQuality = HP.Interfaces.create(
  /** @lends HP.Interfaces.IVideoQuality.prototype */
  {
    /**
     * Returns the bit rate of quality.
     * @Return {Number} the bit rate of quality
     */
    getBitRate: function() {},

    /**
     * Returns the safe bandwidth for this quality
     * @return {Number} the safe bandwidth for this quality
     */
    getSafeBandwidth: function() {},

    /**
     * Returns the quality type {low, medium, high, HD}
     * @return {String} the quality type
     */
    getType: function() {}
  })
}).call(this);