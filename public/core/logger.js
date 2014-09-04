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