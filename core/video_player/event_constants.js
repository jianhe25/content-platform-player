(function(){
  /**
   * @namespace HP.Events.VideoPlayer
   */
  HP.Events.VideoPlayer = {
    STALLED: HP.Events.registerEvent("Events.VideoPlayer.STALLED"),
    LOAD_START: HP.Events.registerEvent("Events.VideoPlayer.LOAD_START"),
    CAN_PLAY: HP.Events.registerEvent("Events.VideoPlayer.CAN_PLAY"),
    CAN_PLAY_THROUGH: HP.Events.registerEvent("Events.VideoPlayer.CAN_PLAY_THROUGH"),
    ERROR: HP.Events.registerEvent("Events.VideoPlayer.ERROR", false/*nullable*/, {
      type: {}
    }),
    ENDED: HP.Events.registerEvent("Events.VideoPlayer.ENDED"),
    SEEKING: HP.Events.registerEvent("Events.VideoPlayer.SEEKING"),
    SEEKED: HP.Events.registerEvent("Events.VideoPlayer.SEEKED", false/*nullable*/, {
      state: {},
      position: {},
      duration: {}
    }),
    PLAYING: HP.Events.registerEvent("Events.VideoPlayer.PLAYING"),
    PAUSE: HP.Events.registerEvent("Events.VideoPlayer.PAUSE"),
    TIME_UPDATE: HP.Events.registerEvent("Events.VideoPlayer.TIME_UPDATE",false/*nullable*/, {
      position: {},
      duration: {optional: true}
    }),
    FULL_SCREEN_CHANGE: HP.Events.registerEvent("Events.VideoPlayer.FULL_SCREEN_CHANGE"),
    VOLUME_CHANGE: HP.Events.registerEvent("Events.VideoPlayer.VOLUME_CHANGE"),
    PLAYBACK_START: HP.Events.registerEvent("Events.VideoPlayer.PLAYBACK_START"),
    METRICS_UPDATE: HP.Events.registerEvent("Events.VideoPlayer.METRICS_UPDATE"),
    QUALITY_CHANGED: HP.Events.registerEvent("Events.VideoPlayer.QUALITY_CHANGED"),
    REBUFFER_START: HP.Events.registerEvent("Events.VideoPlayer.REBUFFER_START"),
    REBUFFER_STOP: HP.Events.registerEvent("Events.VideoPlayer.REBUFFER_STOP"),
    /**
     * Reconnecting event. Occured when video player meets some error and it try to reconnect for recover
     * @event
     */
    RECONNECTING: HP.Events.registerEvent("Events.VideoPlayer.RECONNECTING"),
    DURATION_CHANGE: HP.Events.registerEvent("Events.VideoPlayer.DURATION_CHANGE"),
  };

  HP.Events.MediaElement = {
    STALLED: HP.Events.registerEvent("Events.MediaElement.STALLED"),
    LOAD_START: HP.Events.registerEvent("Events.MediaElement.LOAD_START"),
    CAN_PLAY: HP.Events.registerEvent("Events.MediaElement.CAN_PLAY"),
    CAN_PLAY_THROUGH: HP.Events.registerEvent("Events.MediaElement.CAN_PLAY_THROUGH"),
    ERROR: HP.Events.registerEvent("Events.MediaElement.ERROR"),
    ENDED: HP.Events.registerEvent("Events.MediaElement.ENDED"),
    SEEKING: HP.Events.registerEvent("Events.MediaElement.SEEKING"),
    SEEKED: HP.Events.registerEvent("Events.MediaElement.SEEKED"),
    PLAYING: HP.Events.registerEvent("Events.MediaElement.PLAYING"),
    PAUSE: HP.Events.registerEvent("Events.MediaElement.PAUSE"),
    TIME_UPDATE: HP.Events.registerEvent("Events.MediaElement.TIME_UPDATE"),
    FULL_SCREEN_CHANGE: HP.Events.registerEvent("Events.MediaElement.FULL_SCREEN_CHANGE"),
    VOLUME_CHANGE: HP.Events.registerEvent("Events.MediaElement.VOLUME_CHANGE"),
    NEED_KEY: HP.Events.registerEvent("Events.MediaElement.NEED_KEY"),
    KEY_MESSAGE: HP.Events.registerEvent("Events.MediaElement.KEY_MESSAGE"),
    KEY_ERROR: HP.Events.registerEvent("Events.MediaElement.KEY_ERROR"),
    DURATION_CHANGE: HP.Events.registerEvent("Events.MediaElement.DURATION_CHANGE"),
    LOADED_METADATA: HP.Events.registerEvent("Events.MediaElement.LOADED_METADATA")
  };

  HP.Events.HtmlMediaElement = {
    STALLED: "stalled",
    LOAD_START: "loadstart",
    CAN_PLAY: "canplay",
    CAN_PLAY_THROUGH: "canplaythrough",
    ERROR: "error",
    ENDED: "ended",
    SEEKING: "seeking",
    SEEKED: "seeked",
    PLAYING: "playing",
    PAUSE: "pause",
    TIME_UPDATE: "timeupdate",
    FULL_SCREEN_CHANGE: "fullscreenchange",
    MOZ_FULL_SCREEN_CHANGE: "mozfullscreenchange",
    WEBKIT_FULL_SCREEN_CHANGE: "webkitfullscreenchange",
    WEBKIT_BEGIN_FULL_SCREEN: "webkitbeginfullscreen",
    WEBKIT_END_FULL_SCREEN: "webkitendfullscreen",
    VOLUME_CHANGE: "volumechange",
    NEED_KEY: "needkey",
    KEY_MESSAGE: "keymessage",
    KEY_ERROR: "keyerror",
    MS_NEED_KEY: "msneedkey",
    MS_KEY_MESSAGE: "mskeymessage",
    MS_KEY_ERROR: "mskeyerror",
    WEBKIT_NEED_KEY: "webkitneedkey",
    WEBKIT_KEY_MESSAGE: "webkitkeymessage",
    WEBKIT_KEY_ERROR: "webkitkeyerror",
    DURATION_CHANGE: "durationchange",
    LOADED_METADATA: "loadedmetadata"
  };

  HP.Events.MediaSource = {
    SOURCE_OPEN: "sourceopen",
    WEBKIT_SOURCE_OPEN: "webkitsourceopen"
  };

  HP.Events.MetricsProvider = {
    METRICS_UPDATE: HP.Events.registerEvent("Events.MetricsProvider.METRICS_UPDATE", false/*nullable*/, {
      historyBandwidths: {},
      maxBandwidth: {},
      averageBandwidth: {}
    }),
    BANDWIDTH_OVER_ESTIMATED: HP.Events.registerEvent("Events.MetricsProvider.BANDWIDTH_OVER_ESTIMATED"),
  };

  HP.Events.MPD = {
    ERROR: HP.Events.registerEvent("Events.MPD.ERROR", false/*nullable*/, {
      type: {}
    })
  };

  HP.Events.EME = {
    ERROR: HP.Events.registerEvent("Events.EME.ERROR", false/*nullable*/, {
      type: {}
    })
  };
}).call(this);