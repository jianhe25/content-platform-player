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