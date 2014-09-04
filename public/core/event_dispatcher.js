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