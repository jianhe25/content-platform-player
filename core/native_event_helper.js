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