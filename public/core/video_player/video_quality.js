(function() {
  HP.VideoPlayer.VideoQuality = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.VideoQuality.prototype */
  {
    /**
     * Video quality
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(data) {
      data = data || {};
      this._bitRate = data.bitRate || 0;
      this._type = HP.VideoPlayer.VideoQuality.getQualityType(data.height);

      switch(this._type) {
        case HP.VideoPlayer.VideoQuality.QualityType.LOW:
          this._safeBandwidthFactor = 1.2;
          break;
        case HP.VideoPlayer.VideoQuality.QualityType.MEDIUM:
          this._safeBandwidthFactor = 1.4;
          break;
        case HP.VideoPlayer.VideoQuality.QualityType.HIGH:
          this._safeBandwidthFactor = 1.6;
          break;
        // unlike the csel, deejay returns the stream's actual bitrate which is 
        // much lower than the nominal one. The higher nominal bitrate is, the larger
        // difference between them. So here we use a increased and bigger safe factor.
        case HP.VideoPlayer.VideoQuality.QualityType.HD:
          this._safeBandwidthFactor = 1.8;
          break;
      }
    },

    /**
     * Get the bit rate of quality
     * @Return {Number} the bit rate of quality
     */
    getBitRate: function() {
      return this._bitRate
    },

    /**
     * Get the safe bandwidth for this quality
     * @return {Number} the safe bandwidth for this quality
     */
    getSafeBandwidth: function() {
      return this._bitRate * 1024 * this._safeBandwidthFactor;
    },

    /**
     * Returns the quality type {low, medium, high, HD}
     * @return {String} the quality type
     */
    getType: function() {
      return this._type;
    }
  },

  /** @lends HP.VideoPlayer.VideoQuality */
  {
    /**
     * Enum for all quality types
     * @enum {String}
     */
    QualityType: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      HD: 'HD',
      AUTO: 'auto'
    },

    /**
     * Get the type of this quality
     * @param  {Number} height the video height
     * @return {String} the type of this quality
     */
    getQualityType: function(height) {
      if(height >= 600) {
        return HP.VideoPlayer.VideoQuality.QualityType.HD;
      }
      else if(height >= 400) {
        return HP.VideoPlayer.VideoQuality.QualityType.HIGH;
      }
      else if(height >= 300) {
        return HP.VideoPlayer.VideoQuality.QualityType.MEDIUM;
      }
      return HP.VideoPlayer.VideoQuality.QualityType.LOW;
    },

    /**
     * Check whether the quality type is valid
     * @param  {String} qualityType the quality type
     * @return {Boolean} whether the quality type is valid
     */
    isValidQualityType: function(qualityType) {
      if(qualityType) {
        for (var key in HP.VideoPlayer.VideoQuality.QualityType) {
          if (HP.VideoPlayer.VideoQuality.QualityType[key] == qualityType) {
            return true;
          }
        }
      }
      return false;
    }
  }).implement(HP.Interfaces.IVideoQuality);
}).call(this);