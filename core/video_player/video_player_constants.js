(function(){
  /**
   * @namespace HP.VideoPlayer
   */
  HP.VideoPlayer = {};

  /**
   * Enum for all video player states
   * @enum {String}
   * @readOnly
   */
  HP.VideoPlayer.State = {
    ERROR: 'HP.VideoPlayer.State.ERROR',
    INIT: 'HP.VideoPlayer.State.INIT',
    LOADING: 'HP.VideoPlayer.State.LOADING',
    READY: 'HP.VideoPlayer.State.READY',
    PAUSED: 'HP.VideoPlayer.State.PAUSED',
    SEEKING: 'HP.VideoPlayer.State.SEEKING',
    PLAYING: 'HP.VideoPlayer.State.PLAYING',
    ENDED: 'HP.VideoPlayer.State.ENDED'
  };

  /**
   * Enum for all video player error
   * @enum {String}
   * @readOnly
   */
  HP.VideoPlayer.Error = {
    MEDIA_ABORTED_ERROR: 'HP.VideoPlayer.Error.MEDIA_ABORTED_ERROR',
    MEDIA_NETWORK_ERROR: 'HP.VideoPlayer.Error.MEDIA_NETWORK_ERROR',
    MEDIA_DECODE_ERROR: 'HP.VideoPlayer.Error.MEDIA_DECODE_ERROR',
    MEDIA_SRC_NOT_SUPPORTED_ERROR: 'HP.VideoPlayer.Error.MEDIA_SRC_NOT_SUPPORTED_ERROR',
    MEDIA_ENCRYPTED_ERROR: 'HP.VideoPlayer.Error.MEDIA_ENCRYPTED_ERROR',
    MEDIA_TIMEOUT_ERROR: 'HP.VideoPlayer.Error.MEDIA_TIMEOUT_ERROR',
    MEDIA_UNKNOWN_ERROR: 'HP.VideoPlayer.Error.MEDIA_UNKNOWN_ERROR',
    DASH_STREAM_ERROR: 'HP.VideoPlayer.Error.STREAM_ERROR',
    MPD_LOAD_FAILURE:   "HP.VideoPlayer.Error.MPD_LOAD_FAILURE",
    MPD_DOM_PARSER_ERROR: "HP.VideoPlayer.Error.MPD_DOM_PARSER_ERROR",
    MPD_FORMAT_ERROR: "HP.VideoPlayer.Error.MPD_FORMAT_ERROR",
    MEDIA_KEY_UNSUPPORTED_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_UNSUPPORTED_ERROR",
    MEDIA_KEY_UNKNOWN_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_UNKNOWN_ERROR",
    MEDIA_KEY_CLIENT_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_CLIENT_ERROR",
    MEDIA_KEY_SERVICE_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_SERVICE_ERROR",
    MEDIA_KEY_OUTPUT_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_OUTPUT_ERROR",
    MEDIA_KEY_HARDWARECHANGE_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_HARDWARECHANGE_ERROR",
    MEDIA_KEY_DOMAIN_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_DOMAIN_ERROR",
    MEDIA_KEY_MESSAGE_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR",
    MEDIA_KEY_REQUEST_ERROR: "HP.VideoPlayer.Error.MEDIA_KEY_REQUEST_ERROR"
  };

  /**
   * Enum for all video player error classification
   * @enum {String}
   * @readOnly
   */
  HP.VideoPlayer.Error.Classification = {
    MEDIA: "HP.VideoPlayer.Error.Classification.MEDIA",
    STREAM: "HP.VideoPlayer.Error.Classification.STREAM",
    MPD: "HP.VideoPlayer.Error.Classification.MPD",
    MEDIA_KEY_UNSUPPORTED: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_UNSUPPORTED",
    MEDIA_KEY_UNKNOWN: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_UNKNOWN",
    MEDIA_KEY_CLIENT: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_CLIENT",
    MEDIA_KEY_SERVICE: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_SERVICE",
    MEDIA_KEY_OUTPUT: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_OUTPUT",
    MEDIA_KEY_HARDWARECHANGE: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_HARDWARECHANGE",
    MEDIA_KEY_DOMAIN: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_DOMAIN",
    MEDIA_KEY_MESSAGE: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_MESSAGE",
    MEDIA_KEY_REQUEST: "HP.VideoPlayer.Error.Classification.MEDIA_KEY_REQUEST"
  };
}).call(this);