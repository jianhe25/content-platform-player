(function() {
  HP.VideoPlayer.Portability = {};

  /**
   * Find the attribute of a object if it starts with prefix and ends with suffix
   * @param  {Object} obj find attribute for this object
   * @param  {String} suffix the suffix string
   * @param  {String} prefix the prefix string
   * @return {String} the attribute of a object if it starts with prefix and ends with suffix
   */
  HP.VideoPlayer.Portability.prefixedAttributeName = function(obj, suffix, prefix) {
    suffix = suffix.toLowerCase();
    prefix = prefix || "";

    for (var attr in obj) {
      var lattr = attr.toLowerCase();
      if (lattr.indexOf(prefix) == 0 && lattr.indexOf(suffix, lattr.length - suffix.length) != -1) {
        return attr;
      }
    }
    return null;
  }

  /**
   * Normalize attribute for the given object
   * @param  {Object} obj normalize attribute for this object
   * @param  {String} suffix the suffix string
   * @param  {String} prefix the prefix string
   */
  HP.VideoPlayer.Portability.normalizeAttribute = function(obj, suffix, prefix) {
    prefix = prefix || "";
    var attr = HP.VideoPlayer.Portability.prefixedAttributeName(obj, suffix, prefix);
    if (attr) {
      obj[prefix + suffix] = obj[attr];
    }
  }

  var attachNative = function(video) {
    var URL = window.URL;
    video.src = URL.createObjectURL(this);
  }

  if (window.MediaSource != null || window.WebKitMediaSource != null) {
    if (window.MediaSource != null) {
      window.MediaSource.prototype.version = 'MSE-live';
    } else if (window.WebKitMediaSource != null) {
      window.MediaSource = window.WebKitMediaSource;
      window.MediaSource.prototype.version = 'MSE-live-webkit';
      HP.Events.MediaSource.SOURCE_OPEN = HP.Events.MediaSource.WEBKIT_SOURCE_OPEN;
    }
    window.MediaSource.prototype.attachTo = attachNative;
  }

  HP.VideoPlayer.Portability.normalizeAttribute(window.HTMLMediaElement.prototype, 'generateKeyRequest');
  HP.VideoPlayer.Portability.normalizeAttribute(window.HTMLMediaElement.prototype, 'addKey');
  HP.VideoPlayer.Portability.normalizeAttribute(window.HTMLMediaElement.prototype, 'setMediaKeys');

  HP.VideoPlayer.Portability.normalizeAttribute(window, 'MediaKeys');

  if (window.MSMediaKeys) {
    window.MediaKeys = window.MediaKeys || window.MSMediaKeys;
    window.HTMLMediaElement.prototype.setMediaKeys = window.HTMLMediaElement.prototype.msSetMediaKeys;

    HP.Events.HtmlMediaElement.NEED_KEY = HP.Events.HtmlMediaElement.MS_NEED_KEY;
    HP.Events.HtmlMediaElement.KEY_MESSAGE = HP.Events.HtmlMediaElement.MS_KEY_MESSAGE;
    HP.Events.HtmlMediaElement.KEY_ERROR = HP.Events.HtmlMediaElement.MS_KEY_ERROR;
  } else if (window.navigator.userAgent.indexOf('WebKit') != -1) {
    HP.Events.HtmlMediaElement.NEED_KEY = HP.Events.HtmlMediaElement.WEBKIT_NEED_KEY;
    HP.Events.HtmlMediaElement.KEY_MESSAGE = HP.Events.HtmlMediaElement.WEBKIT_KEY_MESSAGE;
    HP.Events.HtmlMediaElement.KEY_ERROR = HP.Events.HtmlMediaElement.WEBKIT_KEY_ERROR;
  }
}).call(this);
