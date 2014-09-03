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