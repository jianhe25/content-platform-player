(function(){"use strict";var HP={};window["HP"]=HP;/**
 * @namespace HP
 */

// Defining namespace HP before closure compiling may have serious consequences.
// e.g. HP.BaseClass may be treated as a single variable and renamed to a random name.
// We have to add the definition of HP after closure compiling through the wrapping task.
// var HP = {};
(function() {
  var LEVEL_TURN = {
    'log': 1, 
    'info': 2, 
    'warn': 3, 
    'error': 4
  };

  var launchTime = new Date();
  var output = null;
  var actualLogger = null;
  var defaultLevel = null;
  /**
   * @class A static class to log informations
   */
  HP.Logger = {
    getElapsedTime: function() {
      return (new Date()) - launchTime;
    },

    actualLog: function(messages, method) {
      return;
      if (method) {
        if (LEVEL_TURN[defaultLevel] > LEVEL_TURN[method]) {
          return;
        }
      }

      var args = Array.prototype.slice.call(messages).concat();

      if (actualLogger != null) {
        actualLogger(method, args);
        return;
      }
      var time = this.getElapsedTime();
      var timeStr = "";
      var min = Math.floor(time / (60 * 1000));
      timeStr = (min < 10 ? "0" : "") + min + ":";
      time -= (min * 60 * 1000);
      var sec = Math.floor(time / 1000);
      timeStr += (sec < 10 ? "0" : "") + sec + ".";
      time -= sec * 1000;
      timeStr += (time < 100 ? "0" : "") + (time < 10 ? "0" : "") + time;
      var argsStr = args.join('|');
      try {
        if (output != null) {
          var outputContainer = window.document.getElementById(output);
          if (outputContainer != null) {
            outputContainer.innerHTML = timeStr + " >> " + method.toUpperCase() + ": " + argsStr + "\n" + outputContainer.innerHTML;
          }
        } else if (window.console !== null && console[method] !== null && console[method].apply !== null) {
          args.unshift(timeStr);
          console[method].apply(console, args);
        }
      } catch (error) {
        return;
      }
    },

    /**
     * Override the logger output container
     * @param  {String} id Dom ID for the output container
     */
    setOutputContainer: function(id) {
      output = id;
    },

    /**
     * Override the actual logger function
     * @param  {function(string, array)} logFunc The actual logger function override
     */
    setLogFunction: function(logFunc) {
      if (logFunc == null || !(logFunc instanceof Function)) {
        throw new Error("Must set a valid function for logger!");
      }

      actualLogger = logFunc;
    },

    /**
     * Set log level
     * @param  {String} level HP.Logger.LOG_LEVEL HP.Logger.INFO_LEVEL HP.Logger.WARN_LEVEL HP.Logger.ERROR_LEVEL
     */
    setLevel: function(level) {
      defaultLevel = level;
    },

    /**
     * Log the given parameters. It accept one or multiple parameters.
     */
    log: function() {
      HP.Logger.actualLog(arguments, HP.Logger.LOG_LEVEL);
    },

    /**
     * Log the given parameters as info. It accept one or multiple parameters.
     */
    info: function() {
      HP.Logger.actualLog(arguments, HP.Logger.INFO_LEVEL);
    },

    /**
     * Log the given parameters as warning. It accept one or multiple parameters.
     */
    warn: function() {
      HP.Logger.actualLog(arguments, HP.Logger.WARN_LEVEL);
    },

    /**
     * Log the given parameters as error. It accept one or multiple parameters.
     */
    error: function() {
      HP.Logger.actualLog(arguments, HP.Logger.ERROR_LEVEL);
    }
  }

  HP.Logger.LOG_LEVEL = 'log';
  HP.Logger.INFO_LEVEL = 'info';
  HP.Logger.WARN_LEVEL = 'warn';
  HP.Logger.ERROR_LEVEL = 'error';

  HP.Logger.setLevel(HP.Logger.LOG_LEVEL);
}).call(this);
(function() {
  /**
   * @static
   * @class A helper to bind/unbind native event easily.
   * In most case, when binding an event handler by calling addEventListener, 
   * we'll proxy the handler method for assigning a correct call context, this
   * makes us difficult to remove the handler since the handler is changed once
   * we call method.bind(this). So invent this helper to make the unbind possible.
   */
  HP.NativeEventHelper = {
    /**
     * Bind the handler to specified event, and set the call context
     * to given value
     * @param  {EventTarget} element An element with addEventListener/removeEventListener method
     * @param  {String} event   Event name
     * @param  {Function} method  Handler method
     * @param  {Object} context Call context for the handler
     */
    bind: function(element, event, method, context) {
      var handler = method.bind(context);
      element.addEventListener(event, handler);
      // Store the temporary handlers in the context itself, to avoid external reference
      // which might cause extra memory leak risk.
      context.__internalHandlers__ = context.__internalHandlers__ || {};
      context.__internalHandlers__[event] = context.__internalHandlers__[event] || [];
      context.__internalHandlers__[event].push({
        originalMethod: method,
        actualMethod: handler
      });
    },

    /**
     * Unbind the handler which registered by "bind"
     * @param  {EventTarget} element An element with addEventListener/removeEventListener method
     * @param  {String} event   Event name
     * @param  {?Function} method  Handler method, if it's null, will remove the all handlers
     *                             of the given event which are registered on the given context
     * @param  {Object} context Call context for the handler
     */
    unbind: function(element, event, method, context) {
      if (context.__internalHandlers__ && context.__internalHandlers__[event]) {
        var handleArray = context.__internalHandlers__[event];
        var toRemove = -1;
        for (var i = handleArray.length - 1; i >= 0; i--) {
          if (method == null || handleArray[i].originalMethod == method) {
            element.removeEventListener(event, handleArray[i].actualMethod);
            if (method != null) {
              toRemove = i;
              break;
            }
          }
        }
        if (toRemove >= 0) {
          handleArray.splice(toRemove, 1);
        } else {
          delete context.__internalHandlers__[event];
        }
      }
    }
  }
})();
(function(){
  HP.Utils = HP.Utils || {};
  // Extend all the fields from toExtend to the obj
  var extend = function(obj, toExtend) {
    if (toExtend) {
      for (var prop in toExtend) {
        obj[prop] = toExtend[prop];
      } 
    }
    return obj;
  };

  HP.Utils = extend(HP.Utils,
  /** @lends HP.Utils */
  {
    /**
     * Extend all the fields from toExtend to the obj
     * NOTE: the first parameter obj will be modified
     * @param {Object} obj Object to extend
     * @param {Object} toExtend Object to extend from
     * @return {Object} The extended object
     */
    extend: extend
  })
})();
(function() {
  /**
   * @class
   * @classdesc The base class of all our customized classes
   */
  HP.BaseClass = function() {};

  /**
   * @class
   * @classdesc Helper class to create interface
   */
  HP.Interfaces = {};

  /**
   * @class Object
   */
  /**
  * Check whether the given object is instance of the given type
  * @function Object.isInstanceOf
  * @param {Object} instance Instance to detect type
  * @param {Class} type Type to detect
  * @return {Boolean} Return true if it's type of the instance, otherwise false
  */
  Object.isInstanceOf = function(instance, type) {};

  var extend = HP.Utils.extend;

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};
  // A regulare expression to test whether there is call to _super inside the method
  var fnTest = /xyz/.test(function(a) { return /xyz/.test(a); }) ? /\b_super\b/ : /.*/;

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.constructor && protoProps.constructor != Object) {
      child = function() {
        var tmp = this._super;
        this._super = parent;
        protoProps.constructor.apply(this, arguments)
        this._super = tmp;
      }
    } else {
      child = function(){ parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    var _super = parent.prototype;
    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) {
      for (var name in protoProps) {
        if (name == "constructor" && protoProps[name] == Object) continue;
        // Check if we're overwriting an existing function
        child.prototype[name] = typeof protoProps[name] == "function" && typeof _super[name] == "function" && fnTest.test(protoProps[name]) ?
         (function(name, fn) {
          return function() {
            var tmp = this._super;
  
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
  
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;
  
            return ret;
          };
        })(name, protoProps[name]) : protoProps[name];
      }
    }

    // Add static properties to the constructor function, if supplied.
    if (staticProps) extend(child, staticProps);

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  var isConsistent = function(obj1, obj2) {
    return (obj1 instanceof Function && obj2 instanceof Function) 
      || (!(obj1 instanceof Function) && !(obj2 instanceof Function));
  }

  /** 
   * Create an interface.
   * It support create interface directly or extend from other interfaces.
   * In either way, the last argument must be an object to declare the 
   * properties/methods for the interface
   *
   * @param {Object} interfaceProps Properties of interface
   * @return {HP.Interfaces} The interface
   *
   * @example
   * // create simple interface
   * var MyInterface = HP.Interfaces.create({
   *   property1: null,
   *   function1: function() {}
   * });
   * @example
   * // extending from other interfaces
   * var MyInterface = HP.Interfaces.create(OtherInterface1, OtherInterface2, {
   *   property1: null,
   *   function1: function() {}
   * })
   */
  HP.Interfaces.create = function(interfaceProps) {
    var argLen = arguments.length;
    if(argLen == 0) throw new Error("Cannot create an empty interface!");
    var newInterface = function() {
      throw new Error("Cannot initialize an interface!");
    };
    newInterface._isInterface = true;
    newInterface._extendedInterfaces = [];
    var proto = newInterface.prototype;
    extend(proto, arguments[argLen - 1]);
    for (var i = argLen - 2; i >= 0; i--) {
      var current = arguments[i];
      if (!current._isInterface) throw new Error("The " + i + " argument is not interface!");
      for (var prop in current.prototype) {
        // Use "in" instead of "hasOwnProperty", since "in" will check the prototype chain
        // while "hasOwnProperty" only checks current prototype
        if (prop in proto) {
          // If the property/function name is defined, then should assert they're consistent
          // either function, or property.
          if (!isConsistent(proto[prop], current.prototype[prop])) {
            throw new Error("The " + prop + " is defined in multiple places, but with different type!")
          }
        } else {
          // Need copy all the properties instead of prototype chain, since interface
          // may extends mulitple interfaces
          proto[prop] = current.prototype[prop];
        }
      }
      newInterface._extendedInterfaces.push(current);
    };
    return newInterface;
  }

  HP.BaseClass._extendedInterfaces = [];

  /**
   * Extend a sub class from the base class
   * @param  {Object} protoProps prototype properties, a.k.a, instance properties
   * @param  {Object} classProps class properties, a.k.a, static properties
   * @return {Class}  The sub class
   */
  HP.BaseClass.extend = function(protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    child.implement = this.implement;
    // set the _extendedInterfaces an new empty array, otherwise it will use same array instance
    // as parent's
    child._extendedInterfaces = [];
    return child;
  };

  /**
   * Extend a sub class from the base class
   * @param  {Object} protoProps prototype properties, a.k.a, instance properties
   * @param  {Object} classProps class properties, a.k.a, static properties
   * @return {Class}  The sub class
   */
  HP.BaseClass.implement = function() {
    var argLen = arguments.length;
    if (argLen == 0) return this;
    for (var i = 0; i < argLen; i++) {
      var current = arguments[i];
      for (var prop in current.prototype) {
        if (!(prop in this.prototype) ||
          !isConsistent(this.prototype[prop], current.prototype[prop])) {
          throw new Error("Not implement the interface correctly, missing property: " + prop);
        }
      }
      this._extendedInterfaces.push(current);
    };
    return this;
  }

  var traverseInterface = function(target, callback) {
    for (var i = target._extendedInterfaces.length - 1; i >= 0; i--) {
      if (callback.apply(target._extendedInterfaces[i]) === true) return true;
      if (traverseInterface(target._extendedInterfaces[i], callback) === true) return true;
    };
    return false;
  }

  // TODO (Yun): Need re-evaluate whether use duck-typing or interfaces tree for
  // interface detection
  var isInstanceOf = function (instance, type) {
    if (instance instanceof type) return true;
    // We're using prototype chain for class inheritance, so if the type is class, then should be
    // enough by instanceof check. Otherwise, we only have to do more check on interface
    if (!type._isInterface || !instance.constructor) return false;
    var ctor = instance.constructor;
    while(ctor != HP.BaseClass && ctor != Object && ctor != null) {
      // If there is no _extendedInterfaces, it means it's not using the HP.BaseClass inheritance
      // then just return false
      if (!ctor._extendedInterfaces instanceof Array) return false;
      if (ctor._extendedInterfaces.indexOf(type) >= 0) return true;
      if (traverseInterface(ctor, function() {
        if (this._extendedInterfaces.indexOf(type) >= 0)
          return true;
      }) === true) {
        return true;
      }
      ctor = ctor.__super__.constructor;
    }
    return false;
  }

  Object.isInstanceOf = function(instance, type) {
    return isInstanceOf(instance, type);
  }
})();
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
(function() {
  /**
   * @interface HP.Interfaces.IEventDispatcher
   */
  HP.Interfaces.IEventDispatcher = HP.Interfaces.create(
  /** @lends HP.Interfaces.IEventDispatcher.prototype */
  {
    /**
     * Associate events with listening handler.
     * @param  {String} events
     * @param  {Function} handler
     * @param  {Object} [context]
     * @param  {Boolean} [withEventName]
     * @return {Void}
     */
    on: function(events, handler, context, withEventName) {},

    /**
    * Bind events to a hanlder function once, and whne the event is hanled, 
    * will unbind the handler from the event
    * @public
    */
    one: function(events, handler, context, withEventName) {},

    /**
    * Unbind events to a hanlder function, if the hanlder and context both are the same
    * if passing no arguments, will remove all the events and hanlder binding
    * @public
    */
    off: function(events, handler, context) {},

    /**
    * Trigger specifed events, the corresponding event handler will be trigger
    * @public
    */
    trigger: function(events) {}
  })
}).call(this);
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
(function() {
  /**
   * @interface HP.Interfaces.ISwitchingRule
   */
  HP.Interfaces.ISwitchingRule = HP.Interfaces.create(
  /** @lends HP.Interfaces.ISwitchingRule.prototype */
  {
    /**
     * Returns the selected quality from a given quality array under current switching rule and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    getNewQuality: function(metrics, qualities) {},

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {}
  })
}).call(this);
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
(function() {

/**
 * All events
 * @namespace
 */
HP.Events = {};

/**
 * Define all the params which will be broadcast with the certain event
 * @type {Object}
 * @private
 */
var eventParams = {};

/**
 * Register the params object with event name
 * @param  {String} key event name
 * @param  {Boolean} [nullable=true] if the event broadcast with no params
 * @param  {Object} [value={}] the object is params of events, just like this
 * {
 *   reason: {optional: true}
 *   error: {}
 * }
 * each param is an object too, you can define if it is optional
 * with a field name "optional" with a boolean value
 * no such field means necessary
 * @return {String} event name
 */
HP.Events.registerEvent = function(key, nullable, value) {
  nullable = nullable === undefined ? true : nullable;
  eventParams[key] = {nullable: nullable, properties: value || {}};
  return key;
};

var eventSplitter = /\s+/;

HP.Events.EventDispatcher = HP.BaseClass.extend(
/** @lends HP.Events.EventDispatcher.prototype */
{
    /**
    * @constructs
    * @classdesc This is the class of EventDispatcher, and the global
    * instance HP.Events.globalDispatcher is an instance of this class
    */
    constructor: function(){
    },

    /**
     * Associate events with listening handler.
     * @param  {String} events
     * @param  {Function} handler
     * @param  {Object} [context]
     * @param  {Boolean} [withEventName]
     * @return {Void}
     */
    on: function(events, handler, context, withEventName){
      this._on(events, handler, context, {one: false, withEventName: withEventName});
    },

    /**
    * Bind events to a hanlder function once, and whne the event is hanled,
    * will unbind the handler from the event
    * @public
    */
    one: function(events, handler, context, withEventName){
      this._on(events, handler, context, {one: true, withEventName: withEventName});
    },

    /**
    * Unbind events to a hanlder function, if the hanlder and context both are the same
    * if passing no arguments, will remove all the events and hanlder binding
    * @public
    */
    off: function(events, handler, context){
      var event, data, list, node, prev;

      if(!this._subscriptions) return;
        // clear all event _subscriptions if no events/handler/context specified.
        if(!(events || handler || context)){
          delete this._subscriptions;
          return this;
        }

        events = this._getEvents(events);
        while(event = events.shift()){
          list = this._subscriptions[event];
          if (!list) {
            continue;
          }
          prev = list;
          node = list.next;
          while(node !== list.tail){
            context = context || this;
            if((node.handler == handler || handler == null) && node.context == context) {
              prev.next = node.next;
              node.next = null; //release reference to next node
              node = prev.next;
            } else {
              prev = node;
              node = node.next;
            }
          }
        }
      },

    /**
    * Trigger specifed events, the corresponding event handler will be trigger
    * @public
    */
    trigger: function(events) {
      var event, data, list, node, prev;

      // Do nothing if no event _subscriptions.
      if(!this._subscriptions) return;

      events = this._getEvents(events);
      data = Array.prototype.slice.call(arguments, 1);
      while(event = events.shift()){
        // check params invalidation
        if (eventParams[event]) {
          // require params
          if (!eventParams[event].nullable) {
            // if params don't exist
            if (!data[0]) {
              this._onEventParamMissing();
            } else {
              // check necessary params
              var missingFields = [];
              for (var attribute in eventParams[event].properties) {
                if (!eventParams[event].properties[attribute].optional && !data[0].hasOwnProperty(attribute)) {
                  missingFields.push(attribute);
                }
              }

              if (missingFields.length > 0) {
                this._onEventParamLack(missingFields, event);
              }
            }
          }
        } else {
          this._onEventNotDefined(event);
        }

        if(list = this._subscriptions[event]){
          prev = list;
          node = list.next;
          while(node !== list.tail){
            var nextNode = node.next;
            if(node.withEventName){
              node.handler.apply(node.context || this, [event].concat(data));
            } else {
              node.handler.apply(node.context || this, data);
            }
            if(node.one){
              prev.next = nextNode;
              node.next = null;
              node = prev.next;
            }else{
              prev = node;
              node = nextNode;
            }
          }
        }
      }

      return this;
    },

    /**
    * Maintain a linked list of handlers(listeners) for each event. Set an empty tail {} as end of list.
    * @ignore
    */
    _subscriptions: null,

    /**
    * @ignore
    */
    _on: function(events, handler, context, options){
      var event, list, node;

      if(!handler) return this;
      this._subscriptions = this._subscriptions || {};
      events = this._getEvents(events);
      while(event = events.shift()){
        list = this._subscriptions[event];
        context = context || this;
        var one = options && options.one;
        var alreadyExist = false;
        if(list){
          node = list.next;
          while(node != list.tail){
            if(node.handler == handler && node.context == context && node.one == one){
              alreadyExist = true;
            }
            node = node.next;
          }
        }
        if(!alreadyExist){
          node = list ? list.tail: {};
          node.next = {};
          node.context = context || this;
          node.handler = handler;
          node.one = options && options.one;
          node.withEventName = options.withEventName
          this._subscriptions[event] = {next: list ? list.next: node, tail: node.next};
        }
      }
      return this;
    },

    _getEvents: function(events) {
      if(typeof(events) == "string"){
        events = events.split(eventSplitter);
      } else if (!(events instanceof Array)){
        events = [events];
      }
      return events;
    },

    _onEventParamLack: function(missingFields, event) {
      var str = missingFields.join(", ");
      throw new Error("Event " + event + " misses " + str + " fields in its parameter!");
    },

    _onEventParamMissing: function() {
      throw new Error("Event " + event + " need params!");
    },

    _onEventNotDefined: function(name) {
    }
  }).implement(HP.Interfaces.IEventDispatcher)
}).call(this);
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
(function() {
  HP.VideoPlayer.BandwidthSwitchingRule = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.BandwidthSwitchingRule.prototype */
  {
    _reason: '',

    /**
     * Base switching rule
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
    },

    /**
     * Returns the selected quality from a given quality array under current switching rule and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    getNewQuality: function(metrics, qualities) {
      var currentBandwidth = metrics.getAverageBandwidth();
      var rtt = metrics.getRTT();
      var bestQuality;

      for (var i = 0; i < qualities.length; i++) {
        //Should consider the RTT here
        if (currentBandwidth > 0 && (qualities[i].getSafeBandwidth() <= (5 - rtt) / 5 * currentBandwidth)) {
          bestQuality = qualities[i];
          continue;
        }
        break;
      }

      if(bestQuality) {
        this._reason = 'it is the maximum one with a safe bandwidth ' +  parseInt(bestQuality.getSafeBandwidth() / 1024) + ' that is smaller than the avg bandwidth ' + parseInt(currentBandwidth / 1024);
        return bestQuality;
      } else {
        this._reason = 'it is the minimum one when all the safe bandwidth of qualities are larger than the avg bandwidth ' + parseInt(currentBandwidth / 1024);
        return qualities[0];
      }
    },

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {
      return this._reason;
    }
  }).implement(HP.Interfaces.ISwitchingRule)
}).call(this);
(function() {
  /**
   * The number of milliseconds for time update timer.
   * @type {Number}
   * @constant
   * @private
   */
  var TIME_UPDATE_TIMEOUT = 20000;

  /**
   * Enum for media element's ready state
   * @enum {int}
   */
  var READY_STATE =  {
    HAVE_NOTHING: 0,
    HAVE_METADATA : 1,
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
    HAVE_ENOUGH_DATA: 4
  };

  /**
   * Enum for timeout checker
   * the state of player we should check timeout
   * @type {Object}
   * @param {int} state state code
   * @param {Number} interval the interval to timeout
   * @param {Boolean} needTimeUpdate If true, the player can not stay in this state for too long without any time update event.
   */
  var TIMEOUT_CHECKER = {
    //Player is in playing state but not receive any time update event.
    PLAYING:                               {state: 0, interval: 20000, needTimeUpdate: true},
    //When rebuffer happens, player is paused automatically and don't have enough buffer to play.
    AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER:     {state: 1, interval: 20000, needTimeUpdate: false},
    //When rebuffer happens, player is paused automatically and have enough buffer to play.
    AUTO_PAUSED_WITH_ENOUGH_BUFFER:        {state: 2, interval: 5000,  needTimeUpdate: false},
    //Player don't have enough buffer to player after seeking.
    SEEKING_WITHOUT_ENOUGH_BUFFER:         {state: 3, interval: 20000, needTimeUpdate: false},
    //Player has enough buffer to play after seeking but still not enter playing state.
    SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING: {state: 4, interval: 5000,  needTimeUpdate: false},
    //Player has finished to video but still not receive the video end event.
    VIDEO_END:                             {state: 5, interval: 3000,  needTimeUpdate: false},
    //Http player is in loading state.
    HTTP_LOADING:                          {state: 6, interval: 15000, needTimeUpdate: false},
    //Player will seek at first when resuming, and have enought buffer to resume.
    SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING:{state: 7, interval: 2000,  needTimeUpdate: false}
  };

  HP.VideoPlayer.BaseVideoPlayer = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.BaseVideoPlayer.prototype */
  {
    /**
     * Available MediaElement for player
     * @type {HP.Interfaces.IMediaElement}
     * @protected
     */
    mediaElement: null,

    /**
     * The next pause is called automatically and not by user
     * @type {Boolean}
     * @protected
     */
    autoPausePending: false,

    /**
     * True if the player is not paused by user
     * @type {Boolean}
     * @protected
     */
    autoPaused: true,

    /**
     * Indicate whether we have fired PLAYBACK_START event
     * @type {Boolean}
     * @protected
     */
    playbackStartFired: false,

    /**
     * Player should seek first when playing video if true
     * @type {Boolean}
     * @protected
     */
    autoSeekPending: false,

    /**
     * Pause the player should the buffer not be full enough
     * @type {Boolean}
     * @protected
     */
    pauseOnReadyStateBuffering: true,

    /**
     * Indicate whether the buffer is first full after first playing or seeking
     * @type {Boolean}
     * @protected
     */
    firstBufferFull: false,

    /**
     * Indicate whether th player is in rebuffer sate
     * @type {Boolean}
     * @protected
     */
    isRebuffering:  false,

    /**
     * Indicate whether the player has enough buffer to play
     * @type {Boolean}
     */
    hasEnoughBuffer: false,

    /**
     * Progress timer
     * @type {int}
     * @protected
     */
    progressTimer: -1,

    /**
     * Stream url
     * @type {String}
     */
    httpUrl: null,

    /**
     * State of player
     * @type {String}
     * @private
     */
    _state: HP.VideoPlayer.State.INIT,

    _duration: NaN,

    _position: 0,

    _volume: 1,

    _muted: false,

    _pendingStateAfterSeek: null,

    _timeoutTimerCount: 0,

    _hasTimeUpdate: false,

    _timeoutChecker: null,

    _mediaElementEventHandlers: null,

    _externalTimeoutChecker: null,

    log_prefix: "http player",

    /**
     * Base video player
     * @param  {HP.Interfaces.IMediaElement} mediaElement available MediaElement
     * @extends {HP.Events.EventDispatcher}
     * @constructs
     */
    constructor: function(mediaElement) {
      this.mediaElement = mediaElement;
      this._mediaElementEventHandlers = {};

      this._setHandler(HP.Events.MediaElement.SEEKING, this.onSeeking);
      this._setHandler(HP.Events.MediaElement.SEEKED, this.onSeeked);
      this._setHandler(HP.Events.MediaElement.PAUSE, this.onPause);
      this._setHandler(HP.Events.MediaElement.PLAYING, this.onPlaying);
      this._setHandler(HP.Events.MediaElement.TIME_UPDATE, this.onTimeUpdate);
      this._setHandler(HP.Events.MediaElement.ERROR, this.onError);
      this._setHandler(HP.Events.MediaElement.ENDED, this.onEnded);
      this._setHandler(HP.Events.MediaElement.CAN_PLAY, this.onCanPlay);
      this._setHandler(HP.Events.MediaElement.CAN_PLAY_THROUGH, this.onCanPlayThrough);
      this._setHandler(HP.Events.MediaElement.LOAD_START, this.onLoadStart);
      this._setHandler(HP.Events.MediaElement.STALLED, this.onStalled);
      this._setHandler(HP.Events.MediaElement.FULL_SCREEN_CHANGE, this.onFullscreenChange);
      this._setHandler(HP.Events.MediaElement.VOLUME_CHANGE, this.onVolumeChange);
      this._setHandler(HP.Events.MediaElement.DURATION_CHANGE, this.onDurationChanged);
      this._setHandler(HP.Events.MediaElement.LOADED_METADATA, this.onLoadedMetadata);

      this.setState(HP.VideoPlayer.State.INIT);
    },

    /**
     * Callback called when media element is triggering events
     * @param  {String} event triggered event
     * @param  {Object} data  event data
     * @internal this should be only called by media element when this player is owning it
     */
    onMediaElementEvent: function(event, data) {
      if (this._mediaElementEventHandlers[event]) {
        this._mediaElementEventHandlers[event].call(this, data);
      }
    },

    _setHandler: function(event, handler) {
      this._mediaElementEventHandlers[event] = handler;
    },

    /**
     * Reset VideoPlayer to original state
     * @todo Make it private.
     */
    reset: function() {
      this.mediaElement.detach(this);
      this.setState(HP.VideoPlayer.State.INIT);
      this._resetTimeoutChecker();
      this._duration = NaN;
      this._position = 0;
      this._volume = 1;
      this._muted = false;
      this._pendingStateAfterSeek = null;
      this.autoPausePending = false;
      this.autoSeekPending = false;
      this.playbackStartFired = false;
      this.firstBufferFull = false;
      this.isRebuffering = false;
      this.hasEnoughBuffer = false;
      this.httpUrl = null;
      this._externalTimeoutChecker = null;
    },

    /**
     * Play video from current time
     */
    play: function(start) {
      if (!this.isOwningElement()) {
        this.mediaElement.attach(this);
      }
      if(start && start > 0) {
        this.seek(start);
      }
      HP.Logger.log(this.log_prefix + ' play COMMAND: mediaElement.play()');
      this.mediaElement.play();
    },

    /**
     * Pause video at current time
     */
    pause: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' pause COMMAND: mediaElement.pause()');
      this.mediaElement.pause();
      this._position = this.mediaElement.getPosition();
    },

    /**
     * Seek video to a given position
     * @param  {Number} position the target seek position in millisecond
     */
    seek: function(position) {
      //HACK: if seek to a position less than 0.5 sec before the end of the video,
      //      there will no seeked or time update event dispatched when seeking completed.
      //      This will lead player to a timeout error state.
      //Note: If seek position is larger than video duration, a time update event will
      //      be dispatched correctly.
      position = Math.min(position, this._duration - 1000);
      this._position = position;
      if (!this.isOwningElement()) {
        return;
      }
      this._switchRebufferState(false);
      HP.Logger.log(this.log_prefix + ' seek COMMAND: mediaElement.seek() - ' + position);
      this.mediaElement.seek(position);
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {
      if (!this.isOwningElement()) {
        return;
      }
      this.pause();
      HP.Logger.log(this.log_prefix + ' stop COMMAND: mediaElement.load()');
      this.mediaElement.load("");
      this.reset();
    },

    /**
     * Mute player
     */
    mute: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' mute COMMAND: mediaElement.mute()');
      this.mediaElement.mute();
      this._muted = this.mediaElement.getMuted();
    },

    /**
     * Unmute player
     */
    unmute: function() {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' unmute COMMAND: mediaElement.unmute()');
      this.mediaElement.unmute();
      this._muted = this.mediaElement.getMuted();
    },

    /**
     * Get whether it's muted
     * @return {Boolean} Return true if it's muted
     */
    getMuted: function() {
      return this._muted;
    },

    /**
     * Set current state of this VideoPlayer
     * @param {string} current state
     */
    setState: function(state) {
      if(this._state != state) {
        HP.Logger.log(this.log_prefix + ' state changed from ' + this._state + ' to ' + state);

        this._state = state;
        this._resetTimeoutChecker();
      }
    },

    _resetTimeoutChecker: function() {
      this._timeoutTimerCount = 0;
      this._timeoutChecker = null;
      this._hasTimeUpdate = false;
    },

    /**
     * Checkt player state to choose the timeout checker
     * @return {Object} the timeout checker. null means no need to check timeout.
     */
    _getTimeoutChecker: function() {
      if (!this.mediaElement.isPaused() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        if(this.getDuration() - this.getPosition() < 1500) {
          return TIMEOUT_CHECKER.VIDEO_END;
        } else {
          return TIMEOUT_CHECKER.PLAYING;
        }
      }
      if (this.mediaElement.isPaused() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        if (this.hasEnoughBuffer) {
          return TIMEOUT_CHECKER.AUTO_PAUSED_WITH_ENOUGH_BUFFER;
        } else if (this.isRebuffering || this.httpUrl){
          return TIMEOUT_CHECKER.AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER;
        }
      }
      if (this.getState() == HP.VideoPlayer.State.SEEKING) {
        if(this.hasEnoughBuffer) {
          if(this._pendingStateAfterSeek == HP.VideoPlayer.State.PLAYING) {
            return TIMEOUT_CHECKER.SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING;
          }
          //DASHJS-708: Blank when resume from last position
          //Player will seek at first when resuming, but in IE11, it won't fire seeked event. So check this timeout to let player retry once.
          if(this._pendingStateAfterSeek == HP.VideoPlayer.State.READY) {
            return TIMEOUT_CHECKER.SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING;
          }
        }
        if (!this.hasEnoughBuffer && this.httpUrl) {
          return TIMEOUT_CHECKER.SEEKING_WITHOUT_ENOUGH_BUFFER;
        }
      }
      if (this.httpUrl && (this.getState() == HP.VideoPlayer.State.LOADING || (this.getState() == HP.VideoPlayer.State.READY && this.autoPaused))) {
        return TIMEOUT_CHECKER.HTTP_LOADING;
      }
      return null;
    },

    /**
     * Check whether the player is timeout in some states
     * @protected
     */
    checkTimeout: function() {
      if(!this.isOwningElement()) {
        return;
      }

      //If no need to check timeout or the timeout checker is changed, then reset.
      var newTimeoutChecker = this._getTimeoutChecker();

      if (!newTimeoutChecker) {
        this._resetTimeoutChecker();
        return;
      }

      if(this._timeoutChecker == null || this._timeoutChecker.state != newTimeoutChecker.state) {
        this._resetTimeoutChecker();
        this._timeoutChecker = newTimeoutChecker;
        return;
      }

      var interval = this._timeoutChecker.interval;
      if(this._externalTimeoutChecker && this._externalTimeoutChecker.length > 0 && this._externalTimeoutChecker[this._timeoutChecker.state]) {
        interval = this._externalTimeoutChecker[this._timeoutChecker.state];
      }

      if (this._timeoutTimerCount >= interval / HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL) {
        if(this._timeoutChecker.state == TIMEOUT_CHECKER.VIDEO_END.state) {
          this.onEnded();
        } else {
          this.onError({type: HP.VideoPlayer.Error.MEDIA_TIMEOUT_ERROR, 'timeoutState': this._timeoutChecker.state});
        }
      } else if (this._timeoutChecker.needTimeUpdate && this._hasTimeUpdate) {
        this._hasTimeUpdate = false;
        this._timeoutTimerCount = 0;
      } else {
        this._timeoutTimerCount ++;
      }
    },

    /**
     * Get current state of this VideoPlayer
     * @return {string} current state
     */
    getState: function() {
      return this._state;
    },

    /**
     * Get current position of video
     * @return {Number} current position of video in millisecond
     */
    getPosition: function() {
      return this._position;
    },

    /**
     * Get current duration of video
     * @return {Number} current duration of video in millisecond
     */
    getDuration: function(){
      return this._duration;
    },

    /**
     * Get current volume of video
     * @return {Number} current volume of video
     */
    getVolume: function() {
      return this._volume;
    },

    /**
     * Set current volume of video to a target value
     * @param  {Number} volume target volume
     */
    setVolume: function(volume) {
      if (!this.isOwningElement()) {
        return;
      }
      HP.Logger.log(this.log_prefix + ' volume COMMAND: mediaElement.setVolume() - ' + volume);
      this.mediaElement.setVolume(volume);
      this._volume = this.mediaElement.getVolume();
    },

    _switchRebufferState: function(isRebuffering) {
      if(this.isRebuffering != isRebuffering && this.firstBufferFull) {
        this.trigger(isRebuffering ? HP.Events.VideoPlayer.REBUFFER_START : HP.Events.VideoPlayer.REBUFFER_STOP, this.getRebufferParams(isRebuffering));
        if(isRebuffering) {
          this.onRebufferStart();
        }
      }
      this.isRebuffering = isRebuffering;
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.PAUSE
     * @fires HP.Events.VideoPlayer.PAUSE
     * @protected
     */
    onPause: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PAUSE);

      this.autoPaused = this.autoPausePending;
      this.autoPausePending = false;
      if(!this.autoPaused) {
        this.setState(HP.VideoPlayer.State.PAUSED);
        this.trigger(HP.Events.VideoPlayer.PAUSE);
      } else {
        this._switchRebufferState(true);
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.PLAY
     * @fires HP.Events.VideoPlayer.PLAYING
     * @protected
     */
    onPlaying: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PLAYING);

      this._switchRebufferState(false);
      this.firstBufferFull = true;
      this.autoPausePending = false;
      this.autoPaused = false;
      this.setState(HP.VideoPlayer.State.PLAYING);

      if(!this.playbackStartFired) {
        this.trigger(HP.Events.VideoPlayer.PLAYBACK_START);
        HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.PLAYBACK_START);
        this.playbackStartFired = true;
      }

      this.trigger(HP.Events.VideoPlayer.PLAYING);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.SEEKING
     * @fires HP.Events.VideoPlayer.SEEKING
     * @protected
     */
    onSeeking: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.SEEKING);

      this._switchRebufferState(false);

      //if still in another seeking process, don't change the pending state.
      if(this.getState() != HP.VideoPlayer.State.SEEKING) {
        this._pendingStateAfterSeek = this.getState();
      }
      this.setState(HP.VideoPlayer.State.SEEKING);
      this.trigger(HP.Events.VideoPlayer.SEEKING);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.SEEKED
     * @fires HP.Events.VideoPlayer.SEEKED
     * @protected
     */
    onSeeked: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.SEEKED);

      this.firstBufferFull = false;
      if(this.getState() == HP.VideoPlayer.State.SEEKING) {
        this.setState(this._pendingStateAfterSeek);
      }
      this.trigger(HP.Events.VideoPlayer.SEEKED, {state: this.getState(), position: this.getPosition(), duration: this.getDuration()});
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.TIME_UPDATE
     * @fires HP.Events.VideoPlayer.TIME_UPDATE
     * @protected
     */
    onTimeUpdate: function() {
      // When player source is chagned, it will fire a timeupdate event
      // with the position 0 and duration NaN, we should ignore this event
      if (isNaN(this.mediaElement.getDuration()) || this.getState() == HP.VideoPlayer.State.SEEKING || this.autoSeekPending) {
        return;
      }
      this._hasTimeUpdate = true;
      this._position = this.mediaElement.getPosition();
      this.trigger(HP.Events.VideoPlayer.TIME_UPDATE, {position: this.getPosition(), duration: this.getDuration()});
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.ERROR
     * @fires HP.Events.VideoPlayer.ERROR
     * @protected
     */
    onError: function(event) {
      var params = {};
      try {
        params['playerState'] = this.getState();
        params['playerPosition'] = this.getPosition();
        params['playerDuration'] = this.getDuration();
        params['playerAutoPaused'] = this.autoPaused;
        params['playerBufferEnough'] = this.hasEnoughBuffer;
        params['videoTagPosition'] = this.mediaElement.getPosition();
        params['videoTagDuration'] = this.mediaElement.getDuration();
        params['videoTagPaused'] = this.mediaElement.isPaused();
        params['videoTagEnded'] = this.mediaElement.isEnded();
        params['videoTagSeeking'] = this.mediaElement.isSeeking();
      } catch (ex) {
      }

      event = event || {};

      if(event.target && event.target.error){
        var error = event.target.error;
        switch(error.code) {
          case error['MEDIA_ERR_ABORTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_ABORTED_ERROR;
            break;
          case error['MEDIA_ERR_NETWORK']:
            params.type = HP.VideoPlayer.Error.MEDIA_NETWORK_ERROR;
            break;
          case error['MEDIA_ERR_DECODE']:
            params.type = HP.VideoPlayer.Error.MEDIA_DECODE_ERROR;
            break;
          case error['MEDIA_ERR_SRC_NOT_SUPPORTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_SRC_NOT_SUPPORTED_ERROR;
            break;
          case error['MS_MEDIA_ERR_ENCRYPTED']:
            params.type = HP.VideoPlayer.Error.MEDIA_ENCRYPTED_ERROR;
            break;
        }
      } else {
        HP.Utils.extend(params, event);
      }

      if(!params.type || params.type == '') {
        HP.Logger.warn('Should have type filed when trigger error event');
        params.type = HP.VideoPlayer.Error.MEDIA_UNKNOWN_ERROR;
      }

      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.ERROR + ' - ' + params.type);

      this.setState(HP.VideoPlayer.State.ERROR);
      this.trigger(HP.Events.VideoPlayer.ERROR, params);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.ENDED
     * @fires HP.Events.VideoPlayer.ENDED
     * @protected
     */
    onEnded: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.ENDED);

      this.setState(HP.VideoPlayer.State.ENDED);
      this.trigger(HP.Events.VideoPlayer.ENDED);
    },

    _autoSeeking: function() {
      if (this.autoSeekPending) {
        try {
          HP.Logger.log(this.log_prefix + ' autoSeeking COMMAND: mediaElement.seek()');
          this.mediaElement.seek(this.getPosition());
        }
        finally {
          this.autoSeekPending = false;
        }
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.CAN_PLAY
     * @fires HP.Events.VideoPlayer.CAN_PLAY
     * @protected
     */
    onCanPlay: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.CAN_PLAY);

      if(this.getState() == HP.VideoPlayer.State.LOADING) {
        this.setState(HP.VideoPlayer.State.READY);
      }
      this.trigger(HP.Events.VideoPlayer.CAN_PLAY);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.CAN_PLAY_THROUGH
     * @fires HP.Events.VideoPlayer.CAN_PLAY_THROUGH
     * @protected
     */
    onCanPlayThrough: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.CAN_PLAY_THROUGH);

      if(this.getState() == HP.VideoPlayer.State.LOADING) {
        this.setState(HP.VideoPlayer.State.READY);
      }
      this.trigger(HP.Events.VideoPlayer.CAN_PLAY_THROUGH);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.LOAD_START
     * @fires HP.Events.VideoPlayer.LOAD_START
     * @protected
     */
    onLoadStart: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.LOAD_START);

      this.setState(HP.VideoPlayer.State.LOADING);
      this.trigger(HP.Events.VideoPlayer.LOAD_START);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.STALLED
     * @fires HP.Events.VideoPlayer.STALLED
     * @protected
     */
    onStalled: function() {
      this.trigger(HP.Events.VideoPlayer.STALLED);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.FULL_SCREEN_CHANGE
     * @fires HP.Events.VideoPlayer.FULL_SCREEN_CHANGE
     * @protected
     */
    onFullscreenChange: function(params) {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.FULL_SCREEN_CHANGE);

      this.trigger(HP.Events.VideoPlayer.FULL_SCREEN_CHANGE, params);
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.VOLUME_CHANGE
     * @fires HP.Events.VideoPlayer.VOLUME_CHANGE
     * @protected
     */
    onVolumeChange: function() {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.VOLUME_CHANGE + ' - ' + this.getVolume());

      this.trigger(HP.Events.VideoPlayer.VOLUME_CHANGE, {value: this.getVolume()});
    },

    /**
     * Triggered when duration is changed
     * @protected
     */
    onDurationChanged: function() {
      this._duration = this.mediaElement.getDuration();

      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.VideoPlayer.DURATION_CHANGE + ' - ' + this._duration);

      if (!isNaN(this._duration) && this._duration > 0) {
        this.trigger(HP.Events.VideoPlayer.DURATION_CHANGE);

      }
    },

    /**
     * Triggered when player just determined the duration and dimensions of the media resource
     * @protected
     */
    onLoadedMetadata: function(event) {
      HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.MediaElement.LOADED_METADATA);

      //For MediaKeys browser, seek in onLoadedMetadata event will cause exception. So move it to onCanPlayThrough
      if (!window.MediaKeys) {
        this._autoSeeking();
      }
    },

    /**
     * Called when attach to the media element
     * @protected
     */
    onAttachMediaElement: function() {
      this.firstBufferFull = false;
      this.autoSeekPending = this.getPosition() > 0 ? true : false;

      this.clearProgressTimer();
      this.progressTimer = window.setInterval(this._onHttpProgress.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);

      HP.Logger.log(this.log_prefix + ' onAttachMediaElement COMMAND: mediaElement.load() - ' + this.httpUrl);
      this.mediaElement.load(this.httpUrl);
      this.setState(HP.VideoPlayer.State.LOADING);
    },

    /**
     * Called when detach from the media element
     * @protected
     */
    onDetachMediaElement: function() {
      this.clearProgressTimer();

      HP.Logger.log(this.log_prefix + ' onDetachMediaElement COMMAND');
    },

    /**
     * Whether it's owning the MediaElement
     * @return {Boolean} True if it's owning the MediaElement
     * @protected
     */
    isOwningElement: function() {
      return this.mediaElement.getOwner() == this;
    },

    /**
     * Initial configs
     * @param  {Object} options initialization configs {autoplayer, preload, startPosition}
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Array}  [options.externalTimeoutChecker] Timeout check for different state. Need to sort as follow
     * {
     *   PLAYING, /Player is in playing state but not receive any time update event.
     *   AUTO_PAUSED_WITHOUT_ENOUGH_BUFFER, /When rebuffer happens, player is paused automatically and don't have enough buffer to play.
     *   AUTO_PAUSED_WITH_ENOUGH_BUFFER, //When rebuffer happens, player is paused automatically and have enough buffer to play.
     *   SEEKING_WITHOUT_ENOUGH_BUFFER, //Player don't have enough buffer to player after seeking.
     *   SEEKING_WITH_ENOUGH_BUFFER_TO_PLAYING, //Player has enough buffer to play after seeking but still not enter playing state.
     *   VIDEO_END, //Player has finished to video but still not receive the video end event.
     *   HTTP_LOADING, //Http player is in loading state.
     *   SEEKING_WITH_ENOUGH_BUFFER_TO_RESUMING, //Player will seek at first when resuming, and have enought buffer to resume.
     * }
     * @protected
     */
    initConfigs: function(options) {
      if(this.getState() != HP.VideoPlayer.State.INIT) {
        this.reset();
      }

      this.autoPaused = options.autoplay && !options.preload;
      this._externalTimeoutChecker = options.externalTimeoutChecker || [];

      if(options.startPosition > 0) {
        this._position = options.startPosition;
        this.autoSeekPending = true;
      }
    },

    /**
     * Load video by stream url
     * @param  {String} streamUrl video source
     * @param  {Object} options initialization configs
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     *
     */
    load: function(streamUrl, options) {
      options = options || {};

      this.initConfigs(options);

      if (options.pauseOnBuffering === false) {
          this.pauseOnReadyStateBuffering = false;
      }

      if(this.httpUrl != streamUrl) {
        this.playbackStartFired = false;
      }
      this.httpUrl = streamUrl;

      this.mediaElement.attach(this);
    },

    /**
     * Clear progress timer
     */
    clearProgressTimer: function() {
      if(this.progressTimer >= 0) {
        window.clearInterval(this.progressTimer);
        this.progressTimer = -1;
      }
    },

    _onHttpProgress: function() {
      if (!this.isOwningElement()) {
        this.clearProgressTimer();
        return;
      }

      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      this.checkTimeout();
      if (HP.VideoPlayer.State.SEEKING != this.getState()) {
        this._checkHttpBuffer()
      }
    },

    /**
     * Check whether the buffer is enough to play
     * @protected
     */
    _checkHttpBuffer: function() {
      var readyState = this.mediaElement.getReadyState();
      var notEnoughBuffered = false;

      if (!this.firstBufferFull || this.isRebuffering) {
        notEnoughBuffered |= (this.mediaElement.getReadyState() < READY_STATE.HAVE_ENOUGH_DATA);
      } else {
        notEnoughBuffered |= (this.mediaElement.getReadyState() < READY_STATE.HAVE_FUTURE_DATA);
      }

      if (this.pauseOnReadyStateBuffering) {
        if (this.mediaElement.isPaused()) {
          if (this.autoPaused) {
            if (!notEnoughBuffered) {
              HP.Logger.log(this.log_prefix + ' checkHttpBuffer COMMAND: mediaElement.play()');
              this.mediaElement.play();
            }
          }
        } else {
          if (notEnoughBuffered) {
            this.autoPausePending = true;
            HP.Logger.log(this.log_prefix + ' checkHttpBuffer COMMAND: mediaElement.pause()');
            this.mediaElement.pause();
          }
        }
      }

      this.hasEnoughBuffer = !notEnoughBuffered;
    },

    /**
     * Retures current video stream source
     * @return {String} current video stream source
     */
    getCurrentSource: function() {
      return this.httpUrl;
    },

    checkVideoEnd: function() {
      return (this.mediaElement.getDuration() - this.mediaElement.getPosition() < 1000);
    },

    onRebufferStart: function() {

    },

    getRebufferParams: function(isRebuffering) {

    }
  },
  /** @lends HP.VideoPlayer.BaseVideoPlayer */
  {
    /**
     * The interval of milliseconds for progress timer.
     * @type {Number}
     * @constant
     * @protected
     */
    PROGRESS_TIMER_INTERVAL: 500
  }).implement(HP.Interfaces.IBaseVideoPlayer)
}).call(this);
(function() {
  /**
   * The default maximum seconds of buffered
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_MAX_BUFFERED_SECS = 20;

  /**
   * The maximum retry time for requesting segment
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_RETRY_TIME = 1;

  /**
   * The number of milliseconds a segment request can take before receiving onload event.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_DONE_TIMEOUT = 10000;

  /**
   * The number of milliseconds a segment request can take before receiving onprogress event.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_PROGRESS_TIMEOUT = 8000;

  /**
   * Player will start playing when buffer length is greater than this variable
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_QUICK_START_SECS = 2;

  /**
   * Player will resume when buffer length is greater than this variable
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_RESUME_SECS = 5;

  /**
     * Player will trigger rebuffer event when buffer length is less than this variable.
     * @type {Number}
     * @constant
     * @protected
     */
  var DEFAULT_REBUFFER_SECS = 0.8;

  /**
     * The number of seconds till the end of range to detect the end of the segment.
     * @type {Number}
     * @constant
     * @protected
     */
  var DEFAULT_RANGE_END_SECS = 10; // this should be set to the length of a typical segment

  /**
   * The maximum re-connect time
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_STREAM_RETRY_TIME = 1;

  /**
   * Reason for reseting source buffer
   * @type {Object}
   * @constant
   * @private
   */
  var RESET_REASONS =  {
    MBR: "mbr",
    SEEK: "seek",
    STOP: "stop",
    DETACH: "detach"
  };

  HP.VideoPlayer.DashVideoPlayer = HP.VideoPlayer.BaseVideoPlayer.extend(
  /** @lends HP.VideoPlayer.DashVideoPlayer.prototype */
  {
    /**
     * Data of video sources
     * @type {HP.VideoPlayer.MPD}
     */
    _mpd: null,

    /**
     * DRM license URL
     * @type {String}
     * @private
     */
    _licenseUrl: null,

    /**
     * The content key For clearkey DRM
     * @type {String}
     * @private
     */
    _contentKey: null,

    /**
     * Metrics provider
     * @type {HP.VideoPlayer.MetricsProvider}
     */
    _metrics: null,

    /**
     * EMEHandler, to control playback of protected content
     * @type {HP.VideoPlayer.EMEHandler}
     */
    _emeHandler: null,

    /**
     * MediaSource, to allow JavaScript to generate media streams for playback
     * @type {MediaSource}
     */
    _mediaSource: null,

    /**
     * Save source buffer list in media souce
     * Fix for DASHJS-205: Playback ended abnormally
     * Save at local to avoid being cleared. Will still invesgate why.
     * @type {Array}
     */
    _sourceBuffers: null,

    /**
     * Player will resume when buffer length is greater than this variable
     * @type {Number}
     */
    _quickStartSecs: DEFAULT_QUICK_START_SECS,

    /**
     * Player will resume when buffer length is greater than this variable
     * @type {Number}
     */
    _resumeSecs: DEFAULT_RESUME_SECS,

    /**
     * Player will trigger rebuffer event when buffer length is less than this variable.
     * @type {Number}
     */
     _rebufferSecs: DEFAULT_REBUFFER_SECS,

    /**
     * The maximum seconds of buffered
     * @type {Number}
     */
    _maxBufferedSecs: DEFAULT_MAX_BUFFERED_SECS,

    /**
     * The number of milliseconds a segment request can take before receiving onload event.
     * @type {Number}
     */
    _xhrDoneTimeout: DEFAULT_XHR_DONE_TIMEOUT,

    /**
     * The number of milliseconds a segment request can take before receiving onprogress event.
     * @type {Number}
     */
    _xhrProgressTimeout: DEFAULT_XHR_PROGRESS_TIMEOUT,

    /**
     * The maximum retry time for requesting segment
     * @type {Number}
     * @constant
     * @private
     */
    _xhrRetryTime: DEFAULT_XHR_RETRY_TIME,

    /**
     * The maximum re-connect time
     * @type {Number}
     * @constant
     * @private
     */
    _streamRetryTime: DEFAULT_STREAM_RETRY_TIME,

    /**
     * The number of seconds till the end of range to detect the end of the segment.
     * @type {Number}
     */
     _rangeEndSecs: DEFAULT_RANGE_END_SECS,

    /**
     * Current type of video quality
     * @type {String}
     */
    _currentQualityType: null,

    /**
     * Current video quality
     * @type {VideoQuality}
     */
    _currentQuality: null,

    _retryTime: 0,

    _mpdUrl: null,

    /**
     * Save off the _mpdXhr incase we need to cancel it before it loads
     * @type {XMLHttpRequest}
     */
    _mpdXhr: null,

    log_prefix: "dash player",

    /**
     * Dash video player
     * @param  {HP.Interfaces.IMediaElement} MediaElement available MediaElement
     * @extends {HP.VideoPlayer.BaseVideoPlayer}
     * @constructs
     */
    constructor: function(mediaElement) {
      this._super(mediaElement);
    },

    /**
     * Load video by stream url
     * @param  {String} streamUrl video source
     * @param  {Object} options initialization configs {autoplayer, preload, startPosition}
     */
    load: function(streamUrl, options) {
      this.reset();
      if(/^(https?:\/\/)(\w|\/|\.)*(\.mpd)/.test(streamUrl)) {
        this._mpdUrl = streamUrl;
        this._createManifestXHR(options);
        this.setState(HP.VideoPlayer.State.LOADING);
      } else {
        this._super(streamUrl, options)
      }

    },

    _createManifestXHR: function(options, retryTime) {
      this._mpdXhr = new XMLHttpRequest();
      this._mpdXhr.options = options;
      this._mpdXhr.retryTime = retryTime || 0;
      this._mpdXhr.retryTimer = setTimeout(this._retryManifest.bind(this), this._xhrDoneTimeout);
      this._mpdXhr.addEventListener('load', this._onManifestLoad.bind(this));
      this._mpdXhr.addEventListener('error', this._retryManifest.bind(this));
      this._mpdXhr.open("GET", this._mpdUrl);
      this._mpdXhr.send();
    },

    _onManifestLoad: function() {
      clearTimeout(this._mpdXhr.retryTimer);
      this.loadByMpd(this._mpdXhr.responseText, this._mpdXhr.options);
      this._mpdXhr = null;
    },

    _retryManifest: function() {
      clearTimeout(this._mpdXhr.retryTimer);
      this._mpdXhr.abort();
      if(this._mpdXhr.retryTime >= this._xhrRetryTime) {
        this._mpdXhr = null;
        this.onError({type: HP.VideoPlayer.Error.MPD_LOAD_FAILURE});
      } else {
        this._createManifestXHR(this._mpdXhr.options, this._mpdXhr.retryTime + 1);
      }
    },

    /**
     * Initial configs
     * @param  {Object} options initialization configs
     * @param  {Boolean} [options.autoplay=false] Whether auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Number}  [options.quickStartSecs=DEFAULT_QUICK_START_SECS] Player will start playing when buffer length is greater than this variable
     * @param  {Number}  [options.resumeSecs=DEFAULT_RESUME_SECS] Player will resume when buffer length is greater than this variable
     * @param  {Number} [options.rebufferSecs=DEFAULT_REBUFFER_SECS] Player will trigger rebuffer event when buffer length is less than this variable.
     * @param  {Number}  [options.maxBufferedSecs=DEFAULT_MAX_BUFFERED_SECS] The maximum seconds of buffered
     * @param  {Number}  [options.xhrDoneTimeout=DEFAULT_XHR_DONE_TIMEOUT] The number of milliseconds a segment request can take before receiving onload event.
     * @param  {Number}  [options.xhrProgressTimeout=DEFAULT_XHR_PROGRESS_TIMEOUT] The number of milliseconds a segment request can take before receiving onprogress event.
     * @param  {Number}  [options.xhrRetryTime=DEFAULT_XHR_RETRY_TIME] The maximum retry time for requesting segment.
     * @param  {Number}  [options.streamRetryTime=DEFAULT_STREAM_RETRY_TIME] The maximum re-connect time
     * @param  {Number}  [options.rangeEndSecs=DEFAULT_RANGE_END_SECS] The number of seconds till the end of range to detect the end of the segment
     * @param  {HP.VideoPlayer.VideoQuality.QualityType}  [options.initQualityType=HP.VideoPlayer.VideoQuality.QualityType.AUTO] The initial quality type
     * @param  {Object}  [options.externalTimeoutChecker] Timeout check for different state. Need to sort as follow
     *                                                    @partial "./external_timeout_checker.jsdoc"
     * @protected
     */
    initConfigs: function(options) {
      this._super(options);

      this._quickStartSecs = options.quickStartSecs || DEFAULT_QUICK_START_SECS;
      this._resumeSecs = options.resumeSecs || DEFAULT_RESUME_SECS;
      this._rebufferSecs = options.rebufferSecs || DEFAULT_REBUFFER_SECS;
      this._maxBufferedSecs = options.maxBufferedSecs || DEFAULT_MAX_BUFFERED_SECS;
      this._xhrDoneTimeout = options.xhrDoneTimeout || DEFAULT_XHR_DONE_TIMEOUT;
      this._xhrProgressTimeout = options.xhrProgressTimeout || DEFAULT_XHR_PROGRESS_TIMEOUT;
      this._xhrRetryTime = options.xhrRetryTime || DEFAULT_XHR_RETRY_TIME;
      this._streamRetryTime = options.streamRetryTime || DEFAULT_STREAM_RETRY_TIME;
      this._rangeEndSecs = options.rangeEndSecs || DEFAULT_RANGE_END_SECS;
      this._currentQualityType = options.initQualityType || HP.VideoPlayer.VideoQuality.QualityType.AUTO;
      this._currentQuality = null;
      this._sourceBuffers = [];
      this._retryTime = 0;
      this._mpdUrl = null;

      this.playbackStartFired = false;
    },

    /**
     * Load video by mpd xml
     * @param  {String} mpdXML mpd xml text
     * @param  {Object} options initialization options<a name="loadByMpd.options"></a>
     * @param  {String} [options.licenseUrl] DRM License URL, required for encrypted content
     * @param  {String} [options.contentKey] DRM Content Key, required for encrypted content
     * @param  {String} [options.mpdXML] String blob of the MPD xml, must specify either mpdXML or mpd
     * @param  {Boolean} [options.autoplay=false] Whethe auto start the video once it's loaded
     * @param  {Boolean} [options.preload=false] Whether the player only loads video data but not starts to play
     * @param  {Number}  [options.startPosition=0] Start playing video from a given position
     * @param  {Number}  [options.quickStartSecs=DEFAULT_QUICK_START_SECS] Player will start playing when buffer length is greater than this variable
     * @param  {Number}  [options.resumeSecs=DEFAULT_RESUME_SECS] Player will resume when buffer length is greater than this variable
     * @param  {Number} [options.rebufferSecs=DEFAULT_REBUFFER_SECS] Player will trigger rebuffer event when buffer length is less than this variable.
     * @param  {Number}  [options.maxBufferedSecs=DEFAULT_MAX_BUFFERED_SECS] The maximum seconds of buffered
     * @param  {Number}  [options.xhrDoneTimeout=DEFAULT_XHR_DONE_TIMEOUT] The number of milliseconds a segment request can take before receiving onload event.
     * @param  {Number}  [options.xhrProgressTimeout=DEFAULT_XHR_PROGRESS_TIMEOUT] The number of milliseconds a segment request can take before receiving onprogress event.
     * @param  {Number}  [options.xhrRetryTime=DEFAULT_XHR_RETRY_TIME] The maximum retry time for requesting segment.
     * @param  {Number}  [options.streamRetryTime=DEFAULT_STREAM_RETRY_TIME] The maximum re-connect time
     * @param  {Number}  [options.rangeEndSecs=DEFAULT_RANGE_END_SECS] The number of seconds till the end of range to detect the end of the segment
     * @param  {Number}  [options.initBandwidth] The initial bandwidth
     * @param  {HP.VideoPlayer.VideoQuality.QualityType}  [options.initQualityType=HP.VideoPlayer.VideoQuality.QualityType.AUTO] The initial quality type
     * @param  {HP.VideoPlayer.MPD} [options.mpd] MPD object, must specify either mpdXML or mpd
     * @param  {HP.VideoPlayer.MBRHandler} [options.mbrHandler] Custom MBRHandler
     * @param  {HP.VideoPlayer.MetricsProvider} [options.metricsProvider] Custom MetricsProvider
     * @param  {Array}  [options.externalTimeoutChecker] <a name="externalTimeoutChecker"></a>
     *                                                   Timeout check for different state. Need to sort as follow
     *                                                   @partial "./external_timeout_checker.jsdoc"
     */
    loadByMpd: function(mpdXML, options) {
      options = options || {};

      this.initConfigs(options);

      this._licenseUrl = options.licenseUrl;
      this._contentKey = options.contentKey;
      this._mpdUrl = options.mpdUrl;
      this.httpUrl = null;

      try {
        this._mpd = options.mpd || new HP.VideoPlayer.MPD(mpdXML, options.mpdUrl || "");
      } catch(ex) {
        this.onError(ex);
        return;
      }

      if(options.mbrHandler) {
        this._mbrHandler = options.mbrHandler;
      } else {
        this._mbrHandler = new HP.VideoPlayer.MBRHandler();
        this._mbrHandler.addSwitchingRule(new HP.VideoPlayer.BandwidthSwitchingRule());
      }

      this._metrics = options.metricsProvider || new HP.VideoPlayer.MetricsProvider(this.mediaElement);
      this._metrics.init({initBandwidth: options.initBandwidth});
      this._metrics.on(HP.Events.MetricsProvider.METRICS_UPDATE, this._onMetricsUpdate, this);
      this._metrics.on(HP.Events.MetricsProvider.BANDWIDTH_OVER_ESTIMATED, this._onBandwidthOverEstimated, this);

      if (options.preload) {
        this.preload();
      } else {
        this.mediaElement.attach(this);
      }
    },

    /**
     * Preload video data and won't play
     */
    preload: function() {
      this._generateSourceBuffers();

      this.switchQuality(this._currentQualityType);

      if (this.progressTimer == -1) {
        this.progressTimer = window.setInterval(this._onPreload.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);
      }

      this.setState(HP.VideoPlayer.State.LOADING);
    },

    /**
     * Called when attach to the media element
     * @protected
     */
    onAttachMediaElement: function() {
      if(this.httpUrl) {
        this._super();
      } else {
        this.clearProgressTimer();

        this.firstBufferFull = false;
        this.autoSeekPending = this.getPosition() > 0 ? true : false;

        this._emeHandler = new HP.VideoPlayer.EMEHandler(this.mediaElement, this._licenseUrl, this._contentKey);
        this._emeHandler.on(HP.Events.EME.ERROR, this.onError, this);

        this._mediaSource = new MediaSource();

        HP.NativeEventHelper.bind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);

        this.mediaElement.addMediaSource(this._mediaSource);

        this.setState(HP.VideoPlayer.State.LOADING);
      }
    },

    /**
     * Called when detach from the media element
     * @protected
     */
    onDetachMediaElement: function() {
      if(this.httpUrl) {
        this._super();
      } else {
        this.clearProgressTimer();

        this._closeSource(RESET_REASONS.DETACH);

        if (this._emeHandler != null) {
          this._emeHandler.off(HP.Events.EME.ERROR, this.onError, this);
          this._emeHandler.dispose();
          this._emeHandler = null;
        }

        if (this._mediaSource != null) {
          HP.NativeEventHelper.unbind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);
          this._mediaSource = null;
        }
      }
    },

    /**
     * Init sourceBuffers and quality when HP.Events.MediaSource.SOURCE_OPEN
     */
    _onSourceOpen: function(event) {
      if (!this.isOwningElement()) return;

      this.clearProgressTimer();
      this.progressTimer = window.setInterval(this._onDashProgress.bind(this), HP.VideoPlayer.BaseVideoPlayer.PROGRESS_TIMER_INTERVAL);

      this._mediaSource.duration = this._mpd.getDuration();

      this._generateSourceBuffers();

      this.switchQuality(this._currentQualityType);

      //Just call once when mediaSource first changes state from closed to open. No need to call this when mediaSource changes state from ended to open.
      HP.NativeEventHelper.unbind(this._mediaSource, HP.Events.MediaSource.SOURCE_OPEN, this._onSourceOpen, this);
    },

    /**
     * Reset all source buffer when HP.Events.MediaElement.SEEKING
     */
    onSeeking: function() {
      this._super();
      if(this._mediaSource && this._mediaSource.sourceBuffers) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          this._resetSourceBuffer(this._mediaSource.sourceBuffers[i], RESET_REASONS.SEEK);
        }
      }
    },

    /**
     * Aborts the current segment of the given source buffer
     * @param  {SourceBuffer} buf source buffer
     * @param  {String} reason why to reset
     */
    _resetSourceBuffer: function(buf, reason) {
      HP.Logger.log('resetSourceBuffer for ' + reason);

      switch(reason) {
        case RESET_REASONS.DETACH:
        case RESET_REASONS.STOP:
          if (this._isSourceOpen()) {
            buf.abort();
          }
        case RESET_REASONS.SEEK:
          if (buf.xhr != null) {
            clearTimeout(buf.xhr.doneRetryTimer);
            clearTimeout(buf.xhr.progressRetryTimer);
            buf.xhr.abort();
            buf.xhr = null;
          }
          if (buf.mime.indexOf('video') >= 0) {
            this._metrics.resetBufferLength();
          }
          buf.queue = [];
          buf.segIdx = null;
        case RESET_REASONS.MBR:
        default:
          buf.lastInit = null;
          break;
      }
    },

    /**
     * Check buffer on each progress timer
     */
    _onDashProgress: function() {
      //Hack: sometimes html media element fails to fire the "ended" event when video is completed.
      //      Even the ended property on videotag is true and mediasource readystate is ended. This
      //      makes video player cannot ended correctly. So add a check here to fore the player end.
      if(HP.VideoPlayer.State.PLAYING == this.getState() && this.mediaElement.isEnded() && "ended" == this._mediaSource.readyState) {
        this.onEnded();
      }

      if (!this.isOwningElement() || HP.VideoPlayer.State.ENDED == this.getState() || !this._isSourceOpen()) {
        this.clearProgressTimer();
        return;
      }

      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      var ended = true;
      var ranges = new Array();
      for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
        var buf = this._mediaSource.sourceBuffers[i];
        var rep = buf.reps[buf.currentRep];

        if(!this._isRepReady(rep)) {
          return;
        }

        if (this._isSourceOpen() && buf.queue.length > 0) {
          if (buf.lastInit != rep.init) {
            this._appendInit(buf, rep.init);
          } else if (buf.appendBuffer && !buf.updating) {
            this._appendBuffer(buf, buf.queue.shift());
          }

          if (!buf.appendBuffer) {
            while(buf.queue.length > 0) {
              buf.append(new Uint8Array(buf.queue.shift()));
            }
          }
        }

        ended &= (rep.index && buf.segIdx >= rep.index.getCount());

        this._fetchNextFragment(buf);

        ranges.push(this._findRangeForPlaybackTime(buf.buffered, this.getPosition()/1000));

        if (buf.mime.indexOf('video') >= 0) {
            this._updateBufferLength(buf);
        }
      }

      this.checkTimeout();

      if (HP.VideoPlayer.State.SEEKING != this.getState()) {
        this._checkDashBuffer(ranges);
      }

      if(ended) {
        this._endOfStream(false);
      }
    },

    _onPreload: function() {
      if (this.getState() == HP.VideoPlayer.State.ERROR) {
        return;
      }

      for (var i = 0; i < this._sourceBuffers.length; i++) {
        var buf = this._sourceBuffers[i];

        if(!this._isRepReady(buf.reps[buf.currentRep])) {
          return;
        }

        this._fetchNextFragment(buf);
      }
    },

    _isRepReady: function(rep) {
      if(rep.error) {
        if(rep.error["http_status"] == 404) {
          buf.allQualities.splice(buf.currentRep, 1);
          buf.reps.splice(buf.currentRep, 1);
          if(buf.reps.length == 0) {
            this.onError(rep.error);
          } else if(buf.mime.indexOf('video') >= 0) {
            this.switchQuality(this._currentQualityType);
          }
        } else {
          this.onError(rep.error);
        }
        return false;
      }

      if(rep.init.value == null || rep.index == null) {
        return false;
      }

      return true;
    },

    /**
     * Fetch next fragment for the given source buffer
     * @param  {SourceBuffer} buf source buffer
     */
    _fetchNextFragment: function(buf) {
      if (buf.xhr) {
        return;
      }

      var rep = buf.reps[buf.currentRep];

      if(rep.index && buf.segIdx >= rep.index.getCount()) {
        return;
      }

      var append_time;
      if (!this._isSourceClosed()) {
        var time = this.getPosition() / 1000;
        var range = this._findRangeForPlaybackTime(buf.buffered, time);
        append_time = (range && range.end) || time;
        if (append_time > time + this._maxBufferedSecs) {
          return;
        }

        if(this._adaptQuality(buf)) {
          return;
        }

      } else {
        if (buf.queue.length >= 2) {
          return;
        }
        append_time = this.getPosition()/1000;
      }

      if (buf.segIdx == null) {
        buf.segIdx = Math.max(0, rep.index.findForTime(append_time));
      } else {
        if (range == null) {
          // If buf.segIdx is set, we're continuing to append data consecutively
          // from some previous point, as opposed to choosing a new location to
          // start appending from. The only reason a the playback head *should* be
          // outside of a buffered region is that we've seeked, which should have
          // triggered an append location change if the current head fell outside
          // of a buffered region (or in the future, if the current buffered region
          // has content from a different quality level - but we don't track that
          // yet or flush the buffer on quality change). It's normal to see this
          // message once or maybe even twice after a seek, since seeking near the
          // end of a high-bitrate segment may mean the first append didn't cover
          // the full time between segment start and current time, but seeing this
          // any more than that is a pretty big error.
          // Seeing this outside of a seek means something's lying, or we
          // underflowed and playback didn't stall.
          HP.Logger.log(this.log_prefix + ": Current playback head outside of buffer in append-continue state.");
        }
      }
      var offset = rep.index.getOffset(buf.segIdx);
      var size = rep.index.getByteLength(buf.segIdx);
      var xhr = this._createXHR(buf, rep.url, offset, offset + size - 1, rep.init);
    },

    /**
     * Create XMLHttpRequest
     * @param  {SourceBuffer} buf source buffer
     * @param  {String} url the url of request
     * @param  {Float64} start the offset of start
     * @param  {Float64} end th offest of end
     * @param  {Object}  initRef the init data of the given source buffer
     * @return {XMLHttpRequest} the created xhr
     */
    _createXHR: function(buf, url, start, end, initRef, retryTime) {
      if (url == null) {
        throw "Null URL";
      }

      var xhr = new XMLHttpRequest();
      xhr.open("GET", url);

      var range = this._createRange(start, end);
      if (range != null) {
        xhr.setRequestHeader('Range', range);
      }

      xhr.responseType = 'arraybuffer';
      xhr.startByte = start;
      xhr.endByte = end;
      xhr.buf = buf;
      xhr.init = initRef;
      xhr.url = url;
      xhr.startTime = (new Date()).getTime();
      xhr.retryTime = retryTime || 0;
      xhr.doneRetryTimer = setTimeout(this._retryXHR.bind(this, xhr),
        this._metrics.getAverageBandwidth() > 0 ?
        Math.max(2 * 8 * 1000 * (end - start) / this._metrics.getAverageBandwidth(), this._xhrDoneTimeout) :
        this._xhrDoneTimeout
      );
      xhr.progressRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), this._xhrProgressTimeout);
      xhr.isPreload = this._isSourceClosed();
      xhr.addEventListener('load', this._onXHRLoad.bind(this));
      xhr.addEventListener('progress', this._onXHRProgress.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      buf.xhr = xhr;

      xhr.send();

      return xhr;
    },

    /**
     * Create range for XMLHttpRequest's header
     * @param  {Float64} start the offset of start
     * @param  {Float64} end th offest of end
     * @return {String} the created range
     */
    _createRange:function (start, end) {
      if (start != null && end != null) {
        return 'bytes=' + start + '-' + end;
      }
      return null;
    },

    /**
     * Handle data when load event
     * @param  {XMLHttpRequest.Event} evt the event
     */
    _onXHRLoad: function(evt) {
      var xhr = evt.target;
      clearTimeout(xhr.doneRetryTimer);
      clearTimeout(xhr.progressRetryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var buf = xhr.buf;
      buf.xhr = null;

      var endTime = (new Date()).getTime();
      var ellapsedTime = endTime - xhr.startTime;
      if (xhr.startTime != null && endTime >= xhr.startTime) {
        //ellapsedTime = Math.max((ellapsedTime - 150), Math.min(50, ellapsedTime));
        //var bandwidth = 8 * 1000 * (new Uint8Array(xhr.response)).length / ellapsedTime; // use xhr.response.byteLength?
        this._metrics.updateBandwidth(xhr.response.byteLength, (endTime - xhr.startTime) / 1000, buf.mime.indexOf('audio') < 0);
      }

      if (buf.lastInit !== xhr.init) {
        this._appendInit(buf, xhr.init);
      }

      this._queueAppend(buf, xhr.response, xhr.isPreload);
      buf.segIdx++;
    },

    _onXHRProgress: function(evt) {
      var xhr = evt.target;

      if (xhr.readyState == xhr.LOADING) {
        clearTimeout(xhr.progressRetryTimer);
        xhr.progressRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), this._xhrProgressTimeout);
      }
    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.doneRetryTimer);
      clearTimeout(xhr.progressRetryTimer);

      var status = "";

      try {
        // xhr.status might throw exception if it's not completed
        status = xhr.status;
      } catch (ex) {
      }
      xhr.abort();

      this._forceSwitchQualityDownHalf(xhr.buf);

      if(this._adaptQuality(xhr.buf)) {
        var buf = xhr.buf;
        buf.xhr = null;
        return;
      }

      if(xhr.retryTime >= this._xhrRetryTime) {
        if(status == 404) {
          var buf = xhr.buf;
          buf.allQualities.splice(buf.currentRep, 1);
          buf.reps.splice(buf.currentRep, 1);
          if(buf.reps.length == 0) {
            this.onError({type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1});
          } else if(buf.mime.indexOf('video') >= 0) {
            this.switchQuality(this._currentQualityType);
          }
        } else {
          this.onError({type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1});
        }
      } else {
        this._createXHR(xhr.buf, xhr.url, xhr.startByte, xhr.endByte, xhr.init, xhr.retryTime + 1);
      }
    },

    /**
     * Append init data to source buffer
     * @param  {SourceBUffer} buf the given source buffer
     * @param  {Uint8Array} init the initdata
     */
    _appendInit: function(buf, init) {
      if (!this._isSourceClosed()) {
        buf.timestampOffset = -buf.reps[buf.currentRep].index.getStartTime(0);
        this._queueAppend(buf, init.value);
        buf.lastInit = init;
      }
    },

    /**
     * Append data to the queue of the given source buffer
     * @param  {SourceBuffer} buf the given source buffer
     * @param  {ArrayBuffer} val data to be appended
     * @param  {Boolean} isPreload Indicate whether the data is requested for preload
     */
    _queueAppend: function(buf, val, isPreload) {
      if (!isPreload) {
        if (buf.updating) {
          buf.queue.push(val);
        } else if (buf.appendBuffer) {
          this._appendBuffer(buf, val);
        } else {
          buf.append(new Uint8Array(val));
          this._updateBufferLength(buf);
        }
      } else {
        buf.queue.push(val);
      }
    },

    _appendBuffer: function(buf, val) {
      for(var attempts = 0; attempts < 2; attempts++) {
        try {
          buf.appendBuffer(val);
          break;
        } catch (ex) {
          //The video tag of IE browsers has met invalid state error when appending data to source buffers.
          //Still not know why this happens and in order to not break the preload logic, we can only retry appending one time for it.
          HP.Logger.warn('InvalidState error when appending data to source buffers');
        }
      }
      if(attempts == 2) {
        this.onError({type: HP.VideoPlayer.Error.MEDIA_TIMEOUT_ERROR});
      }
    },

    _generateSourceBuffers: function() {
      if (!this._isSourceClosed()) {
        //MediaSource changes state from ended to open when replaying
        if (this._mediaSource.sourceBuffers.length) {
          this._sourceBuffers = [];
          for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
            var buf = this._mediaSource.sourceBuffers[i];
            this._sourceBuffers.push(buf);
          }
          return;
        } else if(this._sourceBuffers.length) {
        //Have preloaded data when MediaSource changes state to open
          for (var i = 0; i < this._sourceBuffers.length; i++) {
            var oldBuf = this._sourceBuffers[i];
            var buf = this._mediaSource.addSourceBuffer(oldBuf.mime + '; codecs="' + oldBuf.codecs + '"');

            buf = HP.Utils.extend(buf, {
              reps: oldBuf.reps,
              currentRep: oldBuf.currentRep,
              mime: oldBuf.mime,
              codecs: oldBuf.codecs,
              queue: oldBuf.queue,
              segIdx: oldBuf.segIdx,
              lastInit: oldBuf.lastInit,
              allQualities: oldBuf.allQualities,
              availableQualities: oldBuf.availableQualities
            });

            if (oldBuf.xhr != null) {
              buf.xhr = oldBuf.xhr;
              buf.xhr.buf = buf;
            }

            if (buf.appendBuffer) {
              buf.addEventListener('updateend', this._onBufferUpdateEnd.bind(this, buf));
            }

            this._sourceBuffers[i] = buf;
          }
          return;
        }
      }

      this._sourceBuffers = [];
      var adaptationSets = this._mpd.getAdaptationSets();
      for (var i = 0; i < adaptationSets.length; i++) {
        var aset = adaptationSets[i];
        var reps = aset.representations.slice(0);
        var mime = aset.mimeType;
        var codecs = aset.codecs;
        var allQualities = this._generateQualities(reps);

        var buf = {};

        if (this._isSourceOpen()) {
          buf = this._mediaSource.addSourceBuffer(mime + '; codecs="' + codecs + '"');
        }

        buf = HP.Utils.extend(buf, {
          reps: reps,
          currentRep: mime.indexOf('video') >= 0 ? -1 : 0,
          mime: mime,
          codecs: codecs,
          queue: [],
          segIdx: null,
          lastInit: null,
          allQualities: allQualities
        });

        if (buf.appendBuffer) {
          buf.addEventListener('updateend', this._onBufferUpdateEnd.bind(this, buf));
        }

        this._sourceBuffers.push(buf);
      }
    },

    _generateQualities: function(reps) {
      var qualities = [];
      for (var index = 0; index < reps.length; index++) {
        var rep = reps[index];
        var videoQuality = new HP.VideoPlayer.VideoQuality({
          bitRate: Math.round(rep.bandwidth / 1024),
          height: rep.height
        });
        qualities.push(videoQuality);
      }
      return qualities;
    },

    /**
     * Adapt quality of source buffer
     * @param  {SourceBuffer} buf the target source buffer
     * @return {Boolean} if the quality is actually changed
     */
    _adaptQuality: function(buf) {
      if(buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 0) {
        var adaptQuality;
        if(buf.availableQualities.length > 1) {
          adaptQuality = this._mbrHandler.adaptCurrentQuality(this._metrics, buf.availableQualities);
        } else {
          adaptQuality = buf.availableQualities[0];
        }
        var adaptQualityIndex = buf.allQualities.indexOf(adaptQuality);
        if(adaptQualityIndex != buf.currentRep && adaptQualityIndex != -1) {
          this._resetSourceBuffer(buf, RESET_REASONS.MBR);
          buf.currentRep = adaptQualityIndex;
          this._currentQuality = adaptQuality;
          this.trigger(HP.Events.VideoPlayer.QUALITY_CHANGED, adaptQuality, this._currentQualityType == HP.VideoPlayer.VideoQuality.QualityType.AUTO ? this._mbrHandler.getReason() : 'user manually changes to ' + this._currentQualityType);
          HP.Logger.log(this.log_prefix + ' switch quality to ' + this._currentQuality.getBitRate());
          return true;
        }
      }
      return false;
    },

    /**
     * Switch video quality
     * @param  {string} qualityType 'low, medium, high, HD, auto'
     */
    switchQuality: function(qualityType) {
      var currentQualitiesTypes = this._mpd.getAvailableQualitiesTypes();
      if(currentQualitiesTypes.length == 0) {
        return;
      }
      //open mbr as default.
      if(!HP.VideoPlayer.VideoQuality.isValidQualityType(qualityType)) {
        qualityType = HP.VideoPlayer.VideoQuality.QualityType.AUTO;
      }
      //if user prefer quality is not available, select the nearest higher quality.
      if (qualityType != HP.VideoPlayer.VideoQuality.QualityType.AUTO && currentQualitiesTypes.indexOf(qualityType) < 0) {
        var priorities = [
          HP.VideoPlayer.VideoQuality.QualityType.LOW,
          HP.VideoPlayer.VideoQuality.QualityType.MEDIUM,
          HP.VideoPlayer.VideoQuality.QualityType.HIGH,
          HP.VideoPlayer.VideoQuality.QualityType.HD];
        var targetQualityPriority = priorities.indexOf(qualityType);
        for (var i = 0; i < currentQualitiesTypes.length; ++i) {
          if (priorities.indexOf(currentQualitiesTypes[i]) > targetQualityPriority) {
            qualityType = currentQualitiesTypes[i];
            break;
          }
        }
        if (i == currentQualitiesTypes.length) {
          qualityType = currentQualitiesTypes[currentQualitiesTypes.length - 1];
        }
      }

      this._currentQualityType = qualityType;
      for (i = 0; i < this._sourceBuffers.length; i++) {
        var buf = this._sourceBuffers[i];
        if (buf.mime.indexOf('video') >= 0) {
          if(qualityType == HP.VideoPlayer.VideoQuality.QualityType.AUTO) {
            buf.availableQualities = buf.allQualities;
          } else {
            var availableQualities = [];
            for(var j = 0; j < buf.allQualities.length; j++) {
              if(buf.allQualities[j].getType() == qualityType) {
                availableQualities.push(buf.allQualities[j]);
              }
            }
            buf.availableQualities = availableQualities;
          }
          this._adaptQuality(buf);
        }
      }
    },

    /**
     * Returns current video quality
     * @return {string} current video quality
     */
    getCurentQuality: function() {
      return this._currentQuality;
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {
      this._closeSource(RESET_REASONS.STOP);
      this._super();
    },

    reset: function() {
      this._quickStartSecs = DEFAULT_QUICK_START_SECS;
      this._resumeSecs = DEFAULT_RESUME_SECS;
      this._rebufferSecs = DEFAULT_REBUFFER_SECS;
      this._maxBufferedSecs = DEFAULT_MAX_BUFFERED_SECS;
      this._xhrDoneTimeout = DEFAULT_XHR_DONE_TIMEOUT;
      this._xhrProgressTimeout = DEFAULT_XHR_PROGRESS_TIMEOUT;
      this._xhrRetryTime = DEFAULT_XHR_RETRY_TIME;
      this._streamRetryTime = DEFAULT_STREAM_RETRY_TIME;
      this._rangeEndSecs = DEFAULT_RANGE_END_SECS;
      this._licenseUrl = null;
      this._contentKey = null;
      this._retryTime = 0;
      this._mpdUrl = null;
      if (this._mpdXhr != null) {
        this._mpdXhr.abort();
        this._mpdXhr = null;
      }
      this._super();
    },

    _isSourceOpen: function() {
      return this._mediaSource && this._mediaSource.readyState == 'open';
    },

    _isSourceClosed: function() {
      return this._mediaSource == null || this._mediaSource.readyState == 'closed';
    },

    _closeSource: function(reason) {
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          this._resetSourceBuffer(this._mediaSource.sourceBuffers[i], reason);
        }
      }
      this._endOfStream(true);
    },

    _onMetricsUpdate: function(params) {
      this.trigger(HP.Events.VideoPlayer.METRICS_UPDATE, params);
    },

    _onBandwidthOverEstimated: function() {
      this._switchVideoQualityDown();
    },

    onError: function(event) {
      //In ad state, the content player will preload, but is not owning the media element. So we should not reload and trigger error event in this case.
      if(this.isOwningElement()) {
        if(this._retryTime < this._streamRetryTime) {
          this._retryTime++;
          this.trigger(HP.Events.VideoPlayer.RECONNECTING);
          this._sourceBuffers = [];
          this.mediaElement.detach(this);
          this.mediaElement.attach(this);
          this.play();
          return;
        }
        this._super(event);
      }
    },

    /**
     * Define the particular actions when HP.Events.MediaElement.TIME_UPDATE
     * @fires HP.Events.VideoPlayer.TIME_UPDATE
     * @protected
     */
    onTimeUpdate: function() {
      if (this.getState() == HP.VideoPlayer.State.PLAYING) {
        this._retryTime = 0;
      }
      this._super();
    },

    /**
     * Find the range of the given source buffer for a given playback time
     * @param  {TimeRanges} timeRanges buffered time ranges
     * @param  {Number} time the given playback time
     * @return {Object} range if the playback time is in one of the ranges of the given source buffer
     */
    _findRangeForPlaybackTime: function(timeRanges, time) {
      for (var i = 0; i < timeRanges.length; i++) {
        if (timeRanges.start(i) <= time && timeRanges.end(i) >= time) {
          return {start: timeRanges.start(i), end: timeRanges.end(i)};
        }
      }
    },

    /**
     * Check whether the buffer is enough to play
     * @param  {TimeRanges} ranges available time ranges
     */
    _checkDashBuffer: function(ranges) {
      var notEnoughBuffered = false;

      if(!ranges || ranges.length == 0) {
        notEnoughBuffered = true;
      }

      for(var i = 0; i < ranges.length && !notEnoughBuffered; i++) {
        var range = ranges[i];
        if (!range) {
          notEnoughBuffered = true;
        } else if (Math.abs(this.getDuration()/1000 - range.end) < this._rangeEndSecs) {
          continue;
        } else if (!this.firstBufferFull) {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._quickStartSecs);
        } else if (this.isRebuffering) {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._resumeSecs);
        } else {
          notEnoughBuffered |= (range.end < this.getPosition()/1000 + this._rebufferSecs);
        }
      }

      //For MediaKeys browser, seek in onLoadedMetadata event will cause exception. So move it to onCanPlayThrough
      if (window.MediaKeys && !notEnoughBuffered && this.autoSeekPending) {
        this._autoSeeking();
        return;
      }

      if (this.mediaElement.isPaused()) {
        if (this.autoPaused) {
          if (!notEnoughBuffered) {
            HP.Logger.log(this.log_prefix + ' checkDashBuffer COMMAND: mediaElement.play()');
            this.mediaElement.play();
          }
        }
      } else {
        if (notEnoughBuffered) {
          this.autoPausePending = true;
          HP.Logger.log(this.log_prefix + ' checkDashBuffer COMMAND: mediaElement.pause()');
          this.mediaElement.pause();
        }
      }

      this.hasEnoughBuffer = !notEnoughBuffered;
    },

    /**
     * Retures current video stream source
     * @return {String} current video stream source
     */
    getCurrentSource: function() {
      if(this.httpUrl) {
        return this.httpUrl;
      } else {
        return this._mpdUrl;
      }
    },

    _forceSwitchQualityDown: function(buf) {
      var adaptQuality;
      if (buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 1) {
        for (var i = 0; i < buf.availableQualities.length; i++) {
          if(buf.availableQualities[i].getBitRate() < this._currentQuality.getBitRate()) {
            adaptQuality = buf.availableQualities[i];
            continue;
          }
          break;
        }
      }

      if(adaptQuality) {
        this._metrics.resetBandwidth(adaptQuality.getSafeBandwidth());
      }
    },

    _forceSwitchQualityDownHalf: function(buf) {
      var adaptQuality;
      if (buf.mime.indexOf('video') >= 0 && buf.availableQualities && buf.availableQualities.length > 1) {
        for (var i = 0; i < buf.availableQualities.length; i++) {
          if(buf.availableQualities[i].getBitRate() < this._currentQuality.getBitRate() * 0.5) {
            adaptQuality = buf.availableQualities[i];
            continue;
          }
          break;
        }
        if (i == 0 && this._currentQuality.getBitRate() != buf.availableQualities[0].getBitRate()) {
            adaptQuality = buf.availableQualities[0];
        }
      }

      if(adaptQuality) {
        this._metrics.resetBandwidth(adaptQuality.getSafeBandwidth());
      }
    },

    _switchVideoQualityDown: function() {
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          if(this._mediaSource.sourceBuffers[i].mime.indexOf('video') >= 0) {
            this._forceSwitchQualityDown(this._mediaSource.sourceBuffers[i]);
            break;
          }
        }
      }
    },

    onRebufferStart: function() {
      this._switchVideoQualityDown();
    },

    _endOfStream: function(force) {
      if(this._isSourceOpen()) {
        var updating = false;

        if(!force) {
          for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
            if(this._mediaSource.sourceBuffers[i].updating) {
              updating = true;
              break;
            }
          }
        }

        if(!updating) {
          this._mediaSource.endOfStream();
        }
      }
    },

    _updateBufferLength: function(buf) {
      if(buf.mime.indexOf('video') >= 0) {
        try {
          var time = this.getPosition() / 1000;
          var range = this._findRangeForPlaybackTime(buf.buffered, time);
          var append_time = (range && range.end) || time;
          this._metrics.updateBufferLength(append_time - time);
        } catch (ex) {
          HP.Logger.warn('InvalidState error when finding buffered data');
        }
      }
    },

    _onBufferUpdateEnd: function(buf) {
      this._updateBufferLength(buf);
      if (buf.queue.length) {
        this._appendBuffer(buf, buf.queue.shift());
      }
    },

    getRebufferParams: function(isRebuffering) {
      var time = this.getPosition() / 1000;
      var params = {
        'event': isRebuffering ? 'start' : 'end',
        'position': time
      };
      if (this._mediaSource && this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length > 0) {
        for (var i = 0; i < this._mediaSource.sourceBuffers.length; i++) {
          var range = this._findRangeForPlaybackTime(this._mediaSource.sourceBuffers[i].buffered, time);
          var append_time = (range && range.end) || time;
          if(this._mediaSource.sourceBuffers[i].mime.indexOf('video') >= 0) {
            params['video_append_time'] = append_time;
          } else {
            params['audio_append_time'] = append_time;
          }
        }
      }

      if(this._currentQuality) {
        params['current_quality_type'] = this._currentQualityType;
        params['current_quality_bitrate'] = this._currentQuality.getBitRate();
        params['current_quality_safe_bandwidth'] = this._currentQuality.getSafeBandwidth();
      }

      params['current_avg_bandwidth'] = this._metrics.getAverageBandwidth();

      return params;
    }
  }).implement(HP.Interfaces.IDashVideoPlayer)
}).call(this);
(function() {
  /**
   * The retry time of a xhr request.
   * @type {Number}
   * @constant
   * @private
   */
  var XHR_MAX_RETRY_TIME = 1;

  /**
   * The number of milliseconds a request can take before automatically being terminated.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_TIMEOUT = 20000;

  function hex2a(ss) {
    var l = [];
    for (var i=0; i<=ss.length-1; i+=2) {
      l.push(parseInt("0x"+ss.substring(i,i+2)));
    }
    return new Uint8Array(l);
  };
  HP.VideoPlayer.EMEHandler = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.EMEHandler.prototype */
  {
    /**
     * Map from key to system
     * @type {Object}
     * @private
     */
    _keyToSystem: {
      'widevine': ['com.widevine.alpha'],
      'playready': ['com.youtube.playready', 'com.microsoft.playready'],
      'clearkey': ['webkit-org.w3.clearkey', 'org.w3.clearkey']
    },

    /**
     * Init data queue
     * @type {Array}
     * @private
     */
    _initDataQueue: [],

    /**
     * The current key
     * @type {String}
     * @private
     */
    _key: null,

    /**
     * The current key system
     * @type {String}
     * @private
     */
    _keySystem: null,

    /**
     * The current license server url
     * @type {String}
     * @private
     */
    _licenseServerURL: null,

    /**
     * The content key For clearkey DRM
     * @type {String}
     * @private
     */
    _contentKey: null,

    /**
     * The current mime type
     * @type {String}
     * @private
     */
    _mimeType: null,

    /**
     * Available MediaElement for playing
     * @type {HP.Interfaces.MediaElement}
     * @private
     */
    _mediaElement: null,

    /**
     * Whether it already has key (or send key request) in current session
     * @type {Boolean}
     * @private
     */
    _hasKey: false,

    /**
     * The active media key session
     * @type {MediaKeySession}
     * @private
     */
    _mediaKeySession: null,

    /**
     * EME Handler, to control playback of protected content
     * @param  {HP.Interfaces.IMediaElement} mediaElement available MediaElement
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(mediaElement, licenseUrl, contentKey) {
      this._mediaElement = mediaElement;
      this._licenseServerURL = licenseUrl;
      this._contentKey = contentKey

      this._init();
    },

    /**
     * Dispose the handler
     */
    dispose: function() {
      if(this._mediaKeySession) {
        HP.NativeEventHelper.unbind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage, this);
        HP.NativeEventHelper.unbind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError, this);
        this._mediaKeySession.close();
        this._mediaKeySession = null;
      }

      this._mediaElement.off(HP.Events.MediaElement.NEED_KEY, this._onNeedKey, this);
      this._mediaElement.off(HP.Events.MediaElement.KEY_MESSAGE, this._onKeyMessage, this);
      this._mediaElement.off(HP.Events.MediaElement.KEY_ERROR, this._onKeyError, this);
      this._mediaElement = null;
      this._hasKey = false;
    },

    /**
     * Init key system
     * @param  {String} mimeType the mime type of video
     */
    _init: function() {
      this._mediaElement.initForEME();

      this._mediaElement.on(HP.Events.MediaElement.NEED_KEY, this._onNeedKey, this);
      this._mediaElement.on(HP.Events.MediaElement.KEY_MESSAGE, this._onKeyMessage, this);
      this._mediaElement.on(HP.Events.MediaElement.KEY_ERROR, this._onKeyError, this);

      this._selectKeySystem('video/mp4');
    },

    /**
     * Selected ky system
     * @param  {String} mimeType the mime type of video
     */
    _selectKeySystem: function(mimeType) {
      for (var key in this._keyToSystem) {
        var systems = this._keyToSystem[key];
        if (!systems) {
          continue;
        }

        for (var i in systems) {
          if (window.MediaKeys && MediaKeys.isTypeSupported) {
            if(!MediaKeys.isTypeSupported(systems[i], mimeType)) {
              continue;
            }
          } else if (!this._mediaElement.canPlayType(mimeType, systems[i])) {
            continue;
          }
          this._key = key;
          this._keySystem = systems[i];
          this._mimeType = mimeType;
          return;
        }
      }
      this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_UNSUPPORTED_ERROR, 'keySystem': this._keySystem});
    },

    _extractBMFFClearKeyID: function(initData) {
      // Accessing the Uint8Array's underlying ArrayBuffer is impossible, so we
      // copy it to a new one for parsing.
      var abuf = new ArrayBuffer(initData.length);
      var view = new Uint8Array(abuf);
      view.set(initData);

      var dv = new DataView(abuf);
      var pos = 0;
      while (pos < abuf.byteLength) {
        var box_size = dv.getUint32(pos, false);
        var type = dv.getUint32(pos + 4, false);

        if (type != 0x70737368) {
          HP.Logger.log('Box type ' + type.toString(16) + ' not equal to "pssh"');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        // Scan for Clear Key header
        if ((dv.getUint32(pos + 12, false) == 0x58147ec8) &&
            (dv.getUint32(pos + 16, false) == 0x04234659) &&
            (dv.getUint32(pos + 20, false) == 0x92e6f52c) &&
            (dv.getUint32(pos + 24, false) == 0x5ce8c3cc)) {
          var size = dv.getUint32(pos + 28, false);
          if (size != 16) {
            HP.Logger.log('Unexpected KID size ' + size);

            this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
          }
          return new Uint8Array(abuf.slice(pos + 32, pos + 32 + size));
        }

        // Failing that, scan for Widevine protobuf header
        if ((dv.getUint32(pos + 12, false) == 0xedef8ba9) &&
            (dv.getUint32(pos + 16, false) == 0x79d64ace) &&
            (dv.getUint32(pos + 20, false) == 0xa3c827dc) &&
            (dv.getUint32(pos + 24, false) == 0xd51d21ed)) {
          return new Uint8Array(abuf.slice(pos + 36, pos + 52));
        }
        pos += box_size;
      }
      // Couldn't find it, give up hope.
      return initData;
    },

    /**
     * Handle data when HP.Events.MediaElement.NEED_KEY
     * @param  {Event} event
     */
    _onNeedKey: function(event) {
      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.NEED_KEY + ' - ' + this._keySystem);

      if (!this._keySystem) {
        this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_UNSUPPORTED_ERROR, 'keySystem': this._keySystem});
      }
      if (event['initData'].length == 16) {
        HP.Logger.log('Dropping non-BMFF needKey event');
        return;
      }
      // We only need process the first need key event in one session. And since the EmeHandler is re-created
      // for every session, so we can use this instance field as condition check
      if (this._hasKey) {
        return;
      }
      this._hasKey = true;
      var initData = event['initData'];
      if (this._isClearKey()) {
        initData = this._extractBMFFClearKeyID(event['initData']);
      }
      if (window.MediaKeys) {
        if (!this._mediaElement.getMediaKeys()) {
          try {
            this._mediaElement.setMediaKeys(new MediaKeys(this._keySystem));
          } catch (e) {
          }
        }
        this._mediaKeySession = this._mediaElement.getMediaKeys().createSession(this._mimeType, initData);
        HP.NativeEventHelper.bind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage, this);
        HP.NativeEventHelper.bind(this._mediaKeySession, HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError, this);
      } else {
        this._mediaElement.generateKeyRequest(this._keySystem, initData);
      }
      this._initDataQueue.push(initData);
    },

    /**
     * Handle data when HP.Events.MediaElement.KEY_MESSAGE
     * @param  {Event} event
     */
    _onKeyMessage: function(event) {
      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.KEY_MESSAGE);

      var initData = this._initDataQueue.shift();
      var session = event['sessionId'] || event.target;
      if (this._isClearKey()) {
        var license = hex2a(this._contentKey);
        if (window.MediaKeys) {
          session.update(license);
        } else {
          this._mediaElement.addKey(this._keySystem, license, initData, session);
        }
      } else if (this._isPlayReady()) {
        if (window.MediaKeys)
          var keyMessage = String.fromCharCode.apply(null, new Uint16Array(event.message.buffer));
        else
          var keyMessage = String.fromCharCode.apply(null, event.message);
        var keyMessageXML = new DOMParser().parseFromString(keyMessage, "application/xml");

        var challenge;
        if (keyMessageXML.getElementsByTagName("Challenge")[0]) {
          var nodeValue = keyMessageXML.getElementsByTagName("Challenge")[0].childNodes[0];
          if (window.MediaKeys) {
            challenge = atob(nodeValue.nodeValue);
          } else {
            challenge = keyMessage;
          }
        } else {
          HP.Logger.log('Can not find <Challenge> in key message');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        var headerNames = keyMessageXML.getElementsByTagName("name");
        var headerValues = keyMessageXML.getElementsByTagName("value");
        if (headerNames.length !== headerValues.length) {
          HP.Logger.log('Mismatched header <name>/<value> pair in key message');

          this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_MESSAGE_ERROR, 'keySystem': this._keySystem});
        }

        this._createXHR(initData, session, {headerNames: headerNames, headerValues: headerValues, challenge: challenge});
      } else {
        this._createXHR(initData, session, event['message']);
      }
    },

    _createXHR: function(initData, session, data, retryTime) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", this._licenseServerURL);
      xhr.responseType = 'arraybuffer';
      xhr.initData = initData;
      xhr.session = session;
      xhr.data = data;
      xhr.startTime = (new Date()).getTime();
      xhr.retryTime = retryTime || 0;
      xhr.retryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_TIMEOUT);

      xhr.addEventListener('load', this._onXHRLoad.bind(this, initData, session));
      xhr.addEventListener('progress', this._onXHRProgress.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      if (this._isPlayReady()) {
        for (var i = 0; i < data.headerNames.length; i++) {
          xhr.setRequestHeader(data.headerNames[i].childNodes[0].nodeValue, data.headerValues[i].childNodes[0].nodeValue);
        }

        xhr.send(data.challenge);
      } else {
        xhr.send(data);
      }
    },

    /**
     * Handle data when HP.Events.MediaElement.KEY_ERROR
     * @param  {Event} event
     */
    _onKeyError: function(event) {
      if(event['currentTarget'] && event['currentTarget']['error']) {
        var keySystem = event['currentTarget']['keySystem'];
        var error = event['currentTarget']['error'];
        var systemCode = event['currentTarget']['error']['systemCode'];
      } else {
        var keySystem = event['keySystem'];
        var error = event['errorCode'];
        var systemCode = event['systemCode'];
      }

      HP.Logger.log('eme EVENT: ' + HP.Events.MediaElement.KEY_ERROR + ' - ' + keySystem + ', ' + error.code + ', ' + systemCode);

      var params = {'keySystem': keySystem, 'systemCode': systemCode};
      switch(error.code) {
        case error['MEDIA_KEYERR_UNKNOWN']:
        case error['MS_MEDIA_KEYERR_UNKNOWN']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_UNKNOWN_ERROR;
          break;
        case error['MEDIA_KEYERR_CLIENT']:
        case error['MS_MEDIA_KEYERR_CLIENT']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_CLIENT_ERROR;
          break;
        case error['MEDIA_KEYERR_SERVICE']:
        case error['MS_MEDIA_KEYERR_SERVICE']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_SERVICE_ERROR;
          break;
        case error['MEDIA_KEYERR_OUTPUT']:
        case error['MS_MEDIA_KEYERR_OUTPUT']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_OUTPUT_ERROR;
          break;
        case error['MEDIA_KEYERR_HARDWARECHANGE']:
        case error['MS_MEDIA_KEYERR_HARDWARECHANGE']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_HARDWARECHANGE_ERROR;
          break;
        case error['MEDIA_KEYERR_DOMAIN']:
        case error['MS_MEDIA_KEYERR_DOMAIN']:
          params.type = HP.VideoPlayer.Error.MEDIA_KEY_DOMAIN_ERROR;
          break;
      }
      this.trigger(HP.Events.EME.ERROR, params);
    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.retryTimer);

      var statusCode = xhr.status ? (xhr.status + ' ') : '';
      if(xhr && xhr['response']) {
        var response = this._arrayToString(new Uint8Array(xhr['response'])).match(/status\scode\s[\w]*/);
        if (response != null && response.length > 0) {
          statusCode = statusCode + response[0];
        }
      }

      xhr.abort();

      if(xhr.retryTime >= XHR_MAX_RETRY_TIME) {
        this.trigger(HP.Events.EME.ERROR, {type: HP.VideoPlayer.Error.MEDIA_KEY_REQUEST_ERROR, 'statusCode': statusCode, 'attempt': xhr.retryTime + 1});
      } else {
        this._createXHR(xhr.initData, xhr.session, xhr.data, xhr.retryTime + 1);
      }
    },

    /**
     * Handle data when load event
     * @param  {Event} event
     */
    _onXHRLoad: function(initData, session, event) {
      var xhr = event.target;
      clearTimeout(xhr.retryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var license = new Uint8Array(event.target['response']);

      if (window.MediaKeys) {
        session.update(license);
      } else if(this._mediaElement){
        this._mediaElement.addKey(this._keySystem, license, initData, session);
      }
    },

    _onXHRProgress: function(event) {
      var xhr = event.target;

      if (xhr.readyState == xhr.LOADING) {
        clearTimeout(xhr.retryTimer);
        xhr.retryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_TIMEOUT);
      }
    },

    /**
     * Convert Uint8Array to String
     * @param  {Uint8Array} a the source Uint8Array
     * @return {String} the converted String
     */
    _arrayToString: function(a) {
      return String.fromCharCode.apply(String, a);
    },

    _isClearKey: function() {
      return this._key == "clearkey";
    },

    _isPlayReady: function() {
      return this._key == "playready";
    }
  })
}).call(this);
(function() {
  HP.VideoPlayer.MBRHandler = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.MBRHandler.prototype */
  {
    /**
     * Switching rRules to adapt quality
     * @type {Array}
     */
    _switchingRules: null,

    _reason: '',

    /**
     * MBR Handler
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
      this._switchingRules = [];
    },

    /**
     * Add one or multiple switching rules which are used when adaptive switching quality.
     * @param  {SwitchingRule} switchingRule the switchingRule which is used by the MbrHandler
     */
    addSwitchingRule: function(switchingRule) {
      this._switchingRules.push(switchingRule);
    },

    /**
     * Clear all switching rules.
     */
    clearSwitchingRule: function() {
      this._switchingRules = [];
    },

    /**
     * Returns the selected quality from a given quality array under all switching rules and metrics.
     * @param  {MetricsProvider} metrics the metrics which contains all the data we need to select quality
     * @param  {Array} qualities an array of all the available quaities
     * @Return {VideoQuality} the selected quality
     */
    adaptCurrentQuality: function(metrics, qualities) {
      var newQuality = this._switchingRules[0].getNewQuality(metrics, qualities);
      var newBitRate = newQuality.getBitRate();
      this._reason = this._switchingRules[0].getReason();
      for (var i = 1; i < this._switchingRules.length; i++) {
          var selectedQuality = this._switchingRules[i].getNewQuality(metrics, qualities);
          var selectedBitRate = selectedQuality.getBitRate();
          if (selectedBitRate < newBitRate) {
              newQuality = selectedQuality;
              newBitRate = selectedBitRate;
              this._reason = this._switchingRules[i].getReason();
          } 
      }
      return newQuality;
    },

    /**
     * Returns the reason why we change to the lastest quality
     * @return {String} the reason why we change to the lastest quality
     */
    getReason: function() {
      return this._reason;
    }
  }).implement(HP.Interfaces.IMBRHandler)
}).call(this);
(function() {
  HP.VideoPlayer.MediaElement = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MediaElement.prototype */
  {
    /**
     * Html video tag
     * @type {HTMLVideoElement}
     */
    _videoTag: null,

    /**
     * The owner of this MediaElement
     * @type {HP.VideoPlayer.BaseVideoPlayer}
     */
    _owner: null,

    _initializedForEME: false,

    /**
     * Video media element
     * @param  {HTMLVideoElement} videoTag html video tag
     * @extends {HP.HP.Events.EventDispatcher}
     * @constructs
     */
    constructor: function(videoTag) {
      this._videoTag = videoTag;
      this._owner = null;

      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.SEEKING, this._onSeeking.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.SEEKED, this._onSeeked.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.PAUSE, this._onPause.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.PLAYING, this._onPlaying.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.TIME_UPDATE, this._onTimeUpdate.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.ERROR, this._onError.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.ENDED, this._onEnded.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.CAN_PLAY, this._onCanPlay.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.CAN_PLAY_THROUGH, this._onCanPlayThrough.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.LOAD_START, this._onLoadStart.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.STALLED, this._onStalled.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.MOZ_FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_FULL_SCREEN_CHANGE, this._onFullscreenChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_BEGIN_FULL_SCREEN, this._onBeginFullscreen.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.WEBKIT_END_FULL_SCREEN, this._onEndFullscreen.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.VOLUME_CHANGE, this._onVolumeChange.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.DURATION_CHANGE, this._onDurationChanged.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.LOADED_METADATA, this._onLoadedMetadata.bind(this));
    },

    /**
     * Attach this MediaElement to a given VideoPlayer
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    attach: function(owner) {
      if(this._owner == owner) {
        return;
      }
      this.detach(this._owner);
      this._owner = owner;
      this._owner.onAttachMediaElement();
    },

    /**
     * Detach this MediaElement from its owner
     * @param  {BaseVideoPlayer} owner the owner of this MediaElement
     */
    detach: function(owner) {
      if(this._owner == null || this._owner != owner) {
        return;
      }
      this._owner.onDetachMediaElement();
      this._owner = null;
      // TODO: How to notify owner it's attached?
    },

    /**
     * Get current owner
     * @return {BaseVideoPlayer} current owner
     */
    getOwner: function() {
      return this._owner;
    },

    /**
     * Attach MediaSource to the html video tag
     * @param  {MediaSource} mediaSource MediaSource to be attached
     */
    addMediaSource: function(mediaSource) {
      mediaSource.attachTo(this._videoTag);
    },

    /**
     * Reset MediaElement to original state
     */
    reset: function() {

    },

    /**
     * Play video from current time
     */
    play: function() {
      HP.Logger.log('mediaElement play COMMAND: videoTag.play()');
      this._videoTag.play();
    },

    /**
     * Pause video at current time
     */
    pause: function() {
      HP.Logger.log('mediaElement pause COMMAND: videoTag.pause()');
      this._videoTag.pause();
    },

    /**
     * Seek video to a given position
     * @param  {Number} position the target seek position in millisecond
     */
    seek: function(position) {
      position /= 1000;
      if(Math.abs(this._videoTag.currentTime - position) < 1 || isNaN(this._videoTag.duration)) {
        return;
      }
      this._videoTag.currentTime = position;
    },

    /**
     * Stop player and do all the clean up work
     */
    stop: function() {

    },

      /**
     * Mute player
     */
    mute: function() {
      this._videoTag.muted = true;
    },

    /**
     * Unmute player
     */
    unmute: function() {
      this._videoTag.muted = false;
    },

    /**
     * Get whether it's muted
     * @return {Boolean} Return true if it's muted
     */
    getMuted: function() {
      return this._videoTag.muted;
    },

    /**
     * Get current position of video
     * @return {Int} current position of video in millisecond
     */
    getPosition: function() {
      return parseInt(this._videoTag.currentTime * 1000);
    },

    /**
     * Get current duration of video
     * @return {Int} current duration of video  in millisecond
     */
    getDuration: function(){
      return parseInt(this._videoTag.duration * 1000);
    },

    /**
     * Get current volume of video
     * @return {Number} current volume of video
     */
    getVolume: function() {
      return this._videoTag.volume;
    },

    /**
     * Set current volume of video to a target value
     * @param  {Number} volume target volume
     */
    setVolume: function(volume) {
      this._videoTag.volume = volume;
    },

    trigger: function(event, data) {
      this._super(event, data);
      if (this._owner) {
        this._owner.onMediaElementEvent(event, data);
      }
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.PAUSE
     * @fires HP.Events.MediaElement.PAUSE
     */
    _onPause: function() {
      this.trigger(HP.Events.MediaElement.PAUSE);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.PLAY
     * @fires HP.Events.MediaElement.PLAY
     */
    _onPlaying: function() {
      this.trigger(HP.Events.MediaElement.PLAYING);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.SEEKING
     * @fires HP.Events.MediaElement.SEEKING
     */
    _onSeeking: function() {
      this.trigger(HP.Events.MediaElement.SEEKING);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.SEEKED
     * @fires HP.Events.MediaElement.SEEKED
     */
    _onSeeked: function() {
      this.trigger(HP.Events.MediaElement.SEEKED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.TIME_UPDATE
     * @fires HP.Events.MediaElement.TIME_UPDATE
     */
    _onTimeUpdate: function(event) {
      this.trigger(HP.Events.MediaElement.TIME_UPDATE, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.ERROR
     * @fires HP.Events.MediaElement.ERROR
     */
    _onError: function(event) {
      this.trigger(HP.Events.MediaElement.ERROR, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.ENDED
     * @fires HP.Events.MediaElement.ENDED
     */
    _onEnded: function() {
      this.trigger(HP.Events.MediaElement.ENDED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.CAN_PLAY
     * @fires HP.Events.MediaElement.CAN_PLAY
     */
    _onCanPlay: function() {
      this.trigger(HP.Events.MediaElement.CAN_PLAY);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.CAN_PLAY_THROUGH
     * @fires HP.Events.MediaElement.CAN_PLAY_THROUGH
     */
    _onCanPlayThrough: function() {
      this.trigger(HP.Events.MediaElement.CAN_PLAY_THROUGH);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.LOAD_START
     * @fires HP.Events.MediaElement.LOAD_START
     */
    _onLoadStart: function() {
      this.trigger(HP.Events.MediaElement.LOAD_START);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.STALLED
     * @fires HP.Events.MediaElement.STALLED
     */
    _onStalled: function() {
      this.trigger(HP.Events.MediaElement.STALLED);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.FULL_SCREEN_CHANGE
     * @fires HP.Events.MediaElement.FULL_SCREEN_CHANGE
     */
    _onFullscreenChange: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.WEBKIT_BIGIN_FULL_SCREEN
     * @fires HP.Events.MediaElement.WEBKIT_BIGIN_FULL_SCREEN
     */
    _onBeginFullscreen: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE, {isFullscreen: true});
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.WEBKIT_END_FULL_SCREEN
     * @fires HP.Events.MediaElement.WEBKIT_END_FULL_SCREEN
     */
    _onEndFullscreen: function() {
      this.trigger(HP.Events.MediaElement.FULL_SCREEN_CHANGE, {isFullscreen: false});
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.VOLUME_CHANGE
     * @fires HP.Events.MediaElement.VOLUME_CHANGE
     */
    _onVolumeChange: function() {
      this.trigger(HP.Events.MediaElement.VOLUME_CHANGE);
    },

    /**
     * Init media element for EME
     * @return {String} the prefix of current browser(webkit..)
     */
    initForEME: function() {
      if (this._initializedForEME) return;

      this._initializedForEME = true;

      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.NEED_KEY, this._onNeedKey.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.KEY_MESSAGE, this._onKeyMessage.bind(this));
      this._videoTag.addEventListener(HP.Events.HtmlMediaElement.KEY_ERROR, this._onKeyError.bind(this));
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.NEED_KEY
     * @param  {Event} event
     * @fires HP.Events.MediaElement.NEED_KEY
     */
    _onNeedKey: function(event) {
      this.trigger(HP.Events.MediaElement.NEED_KEY, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.KEY_MESSAGE
     * @param  {Event} event
     * @fires HP.Events.MediaElement.KEY_MESSAGE
     */
    _onKeyMessage: function(event) {
      this.trigger(HP.Events.MediaElement.KEY_MESSAGE, event);
    },

    /**
     * Define the particular actions when HP.Events.HtmlMediaElement.KEY_ERROR
     * @param  {Event} event
     * @fires HP.Events.MediaElement.KEY_ERROR
     */
    _onKeyError: function(event) {
      this.trigger(HP.Events.MediaElement.KEY_ERROR, event);
    },

    _onDurationChanged: function(event) {
      this.trigger(HP.Events.MediaElement.DURATION_CHANGE, event);
    },

    _onLoadedMetadata: function(event) {
      this.trigger(HP.Events.MediaElement.LOADED_METADATA, event);
    },

    /**
     * Consider whether the player can play this type of video
     * @param  {String} type the video type
     * @param  {String} keySystem key systeam for the EME
     * @return {Boolean} True it can play
     */
    canPlayType: function(type, keySystem) {
      return this._videoTag.canPlayType(type, keySystem);
    },

    /**
     * Get the MediaKeys
     * @return {MediaKeys} the MediaKeys
     */
    getMediaKeys: function() {
      if(window.MSMediaKeys) {
        return this._videoTag.msKeys;
      } else {
        return this._videoTag.keys;
      }
    },

    /**
     * Set the MediaKeys
     * @param  {MediaKeys} mediaKeys the MediaKeys
     */
    setMediaKeys: function(mediaKeys) {
      this._videoTag.setMediaKeys(mediaKeys);
    },

    /**
     * Generate MediaKey request
     * @param  {String} keySystem the key system
     * @param  {ArrayBuffer} initData the init data
     */
    generateKeyRequest: function(keySystem, initData) {
      this._videoTag.generateKeyRequest(keySystem, initData);
    },

    /**
     * Add key to player
     * @param  {String} keySystem the key system
     * @param  {String} license the license
     * @param  {ArrayBuffer} initData the init data
     * @param  {MediaKeySession} session the MediaKeySession
     */
    addKey: function(keySystem, license, initData, session) {
      this._videoTag.addKey(keySystem, license, initData, session);
    },

    /**
     * Load video
     * @param  {String} src video source
     */
    load: function(src) {
      HP.Logger.log('mediaElement load COMMAND: videoTag.load() - ' + src);
      this._videoTag.src = src;
      this._videoTag.load();
    },

    /**
     * Indicate whether the player has been paused
     * @return {Boolean} whether the player has been paused
     */
    isPaused: function() {
      return this._videoTag.paused;
    },

    /**
     * Indicate whether the video meets the end.
     * @return {Boolean}
     */
    isEnded: function() {
      return this._videoTag.ended && (this._videoTag.duration - this._videoTag.currentTime < 0.001);
    },

    /**
     * Indicate whether the video is seeking.
     * @return {Boolean}
     */
    isSeeking: function() {
      return this._videoTag.seeking;
    },

    /**
     * Returns a value that expresses the current state of the element with respect to rendering the current playback position
     * @return {Number} a value that expresses the current state of the element with respect to rendering the current playback position
     */
    getReadyState: function() {
      return this._videoTag.readyState;
    }
  }).implement(HP.Interfaces.IMediaElement)
}).call(this);
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
(function() {
  /**
   * The size of the recent bandwidths array
   * @type {int}
   * @constant
   * @private
   */
  var BANDWIDTH_SAMPLE_SIZE = 10;

  HP.VideoPlayer.MetricsProvider = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MetricsProvider.prototype */
  {
    /**
     * Available MediaElement for player
     * @type {HP.Interfaces.IMediaElement}
     */
    _mediaElement: null,

    /**
     * Store recent bandwidths
     * @type {Array}
     */
    _historyBandwidths: [],

    /**
     * The max bandwidth in history
     * @type {Number}
     */
    _maxBandwidth: 0,

    /**
     * The average bandwidth in history
     * @type {Number}
     */
    _averageBandwidth: 0,

    /**
     * The current buffer length
     * @type {Number}
     */
    _currentBufferLength: 0,

    /**
     * Store the latest 20 fragements byte length and loading time to calculate the bandwidth and RTT.
     * @type {Array}
     */
    _fragmentsLoadTime: [],
    
    /**
     * Estimated RTT value.
     * @type {Number}
     */
    _RTT: 0,

    /**
     * Indicate if the bandwidth is over estimated in the last few fragments.
     * @type {Number}
     */
    _overEstimatedTimes: 0,

    /**
     * Metrics provider
     * @param  {HP.Interfaces.IMediaElement} MediaElement available MediaElement
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(MediaElement) {
      this._mediaElement = MediaElement;
    },

    /**
     * Init properties
     * @param  {Object} params some configs fot properties
     */
    init: function(params) {
      params = params || {};

      this._currentBufferLength = 0;
      this._historyBandwidths = [];
      this._maxBandwidth = 0;
      this._averageBandwidth = 0;
      this._RTT = 0;
      this._overEstimatedTimes = 0;

      if(params.initBandwidth) {
        var initBandwidth = parseInt(params.initBandwidth);
        this._historyBandwidths.push(initBandwidth);
        this._maxBandwidth = initBandwidth;
        this._averageBandwidth = initBandwidth;
      }
    },

    /**
     * This is an internal method.
     * Update bandwidth according to data.
     * @param  {Number} byteLength Fragment byte length
     * @param  {Number} time Fragment download time
     * @param  {Boolean} isVideo Indicate whether the fragment is video fragment
     */
    updateBandwidth: function(byteLength, time, isVideo) {
      // check if the bandwidht is over estimated;
      if (this._averageBandwidth > 0 && this._RTT > 0) {
        var predictTime = this._RTT + byteLength * 8 / this._averageBandwidth;
        var isAbnormal = false;
        if (isVideo) {
          if (time >= 5) { // load time is too long, the bandwidth should be over estimated
            this._overEstimatedTimes += ((time > 7 || this._currentBufferLength <= 10) ? 2 : 1);
            isAbnormal = true;
          } else if(time >= 4 && (time - predictTime)/time > 0.2) { // load time is much longer than predict one, bandwidth could be over estimated
            this._overEstimatedTimes += 1;
            isAbnormal  = true;
          } else {
            this._overEstimatedTimes = Math.max(this._overEstimatedTimes - 1, 0);
          }
        }
      }
      //bandwidth is over estimated, switch down
      if (this._overEstimatedTimes >= 2) {
        this._overEstimatedTimes  = 0;
        this.trigger(HP.Events.MetricsProvider.BANDWIDTH_OVER_ESTIMATED);
        return;
      }
      // if byte length is too short, or the fragment is cached, ignore the fragment.
      if (byteLength > 40000 && time > this._RTT && !isAbnormal) {
        this._fragmentsLoadTime.push([byteLength, time]);
      }
      // if there are enough fragments, then calculate the bandwidth and RTT by linear regression
      // time = RTT + fragmentByteLength/bandwidht;
      var fragmentsNumber = this._fragmentsLoadTime.length;
      if(fragmentsNumber >= 20) {
        var sumX = 0;
        var sumY = 0;
        var corXY = 0;
        var squaX = 0;
        for (var i = 0; i < fragmentsNumber; i++) {
          sumX += this._fragmentsLoadTime[i][0];
          sumY += this._fragmentsLoadTime[i][1];
          corXY += this._fragmentsLoadTime[i][0] * this._fragmentsLoadTime[i][1];
          squaX += this._fragmentsLoadTime[i][0] * this._fragmentsLoadTime[i][0];
        }
        var bandwidth = (fragmentsNumber * squaX - sumX * sumX) / (fragmentsNumber * corXY - sumX * sumY);
        this._RTT = (sumY - sumX / bandwidth) / fragmentsNumber;
        this._averageBandwidth = 8 * bandwidth;
        this._maxBandwidth = Math.max(this._maxBandwidth, this._averageBandwidth);
        this._historyBandwidths.unshift(this._averageBandwidth);
        if(this._historyBandwidths.length > BANDWIDTH_SAMPLE_SIZE) {
          this._historyBandwidths.pop();
        }
        this._fragmentsLoadTime.shift();
        this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
      }
    },

    /**
     * Reset bandwidth to a given value or 0
     * @param  {data} data the data which is used to reset bandwidth
     */
    resetBandwidth: function(data) {
      if(data) {
        var currentBandwidth = parseInt(data);
        this._historyBandwidths = [currentBandwidth];
        this._maxBandwidth = currentBandwidth;
        this._averageBandwidth = currentBandwidth;
      } else {
        this._historyBandwidths = [];
        this._maxBandwidth = 0;
        this._averageBandwidth = 0;
      }
      this._fragmentsLoadTime = [];
      this._RTT = 0;
      this._overEstimatedTimes = 0;
      this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
    * This is an internal method.
    * Update buffer length according to data.
    * @param  {Number} bufferLength the current buffer length
    */
    updateBufferLength: function(data) {
     this._currentBufferLength = parseInt(data);
     this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
     * Reset buffer length
     */
    resetBufferLength: function() {
      this._currentBufferLength = 0;
      this.trigger(HP.Events.MetricsProvider.METRICS_UPDATE, this._getAllMetrics());
    },

    /**
     * Returns the max bandwidth.
     * @Return {Number} the max bandwidth.
     */
    getMaxBandwidth: function(){
      return this._maxBandwidth;
    },

    /**
     * Returns the avg bandwidth.
     * @Return {Number} the avg bandwidth.
     */
    getAverageBandwidth: function() {
      return this._averageBandwidth;
    },

    /**
     * Returns the current buffer length.
     * @Return {Number} the current buffer length.
     */
    getCurrentBufferLength: function() {
      return this._currentBufferLength;
    },

    getRTT:function() {
      return this._RTT;
    },

    _getAllMetrics: function() {
      return {
        historyBandwidths: this._historyBandwidths,
        maxBandwidth: this._maxBandwidth,
        averageBandwidth: this._averageBandwidth,
        currentBufferLength: this._currentBufferLength
      };
    }
  })
}).call(this);








(function() {
  var PLAY_TIMEOUT = 200;

  HP.VideoPlayer.MobileVideoPlayer = HP.VideoPlayer.BaseVideoPlayer.extend(
  /** @lends HP.VideoPlayer.MobileVideoPlayer.prototype */
  {
    _checkStartPosition: false,
    _firstZeroTimeUpdate: false,
    _checkPlayingTimer: -1,

  	constructor: function(mediaElement) {
      this._super(mediaElement);
      try {
        this.mediaElement.play();
        this.mediaElement.pause();
      } catch (e) {
      }
    },

    onTimeUpdate: function() {
      //Resume video from non-fullscreen to fullscreen will fire a timeupdate event with the position 0, and we should also consider the case that user seeks to 0.
      if(HP.Utils.isFullscreen() && HP.Utils.Mobile.isIOS() && HP.Utils.Mobile.isPhone() && HP.Utils.Mobile.getIOSVersion() >= 7 && this.mediaElement.getPosition() == 0 && this._firstZeroTimeUpdate) {
        this._checkStartPosition = true;
        this._firstZeroTimeUpdate = false;
      }

      //Checku two cases:
      //1. Resume video from non-fullscreen to fullscreen on IOS 7
      //2. Resume video after ad break on IOS
      if(this._checkStartPosition && Math.abs(this.mediaElement.getPosition() - this.getPosition()) > 1000) {
        if(this.getState() != HP.VideoPlayer.State.LOADING) {
          this.seek(this.getPosition());
        }
        return;
      }

      this._checkStartPosition = false;

      if(this.getState() == HP.VideoPlayer.State.SEEKING && !this.mediaElement.isPaused()) {
        this.onSeeked();
      }

      // 1. When player source is chagned, it will fire a timeupdate event with the position 0 and duration NaN, we should ignore this event
      // 2. When player exits fullscreen on IOS, it will fire a timeupdate event with the position 0 and the player is paused.
      if (isNaN(this.mediaElement.getDuration()) || this.getState() == HP.VideoPlayer.State.SEEKING || this.autoSeekPending || this.mediaElement.isPaused()) {
        return;
      }
      this._hasTimeUpdate = true;
      this._position = this.mediaElement.getPosition();
      this.trigger(HP.Events.VideoPlayer.TIME_UPDATE, {position: this.getPosition(), duration: this.getDuration()});
    },

    onFullscreenChange: function(params) {
      this._super();
      if(params) {
        if(params.isFullscreen && HP.Utils.Mobile.isPhone() && HP.Utils.Mobile.isIOS() && this.playbackStartFired) {
          //Need handle the first time update 0 when resuming video into fullscreen
          this._firstZeroTimeUpdate = true;
          this.play();
        } else if(!params.isFullscreen && HP.Utils.Mobile.isIOS() && !this.playbackStartFired && window.Hulu && window.Hulu.videoPlayerApp && window.Hulu.videoPlayerApp.hideAndStop) {
          //Exit fullscreen when loading on IOS will let player into a strange state and hard to recover it.
          Hulu.videoPlayerApp.hideAndStop();
        }
      }
    },

    _onHttpProgress: function() {
      if (!this.isOwningElement() || HP.VideoPlayer.State.ENDED == this.getState()) {
        this.clearProgressTimer();
        return;
      }

      //For fullscreeen native player on IOS
      if(HP.Utils.isFullscreen() && HP.Utils.Mobile.isIOS() && this.getState() == HP.VideoPlayer.State.PLAYING) {
        return;
      }

      this._super();
    },

    play: function(start) {
      this._super();
      this._checkPlayingTimer = window.setTimeout(this._checkPlaying.bind(this), PLAY_TIMEOUT);
    },

    _checkPlaying: function() {
      if (this.getState() != HP.VideoPlayer.State.PLAYING) {
        this.play();
      }
    },

    onCanPlay: function() {
      this._super();
      this._autoSeeking();
      this.play();
    },

    onCanPlayThrough: function() {
      this._super();
      this._autoSeeking();
      this.play();
    },

    stop: function() {
      window.clearTimeout(this._checkPlayingTimer);
      this._checkPlayingTimer = -1;
      this._super();
    },

    onAttachMediaElement: function() {
      this._super();
      //True if resume video from last position
      this._checkStartPosition = this.autoSeekPending;
    },

    /**
     * Set current state of this VideoPlayer
     * @param {string} current state
     */
    setState: function(state) {
      if(this._state != state) {
        HP.Logger.log(this.log_prefix + ' state changed from ' + this._state + ' to ' + state);

        this._state = state;
        this._resetTimeoutChecker();
        HP.Utils.NewSite.videoStateChange(state.replace("HP.VideoPlayer.State.", "").toLowerCase());
      }
    },

    onLoadedMetadata: function() {
       HP.Logger.log(this.log_prefix + ' EVENT: ' + HP.Events.MediaElement.LOADED_METADATA);
       this.play();
    },

    onEnded: function() {
      if(!this.mediaElement.isEnded()) {
        return;
      }
      this._super();
    },

    onError: function(event) {
      window.clearTimeout(this._checkPlayingTimer);
      this._checkPlayingTimer = -1;
      this._super(event);
    }
  })
}).call(this);
(function() {
  /**
   * The retry time of a xhr request.
   * @type {Number}
   * @constant
   * @private
   */
  var XHR_MAX_RETRY_TIME = 2;

  /**
   * The number of milliseconds a request can take before automatically being terminated.
   * @type {Number}
   * @constant
   * @private
   */
  var DEFAULT_XHR_DONE_TIMEOUT = 10000;

  HP.VideoPlayer.MPD = HP.Events.EventDispatcher.extend(
  /** @lends HP.VideoPlayer.MPD.prototype */
  {
    /**
     * the main manifest
     * @type {Object}
     */
    _manifest: null,

    /**
     * MPD
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function(text, url) {
      this._manifest = this._parseDASHManifest(text, url);

      this._duration = this._manifest.periods[0].duration || this._manifest.mediaPresentationDuration;

      this._adaptationSets = [];
      this._availableQualitiesTypes = [];
      for (var i = 0; i < this._manifest.periods[0].adaptationSets.length; i++) {
        var aset = this._manifest.periods[0].adaptationSets[i];
        var mimeType = aset.representations[0].mimeType || aset.mimeType;
        var reps = aset.representations.map(this._normalizeRepresentation.bind(this));
        reps.sort(function(a,b){return a.bandwidth - b.bandwidth});
        this._adaptationSets.push({
          representations: reps,
          mimeType: mimeType,
          codecs: aset.representations[0].codecs || aset.codecs,
          contentProtection: aset.contentProtection
        });

        if(mimeType.indexOf('video') >= 0){
          var allQualities = [];
          for (var j = 0; j < reps.length; j++) {
            var rep = reps[j];
            allQualities.push(Math.round(reps[j].height));
          }
          allQualities.sort(function(a,b){return a-b});

          for (var j = 0; j < allQualities.length; j++) {
            var qualityType = HP.VideoPlayer.VideoQuality.getQualityType(allQualities[j]);
            if(this._availableQualitiesTypes.indexOf(qualityType) == -1) {
              this._availableQualitiesTypes.push(qualityType);
            }
          }
        }
      }
    },

    /**
     * Get duration of video
     * @return {Number} duration of video
     */
    getDuration: function() {
      return this._duration;
    },

    /**
     * Get all adaptation sets
     * @return {Array} all adaptation sets
     */
    getAdaptationSets: function() {
      return this._adaptationSets;
    },

    /**
     * Get all available video qualities
     * @return {Array} all available video qualities
     */
    getAvailableQualitiesTypes: function() {
      return this._availableQualitiesTypes;
    },

    _normalizeRepresentation: function(repSrc) {
      var rep = {
        url: this._absolutizeURL(this._manifest.manifestURL, repSrc.baseURLs[0]),
        bandwidth: repSrc.bandwidth,
        duration: this._duration,
        height: repSrc.height
      };
      var init = null;
      var index = null;
      if (repSrc.segmentBase != null) {
        var segSrc = repSrc.segmentBase;
        init = segSrc.initialization;
        if (segSrc.indexRange != null) {
          index = segSrc.indexRange;
        }
      }
      rep.indexRange = {
        start: index.start,
        end: index.end,
      };
      rep.init = {
        start: init.start,
        end: init.end,
        value: null
      };

      this._createXHR(rep, rep.init.start, rep.init.end, true, false);

      return rep;
    },

    _createRange:function (start, end) {
      if (start != null && end != null) {
        return 'bytes=' + start + '-' + end;
      }
      return null;
    },

    _createXHR: function(rep, start, end, isInit, isIndex, retryTime) {
      if (rep.url == null) {
        throw "Null URL";
      }

      var xhr = new XMLHttpRequest();
      xhr.open("GET", rep.url);

      var range = this._createRange(start, end);
      if (range != null) {
        xhr.setRequestHeader('Range', range);
      }

      xhr.responseType = 'arraybuffer';
      xhr.rep = rep;
      xhr.startByte = start;
      xhr.endByte = end;
      xhr.isInit = isInit;
      xhr.isIndex = isIndex;
      xhr.retryTime = retryTime || 0;
      xhr.doneRetryTimer = setTimeout(this._retryXHR.bind(this, xhr), DEFAULT_XHR_DONE_TIMEOUT);

      xhr.addEventListener('load', this._onXHRLoad.bind(this));
      xhr.addEventListener('error', this._retryXHR.bind(this, xhr));

      xhr.send();
    },

    _onXHRLoad: function(evt) {
      var xhr = evt.target;

      clearTimeout(xhr.doneRetryTimer);

      if (xhr.readyState != xhr.DONE || xhr.status >= 300) {
        this._retryXHR(xhr);
        return;
      }

      var rep = xhr.rep;

      if(xhr.isInit) {
        rep.init.value = new Uint8Array(xhr.response);
        this._createXHR(rep, rep.indexRange.start, rep.indexRange.end, false, true);
      } else if(xhr.isIndex) {
        rep.index = new HP.VideoPlayer.DashSegmentIndex();
        rep.index.parseSidx(xhr.response, rep.indexRange.start);
      }

    },

    _retryXHR: function(xhr) {
      clearTimeout(xhr.doneRetryTimer);

      var status = "";

      try {
        // xhr.status might throw exception if it's not completed
        status = xhr.status;
      } catch (ex) {
      }
      xhr.abort();

      if(xhr.retryTime >= XHR_MAX_RETRY_TIME) {
        xhr.rep.error = {type: HP.VideoPlayer.Error.DASH_STREAM_ERROR, "http_status": status, 'attempt': xhr.retryTime + 1};
      } else {
        this._createXHR(xhr.rep, xhr.startByte, xhr.endByte, xhr.isInit, xhr.isIndex, xhr.retryTime + 1);
      }
    },

    _absolutizeURL: function(base, target) {
      if (/^(https?:\/\/)/.test(target)) {
        return target;
      }
      var rel_url;
      if (target[0] == '/') {
        rel_url = base.match(/^[a-z]*:\/\/[^\/]*/)[0];
      } else {
        rel_url = base.replace(/\/[^\/]*$/, '/');
      }
      return rel_url + target;
    },

    _id: function(x) {
      return x;
    },

    _parseDuration: function(durStr) {
      // Unsupported: date part of ISO 8601 durations
      var re = /PT(([0-9]*)H)?(([0-9]*)M)?(([0-9.]*)S)?/;
      var match = re.exec(durStr);
      if (!match) return parseFloat(durStr);
      return (parseFloat(match[2] || 0) * 3600 +
              parseFloat(match[4] || 0) * 60 +
              parseFloat(match[6] || 0));
    },

    _parseChildElements: function(nodeName, parseFunc, xml, required) {
      var result = [];
      if (xml != null) {
        for (var child = xml.firstElementChild; child != null; child = child.nextElementSibling) {
          if (child.nodeName == nodeName) {
            result.push(parseFunc.call(this, child));
          }
        }
      }
      if (result.length == 0 && required) {
        throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'childElement', name: nodeName};
      }
      return result;
    },

    _parseChildElement: function(nodeName, parseFunc, xml, required) {
      return this._parseChildElements(nodeName, parseFunc, xml, required)[0] || null;
    },

    _parseAttributes: function(attrMap, xml, result) {
      result = result || {};
      for (var k in attrMap) {
        if(attrMap[k].attr && attrMap[k].parseFunc) {
          if (xml.attributes.getNamedItem(attrMap[k].attr) != null) {
            result[k] = attrMap[k].parseFunc(xml.attributes[attrMap[k].attr].value);
          }
        } else {
          if (xml.attributes.getNamedItem(k) != null)
            result[k] = attrMap[k](xml.attributes[k].value);
        }
        if (result[k] == undefined && attrMap[k].required) {
          throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'attribute', name: attrMap[k].attr};
        }
      }
      return result;
    },

    _parseFrameRate: function(str) {
      var match = /([0-9]+)(\/([0-9]+))?/.exec(str);
      if (!match) return 1;
      if (!match[3]) return parseFloat(match[1]);
      return parseFloat(match[1]) / (parseFloat(match[3]) || 1);
    },

    _parseByteRange: function(str) {
      var match = /([0-9]+)-([0-9]+)/.exec(str);
      if (!match) return null;
      var start = parseInt(match[1]), end = parseInt(match[2]);
      return { start: start, end: end, length: end - start + 1 };
    },

    _parseSegmentURL: function(xml) {
      return this._parseAttributes({
          media: {attr: 'media', parseFunc: this._id},
          mediaRange: {attr: 'mediaRange', parseFunc: this._parseByteRange},
          index: {attr: 'index', parseFunc: this._id},
          indexRange: {attr: 'indexRange', parseFunc: this._parseByteRange}
        }, xml);
    },

    _parseBaseURL: function(xml) {
      if (xml.textContent && xml.textContent != '') {
        return xml.textContent;
      }
      throw {type: HP.VideoPlayer.Error.MPD_FORMAT_ERROR, subType: 'childElement', name: 'baseUrl'};
    },

    _parseInitialization: function(xml) {
      // MP4 specific
      return this._parseByteRange(xml.attributes['range'].value);
    },

    _parseSegmentBase: function(xml) {
      // Unsupported: @indexRangeExact, RepresentationIndex, SegmentTimeline, BitstreamSwitching
      var result = this._parseAttributes({
          timescale: {attr: 'timescale', parseFunc: parseInt},
          duration: {attr: 'duration', parseFunc: parseInt},
          indexRange: {attr: 'indexRange', parseFunc: this._parseByteRange, required: true},
          presentationTimeOffset: {attr: 'presentationTimeOffset', parseFunc: parseInt},
          startNumber: {attr: 'startNumber', parseFunc: parseInt}
        }, xml);
      result.initialization = this._parseChildElement('Initialization', this._parseInitialization, xml, true);
      return result;
    },

    _parseSegmentList: function(xml) {
      // Unsupported: @xlinks, @actuate, SegmentTimeline, BitstreamSwiching
      var result = this._parseSegmentBase(xml);
      if (result.timescale && result.duration) {
        result.durationSeconds = result.duration / result.timescale;
      } else {
        result.durationSeconds = result.duration;
      }
      result.segmentURLs = this._parseChildElements('SegmentURL', parseSegmentURL, xml);
      return result;
    },

    _parseContentProtection: function(node) {
      var schemeUri = node.attributes['schemeIdUri'];
      if (!schemeUri) {
        // Unsupported scheme, ignore.
        return null;
      }
      return {};
    },

    _parseRepresentationBase: function(xml, requiredMap) {
      // Unsupported: @sar, @segmentProfiles, @maximumSAPPeriod, @startWithSAP,
      // @maxPlayoutRate, @codingDependency, @scanType, FramePacking,
      // AudioChannelConfiguration, ContentProtection, SegmentBase
      requiredMap = requiredMap || [];
      var result = this._parseAttributes({
          id: {attr: 'id', parseFunc: parseInt},
          profiles: {attr: 'profiles', parseFunc: this._id},
          width: {attr: 'width', parseFunc: parseInt},
          height: {attr: 'height', parseFunc: parseInt},
          frameRate: {attr: 'frameRate', parseFunc: this._parseFrameRate},
          audioSamplingRate: {attr: 'audioSamplingRate', parseFunc: parseInt},
          mimeType: {attr: 'mimeType', parseFunc: this._id, required: requiredMap.indexOf('mimeType') != -1},
          codecs: {attr: 'codecs', parseFunc: this._id, required: requiredMap.indexOf('codecs') != -1}
        }, xml);
      result.baseURLs = this._parseChildElements('BaseURL', this._parseBaseURL, xml, requiredMap.indexOf('baseURLs') != -1);
      result.segmentBase = this._parseChildElement('SegmentBase', this._parseSegmentBase, xml, requiredMap.indexOf('SegmentBase') != -1);
      result.segmentList = this._parseChildElement('SegmentList', this._parseSegmentList, xml);
      result.contentProtection = this._parseChildElement('ContentProtection', this._parseContentProtection, xml, requiredMap.indexOf('contentProtection') != -1);
      return result;
    },

    _parseRepresentation: function(xml) {
      // Unsupported: @dependencyId, @mediaStreamStructureId, SubRepresentation,
      // SegmentTemplate
      var result = this._parseRepresentationBase(xml, ['codecs', 'baseURLs', 'segmentBase']);
      this._parseAttributes({
          bandwidth: {attr: 'bandwidth', parseFunc: parseInt, required: true},
          qualityRanking: {attr: 'qualityRanking', parseFunc: parseInt},
        }, xml, result);
      return result;
    },

    _parseAdaptationSet: function(xml) {
      // Unsupported: @lang, @contentType, @par, @minBandwidth, @maxBandwidth,
      // @minWidth, @maxWidth, @minHeight, @maxHeight, @minFrameRate,
      // @maxFrameRate, @segmentAlignment, @bitstreamSwitching,
      // @subsegmentAlignment, @subsegmentStartsWithSAP, Accessibility,
      // Role, Rating, Viewpoint, ContentComponent, SegmentTemplate
      var result = this._parseRepresentationBase(xml, ['mimeType', 'contentProtection']);
      result.representations = this._parseChildElements('Representation', this._parseRepresentation, xml, true);
      return result;
    },

    _parsePeriod: function(xml) {
      // Unsupported: @href, @actuate, @bitstreamSwitching, SegmentTemplate
      var result = this._parseRepresentationBase(xml);
      this._parseAttributes({
          id: {attr: 'id', parseFunc: parseInt},
          start: {attr: 'start', parseFunc: this._parseDuration},
          duration: {attr: 'duration', parseFunc: this._parseDuration},
        }, xml, result);
      result.adaptationSets = this._parseChildElements('AdaptationSet', this._parseAdaptationSet, xml, true);
      return result;
    },

    _parseMPD: function(xml) {
      // Unsupported: @id, @profiles, @type, @availabilityStartTime,
      // @availabilityEndTime, @minimumUpdatePeriod,
      // @minbufferTime, @timeShiftBufferDepth, @suggestedPresentationDelay,
      // @maxSegmentDuration, @maxSubsegmentDuration, ProgramInformation,
      // Location, Metrics
      var result = {};
      this._parseAttributes({mediaPresentationDuration: {attr: 'mediaPresentationDuration', parseFunc: this._parseDuration, required: true}}, xml, result);
      result.periods = this._parseChildElements('Period', this._parsePeriod, xml, true);
      result.baseURLs = this._parseChildElements('BaseURL', this._parseBaseURL, xml);
      return result;
    },

    _normalizeRepresentations: function(mpd, url) {
      mpd.manifestURL = url;
      return mpd;
    },

    _parseDASHManifest: function(text, url) {
      var parser = new DOMParser();
      var dom = parser.parseFromString(text, 'text/xml');

      this._checkDOMError(dom);

      return this._normalizeRepresentations(this._parseMPD(dom.firstChild), url);
    },

    _checkDOMError: function(dom) {
      //Internet Explorer
      try {
        if (dom.parseError.errorCode != 0) {
          throw {type: HP.VideoPlayer.Error.MPD_DOM_PARSER_ERROR};
        }
      } catch (e) {

      }

      //Firefox
      try {
        if (dom.documentElement.nodeName == "parsererror") {
          throw {type: HP.VideoPlayer.Error.MPD_DOM_PARSER_ERROR};
        }
      } catch (e) {

      }
    }
  })
}).call(this);
(function() {
  HP.VideoPlayer.DashSegmentIndex = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.DashSegmentIndex.prototype */
  {
    /**
     * The total number of segments stored in the index. When '_isCapped' is
     * set, the offset and start time at the index equal to the count (i.e. last
     * seg num + 1) are valid and point to EOS.
     * @type {Number}
     */
    _count: 0,

    /**
     * The absolute byte offsets from the start of the resource to the start of
     * the numbered segment. This value (and _startTimes) grow by doubling for
     * efficient incremental accumulation of new index entries. No Int64 type so
     * these integers are stored in Float64s.
     * @type {Float64Array}
     */
    _offsets: null,

    /**
     * The start time of the indexed segment.
     * @type {Float32Array}
     */
    _startTimes: null,

    /**
     * Whether this index is "capped" - meaning that the offset and start time
     * after the last segment point to EOS.
     * @type {boolean}
     */
    _isCapped: false,

    /**
     * A container for references to (sub)segments. 
     * References are guaranteed to be monotonic and contiguous by the underlying file formats (for now).
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
      this._count = 0;
      this._offsets = new Float64Array(128);
      this._startTimes = new Float32Array(128);
      this._isCapped = false;
    },

    /**
     * Returns the starting byte offset of a segment.
     * @param {Number} segNum Segment number.
     * @return {Number} Start time.
     */
    getOffset: function(segNum) {
      return this._offsets[segNum];
    },

    /**
     * Returns the start time of a segment.
     * @param {Number} segNum Segment number.
     * @return {Number} Start time.
     */
    getStartTime: function(segNum) {
      return this._startTimes[segNum];
    },

    /**
     * Returns the duration of a segment, or -1 if duration is unknown.
     * @param {Number} segNum Segment number.
     * @return {Number} Duration.
     */
    getDuration: function(segNum) {
      if (segNum + 1 < this._count || this._isCapped) {
        return this._startTimes[segNum + 1] - this._startTimes[segNum];
      }
      return -1;
    },

    /**
     * Returns the length of a segment, or -1 if length is unknown.
     * @param {Number} segNum Segment number.
     * @return {Number} Byte length.
     */
    getByteLength: function(segNum) {
      if (segNum + 1 < this._count || this._isCapped) {
        return this._offsets[segNum + 1] - this._offsets[segNum];
      }
      return -1;
    },

    /**
     * Returns the number of segments in this index.
     * @return {Number} Segment count.
     */
    getCount: function() {
      return this._count;
    },

    /**
     * Returns the total duration of the media in the index.
     * @return {Number} Total duration.
     */
    getTotalDuration: function() {
      return this._isCapped ? this._startTimes[this._count] : -1;
    },

    /**
     * Returns the total length of the media in the index.
     * @return {Number} Total byte length.
     */
    getTotalByteLength: function() {
      return this._isCapped ? this._offsets[this._count] : -1;
    },

    /**
     * Returns the segment number which begins no later than the provided time.
     * @param {Number} time Time to search for.
     * @return {Number} Segment number.
     */
    findForTime: function(time) {
      var idx = this._count - 1;
      for (var i = 0; i < this._count; i++) {
        if (this._startTimes[i] > time) {
          idx = i - 1;
          break;
        }
      }
      return idx;
    },

    /**
     * Resizes the segment index to include more places for media information.
     * Adding segments invokes this automatically, but if the segment count is known
     * performance can be improved.
     * @param {Number} newSize New size.
     */
    _resize: function(newSize) {
      // Always add a bit extra to avoid expensive resizes when capping
      newSize += 2;

      var offsets = this._offsets;
      this._offsets = new Float64Array(newSize + 1);
      var startTimes = this._startTimes;
      this._startTimes = new Float32Array(newSize + 1);
      for (var i = 0; i < this._count + 1; i++) {
        this._offsets[i] = offsets[i];
        this._startTimes[i] = startTimes[i];
      }
    },

    /**
     * Check whether we need to expand, do it if we do.
     */
    _checkExpand: function() {
      if (this._offsets.length < this._count + 1) {
        this._resize(this._offsets.length * 2);
      }
    },

    /**
     * Indicates that this segment index will be grown in "capped" mode, where a
     * segment's extents are communicated explicitly.
     * @param {Number} offset Byte offset of first media segment.
     * @param {Number} startTime Start time of first media segment.
     */
    _setFirstSegmentStart: function(offset, startTime) {
      this._offsets[0] = offset;
      this._startTimes[0] = startTime;
      this._isCapped = true;
    },

    /**
     * Grows the index in in "capped" mode by providing a new extent.
     * @param {Number} length Byte length of new media segment.
     * @param {Number} duration Time length of new media segment.
     */
    _addSegmentBySize: function(length, duration) {
      this._count++;
      this._checkExpand();
      this._offsets[this._count] = this._offsets[this._count - 1] + length;
      this._startTimes[this._count] = this._startTimes[this._count - 1] + duration;
    },

    /**
     * Adds a new segment (when not in "capped" mode) by specifying start info.
     * @param {Number} offset Byte offset of new media segment.
     * @param {Number} startTime Start time of new media segment.
     */
    _addSegmentByStart: function(offset, startTime) {
      this._checkExpand();
      this._offsets[this._count] = offset;
      this._startTimes[this._count] = startTime;
      this._count++;
    },

    /**
     * Convert an uncapped index (which doesn't know the extent of the last segment)
     * to a capped one by providing overall file details. This is likely to be
     * slightly wrong, as the last segment will also catch metadata at the end of
     * the file, but the effects are hopefully not calamitous since there's another
     * parser underneath us.
     * @param {Number} duration Duration of the file.
     * @param {Number} length Byte length of the file.
     */
    _cap: function(duration, length) {
      this._checkExpand();
      this._isCapped = true;
      this._startTimes[this._count] = duration;
      this._offsets[this._count] = length;
    },

    /**
     * Turn an ArrayBuffer (that is a sidx atom) into a segment index.
     * It is assumed that the sidx atom starts at byte 0.
     *
     * @param {ArrayBuffer} ab The ArrayBuffer of a sidx atom.
     * @param {Number} sidxStart The offset of the start of the sidx atom.
     * @see http://www.iso.org/iso/catalogue_detail.htm?csnumber=61988
     *     (ISO/IEC 14496-12:2012 section 8.16.3)
     */
    parseSidx: function(ab, sidxStart) {
      var d = new DataView(ab);
      var pos = 0;

      var sidxEnd = d.getUint32(0, false);

      var version = d.getUint8(pos + 8);
      pos += 12;

      // Skip reference_ID(32)

      var timescale = d.getUint32(pos + 4, false);
      pos += 8;

      var earliestPts;
      var firstOffset;
      if (version == 0) {
        earliestPts = d.getUint32(pos, false);
        firstOffset = d.getUint32(pos + 4, false);
        pos += 8;
      } else {
        earliestPts =
            (d.getUint32(pos, false) << 32) + d.getUint32(pos + 4, false);
        firstOffset =
            (d.getUint32(pos + 8, false) << 32) + d.getUint32(pos + 12, false);
        pos += 16;
      }

      firstOffset += sidxEnd + sidxStart;
      this._setFirstSegmentStart(firstOffset, earliestPts);

      // Skip reserved(16)
      var referenceCount = d.getUint16(pos + 2, false);
      pos += 4;

      for (var i = 0; i < referenceCount; i++) {
        var length = d.getUint32(pos, false);
        var duration = d.getUint32(pos + 4, false);
        pos += 12;
        this._addSegmentBySize(length, duration / timescale);
      }
    }
  })
}).call(this);




























})();