(function() {
  /**
   * @interface HP.Interfaces.IMediaElementFactory
   */
  HP.Interfaces.IMediaElementFactory = HP.Interfaces.create(
  /** @lends HP.Interfaces.IMediaElementFactory.prototype */
  {
    /**
     * Get video media element by type
     * @param  {String} type
     * @return {HP.VideoPlayer.MediaElement}
     */
    getVideoMediaElement: function(type) {}
  });
}).call(this);