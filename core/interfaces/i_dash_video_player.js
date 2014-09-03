(function() {
  /**
   * @interface HP.Interfaces.IDashVideoPlayer
   */
  HP.Interfaces.IDashVideoPlayer = HP.Interfaces.create(HP.Interfaces.IBaseVideoPlayer,
  /** @lends HP.Interfaces.IDashVideoPlayer.prototype */
  {
    /**
     * Load video by mpd xml
     * @param  {String} mpdXML mpd xml text
     * @param  {Object} options initialization configs
      * @param  {Object} options initialization options {initBandwidth}
     * @param  {String} [options.licenseUrl] DRM License URL, required for encrypted content
     * @param  {String} [options.contentKey] DRM Content Key, required for encrypted content
     * @param  {String} [options.mpdXML] String blob of the MPD xml, must specify either mpdXML or mpd
     * @param  {Boolean} [options.autoplay=false] Whethe auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Number}  [options.quickStartSecs=DEFAULT_QUICK_START_SECS] The buffered seconds for quick start
     * @param  {Number}  [options.resumeSecs=DEFAULT_RESUME_SECS] The buffered seconds for resume
     * @param  {Number}  [options.maxBufferedSecs=DEFAULT_MAX_BUFFERED_SECS] The max buffered seconds
     * @param  {Number}  [options.initBandwidth] The initial bandwidth
     * @param  {HP.VideoPlayer.VideoQuality.QualityType}  [options.initQualityType=HP.VideoPlayer.VideoQuality.QualityType.AUTO] The initial quality type
     * @param  {HP.VideoPlayer.MPD} [options.mpd] MPD object, must specify either mpdXML or mpd
     * @param  {HP.VideoPlayer.MBRHandler} [options.mbrHandler] Custom MBRHandler
     * @param  {HP.VideoPlayer.MetricsProvider} [options.metricsProvider] Custom MetricsProvider
     */
    loadByMpd: function(mpdXML, options) {},
    /**
     * Switch video quality
     * @param  {string} qualityType 'low, medium, high, HD, auto'
     */
    switchQuality: function(qualityType) {},
    /**
     * Returns current video quality
     * @return {string} current video quality
     */
    getCurentQuality: function() {}
  })
}).call(this);