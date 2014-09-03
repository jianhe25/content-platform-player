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