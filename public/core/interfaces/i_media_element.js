(function() {
  /**
   * @interface HP.Interfaces.IMediaElement
   */
  HP.Interfaces.IMediaElement = HP.Interfaces.create(HP.Interfaces.IEventDispatcher,
  /** @lends HP.Interfaces.IMediaElement.prototype */
  {
    /**
     * Attach this MediaElement to a given VideoPlayer
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    attach: function(owner) {},

    /**
     * Detach this MediaElement from its owner
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    detach: function(owner) {},

    /**
     * Get current owner
     * @return {BaseVideoPlayer} current owner
     */
    getOwner: function() {},

    /**
     * Reset MediaElement to original state
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
     * Load video
     * @param  {String} src video source
     */
    load: function(src) {},

     /**
     * Indicate whether the player has been paused
     * @return {Boolean} whether the player has been paused
     */
    isPaused: function() {}
  })
}).call(this);