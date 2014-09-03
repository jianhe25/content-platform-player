(function() {
  /**
   * @interface HP.Interfaces.IBaseVideoPlayer
   */
  HP.Interfaces.IBaseVideoPlayer = HP.Interfaces.create(
  /** @lends HP.Interfaces.IBaseVideoPlayer.prototype */
  {
    /**
     * Reset VideoPlayer to original state
     */
    reset: function() {},

    /**
     * Play video from current time
     */
    play: function() {},

    /**
     * Pause video at current time
     */
    pause: function() {},

    /**
     * Seek video to a given position
     * @param  {Number} position the target seek position in millisecond
     */
    seek: function(position) {},

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {},

    /**
     * Mute player
     */
    mute: function() {},

    /**
     * Unmute player
     */
    unmute: function() {},

    /**
     * Get whether it's muted
     * @return {Boolean} Return true if it's muted
     */
    getMuted: function() {},

    /**
     * Get current state of this VideoPlayer
     * @return {string} current state
     */
    getState: function() {},

    /**
     * Get current position of video
     * @return {Number} current position of video in millisecond
     */
    getPosition: function() {},

    /**
     * Get current duration of video
     * @return {Number} current duration of video in millisecond
     */
    getDuration: function() {},

    /**
     * Get current volume of video
     * @return {Number} current volume of video
     */
    getVolume: function() {},

    /**
     * Set current volume of video to a target value
     * @param  {Number} volume target volume
     */
    setVolume: function(volume) {},

    /**
     * Load video by stream url
     * @param  {String} streamUrl video source
     * @param  {Object} options initialization configs {autoplayer, preload, startPosition}
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     */
    load: function(streamUrl, options) {}
  })
}).call(this);