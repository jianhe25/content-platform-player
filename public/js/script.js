$(document).ready(function(){
  
// Video
var video = document.getElementById('video');
var videoContainer = document.getElementsByClassName('js-video-container').item(0);

console.log('video-container:', videoContainer);

// Buttons
var $playButton = $('.js-play-pause');
var $volumeIndicator = $('.js-volume-indicator');

// Sliders
var $seekBar = $('.seek-bar');
var $cursor = $('.js-cursor');
var $progressBar = $('.js-progress-bar');
var $volumeBar = $('.js-volume-bar');
var $volumeBarInner = $('.js-volume-bar-inner');

var $fullScreenButton = $('.js-full-screen');
var $addAdbreakButton = $('.js-add-adbreak');
var $timeIndicatorSpent = $('.js-time-spent');
var $timeIndicatorTotal = $('.js-time-total');

var $adbreakHandler = $('.js-adbreak-handler');
var $adbreakButton = $('.js-adbreak-button');
var $adbreakRemove = $('.js-adbreak-remove');
var $captionHandler = $('.js-caption-handler');
var $captionTimestamp = $('.js-caption-timestamp');
var $caption = $('.js-caption');
var $videoContent = $('.js-video-content');
var $videoContainer = $('.js-video-container');

var $video = $('#video');

var $thumbnailCanvas = $(".js-thumbnail-canvas");
var videoPlayer = new HP.VideoPlayer.BaseVideoPlayer(new HP.VideoPlayer.MediaElement(document.getElementById('video')));


var colors = {
  EDIT_CURSOR_HIGHLIGHT: '#F79494'
};

var videoController = (function() {
  var my = {};

  my.init = function() {
    // videoPlayer.load('static/videos/mikethefrog.mp4');
    videoPlayer.load('http://ads.hulu.com/published/IO116612/FREEDOM_AW_D_ZENITH_96231_VS_Hulu_AdsTranscode_16x9_569579_4047235__4047235_trimmed.mp4');
    // Update the cursor as the video plays
    video.addEventListener('timeupdate', onVideoTimeUpdate);
    video.addEventListener('ended', my.pause);
    this.play();

    $playButton.click(onPlayButtonClick);
  };
  
  function onVideoTimeUpdate() {
    // Calculate the slider value
    var value = (video.currentTime / video.duration) * $seekBar.width();
    // Update cursor value
    $progressBar.update(value);
    $timeIndicatorSpent.text(utils.convertValueToTime(video.currentTime));
    $timeIndicatorTotal.text(utils.convertValueToTime(video.duration));
    captionController.updateCaptionByTime(video.currentTime);
  };

  // Event listener for the play/pause button
  function onPlayButtonClick() {
    if (video.paused == true) {
      videoController.play();
    } else {
      videoController.pause();
    }
  };

  my.play = function() {
    video.play();
    $playButton.removeClass('fa-play');
    $playButton.addClass('fa-pause');
  };
  my.pause = function() {
    video.pause();
    $playButton.addClass('fa-play');
    $playButton.removeClass('fa-pause');
  };
  return my;
})();

// Event listener for the full-screen button
var onFullScreenButtonClick = function() {
  var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;
  if (!fullscreenEnabled) 
    return;
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  if (fullscreenElement == null) {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
      video.mozRequestFullScreen(); // Firefox
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen(); // Chrome and Safari
    }
  } else {
    if(document.exitFullscreen) {
      document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
};
$fullScreenButton.click(onFullScreenButtonClick);

var seekBarController = {
  init: function() {
    $seekBar.click(this.onSeekBarClick);
    $seekBar.mousemove(this.onSeekBarMouseMove);
    $cursor.mousemove(this.onCursorMouseMove);
    $cursor.move = function (value) {
      $(this).css('left', value);
    };
    $progressBar.update = function(value) {
      $(this).css('width', value);
    };
    $seekBar.on('dblclick', '.js-adbreak', this.onSeekBarDoubleClick);
  },
  onSeekBarClick: function(e) {
    var offsetX = e.pageX - $(this).offset().left;
    $cursor.move(offsetX);
    var time = video.duration * (offsetX / $(this).width());
    video.currentTime = time;
  },
  onSeekBarMouseMove: function(e) {
    var offsetX = e.pageX - $(this).offset().left;
    var time = video.duration * (offsetX / $(this).width());
    $cursor.move(offsetX);
    $cursor.children('.cursor-time').text(utils.convertValueToTime(time));
  },
  onCursorMouseMove: function(e) {
    e.stopPropagation();
  },
  onSeekBarDoubleClick: function(e) {
    var offset = parseInt( $(e.currentTarget).css('left') ) + 1;
    var time = video.duration * (offset / $(this).width());
    video.currentTime = time;
  }
};

var volumeController = {
  init: function() {
    $volumeBar.mousedown(function(e) {
      volumeController.updateVolumeInnerBar(e);
      $(this).on('mousemove', volumeController.updateVolumeInnerBar);
    }).mouseup(function() {
      $(this).unbind('mousemove');
    }).mouseleave(function(){
      $(this).unbind('mousemove');
    });
    video.volume = ($volumeBarInner.width()) / $volumeBar.width();
  },
  updateVolumeInnerBar: function(e) {
    var offsetX = e.pageX - $volumeBar.offset().left;
    $volumeBarInner.css('width', offsetX);
    var volume = (offsetX) / $volumeBar.width();
    video.volume = volume;
    /*
      if (volume > 0.5) {
        volumeIndicator.addClass('fa-volume-up');
        volumeIndicator.removeClass('fa-volume-down');
        volumeIndicator.removeClass('fa-volume-off');
      } else if (volume > 0.1) {
        volumeIndicator.addClass('fa-volume-down');
        volumeIndicator.removeClass('fa-volume-up');
        volumeIndicator.removeClass('fa-volume-off');
      } else {
        volumeIndicator.addClass('fa-volume-off');
        volumeIndicator.removeClass('fa-volume-down');
        volumeIndicator.removeClass('fa-volume-up');
      }
    */
  }
};

var keyController = {
  init : function() {
    $(document).bind('keydown', function (e){
      if ($(e.target).is('input')) {
        return;
      }
      // space
      if (event.keyCode == 32) {
        $playButton.click();
      }
    });
  }
};

var adBreakController = {
  numAdbreaks: 0,
  init: function() {
    $addAdbreakButton.click(this.onAddAdBreakButtonClick);
    $adbreakButton.click(this.onAdBreakButtonClick);
    $adbreakRemove.click(this.onAdbreakRemoveClick);
  },
  onAddAdBreakButtonClick: function(e) {
    var position = $cursor.css('left');
    position = parseInt(position) - 1;
    console.log('position: ' + position);
    this.numAdbreaks++;
    var $newAdbreak = $('.adbreak').first().clone(/*withDataAndEvents=*/true);
    $newAdbreak.attr('id', 'adbreak' + this.numAdbreaks);
    $newAdbreak.css('left', position);
    $newAdbreak.show();
    $newAdbreak.appendTo($seekBar);

    var $newAdbreakHandler = $adbreakHandler.clone(/*withDataAndEvents=*/true);
    var adbreakTime = (position+1) / $seekBar.width() * video.duration;
    $newAdbreakHandler.children('.js-adbreak-button').val( utils.convertValueToTimeMs(adbreakTime) );
    $newAdbreakHandler.removeClass('adbreak-handler-template');

    $newAdbreakHandler.data('index', this.numAdbreaks);
    $newAdbreakHandler.appendTo($adbreakHandler.parent());
    $newAdbreakHandler.show();
  },
  onAdBreakButtonClick: function(e) {
    console.log('adbreakHandler = ' + utils.convertTimeToValueMs($(this).val()) );
    video.currentTime = utils.convertTimeToValueMs($(this).val());
  },
  onAdbreakRemoveClick: function(e) {
    var index = $(this).parent().data('index');
    var selector = '#adbreak-' + index;
    console.log('selector = ' + selector);
    $(selector).remove();
    $(this).parent().remove();
  }
};

var captionController = (function(){
  var my = {};
  captions = [];
  function Caption(timestamp, line) {
    this.timestamp = timestamp;
    this.line = line;
  };

  Caption.prototype.compare = function(other) {
    if (this.timestamp < other.timestamp)
      return -1;
    else if (this.timestamp == other.timestamp)
      return 0;
    else
      return 1;
  };

  my.init = function() {
    loadCaption();
    $captionTimestamp.click(function(e) {
      var captionTime = utils.convertTimeToValueMs( $(this).text() );
      var caption = binarySearch(captions, new Caption(captionTime));
      caption.line = $(this).next().val();
      video.currentTime = captionTime;
      $caption.html($(this).next().val());
      $caption.css('left', ($videoContent.width() - $caption.width()) / 2);
    });
    $("#copy-text").click(function(e) {
      window.prompt("Copy to clipboard: Ctrl+C, Enter", $caption.text());
    });
  };

  function prepareCaptionPanel() {
    console.log(captions.length);
    for (var i = 0; i < Math.min(20, captions.length); ++i) {
      var $newCaptionHandler = $captionHandler.clone(/*withDataAndEvents=*/true, /*deepWithDataAndEvents=*/true);
      var newTime = utils.convertValueToTimeMs(captions[i].timestamp + 0.01);
      $newCaptionHandler.children('input').val(captions[i].line);
      $newCaptionHandler.children('.js-caption-timestamp').text(newTime);
      $newCaptionHandler.appendTo($captionHandler.parent());
      $newCaptionHandler.show();
    }
  };

  function loadCaption() {
    console.log('starting load caption');
    $.ajax({
      url: 'static/captions/caption2.smi',
      type: 'GET',
      dataType: 'text'
    })
    .done(function(data) {
      var jq = $(data);
      var nodes = jq.children('sync');
      for (var i = 0; i < nodes.length; ++i) {
        var timestamp = parseInt($(nodes[i]).attr('start')) / 1000.0;
        var line = $(nodes[i]).children('p').html();
        captions.push( new Caption(timestamp, line) );
      }
      console.log('Load caption ajax call successfully!', captions.length);
      prepareCaptionPanel();
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.log('Error! loading caption failed');
    });
  };

  function binarySearch(captions, nowTime) {
    var l = 0, r = captions.length - 1;
    while (l <= r) {
      var mid = Math.round( (l+r) / 2 );
      if (captions[mid].compare(nowTime) == -1) {
        l = mid + 1;
      } else {
        r = mid - 1;
      }
    }
    if (l == 0)
      return new Caption(0, '');
    else
      return captions[l-1];
  };
  
  my.updateCaptionByTime = function(time) {
    if (captions.length > 0) {
      var caption = binarySearch(captions, new Caption(time));
      $caption.html(caption.line);
      $caption.css('left', ($videoContent.width() - $caption.width()) / 2);
    }
  };
  return my;
})();

var editBarController = (function() {
  var my = {};
  var $leftCursor = $('.js-edit-cursor-left');
  var $rightCursor = $('.js-edit-cursor-right');
  var $editBar = $('.js-edit-bar');
  var $editBarInner = $('.js-edit-bar-inner');
  var $leftCursorTime = $leftCursor.children('.edit-cursor-time');
  var $rightCursorTime = $rightCursor.children('.edit-cursor-time');

  my.init = function() {
    console.log('leftCursor.offsetx = ', $leftCursor.css('left'));
    console.log('leftCursor.width = ', $leftCursor.width());
    $editBarInner.css('left', parseInt($leftCursor.css('left')) + $leftCursor.width());
    $editBarInner.css('width', $rightCursor.offset().left - $editBarInner.offset().left);
    var oldCursorColor = $leftCursor.css('background-color');

    var isLeftEditbarMouseDown = false;
    var isRightEditbarMouseDown = false;
    /* Make edit-cursor draggable */
    $editBar.on('mousedown', '.js-edit-cursor-left', function(e) {
      isLeftEditbarMouseDown = true;
      $editBar.mousemove(function(e){
        if (e.pageX < $rightCursor.offset().left - $rightCursor.width()) {
          var offsetX = e.pageX - $(this).offset().left;
          $leftCursor.css('left', offsetX);
          $leftCursor.css('background-color', colors.EDIT_CURSOR_HIGHLIGHT);
          $editBarInner.css('left', offsetX + $leftCursor.width());
          $editBarInner.css('width', $rightCursor.offset().left - $editBarInner.offset().left);
          var time = offsetX / $editBar.width() * video.duration;
          $leftCursorTime.text(utils.convertValueToTime(time));
        }
      }).mouseup(function() {
        $editBar.unbind('mousemove');
        $leftCursor.css('background-color', oldCursorColor);
        videoController.pause();
        var time = ($leftCursor.offset().left - $editBar.offset().left) / $editBar.width() * video.duration;
        console.log("time = ", time);
        video.currentTime = time;
        console.log("after mouse up video.currentTime = ", video.currentTime );
     });
    });

    $editBar.on('mousedown', '.js-edit-cursor-right', function(e) {
      $editBar.mousemove(function(e){
        if (e.pageX > $leftCursor.offset().left + $leftCursor.width()) {
          var offsetX = e.pageX - $(this).offset().left;
          $rightCursor.css('left', offsetX);
          $rightCursor.css('background-color', colors.EDIT_CURSOR_HIGHLIGHT);
          $editBarInner.css('right', offsetX - $rightCursor.width());
          $editBarInner.css('width', $rightCursor.offset().left - $editBarInner.offset().left);
          var time = offsetX / $editBar.width() * video.duration;
          $rightCursorTime.text(utils.convertValueToTime(time));
        }
      }).mouseup(function() {
        $editBar.unbind('mousemove');
        $rightCursor.css('background-color', oldCursorColor);
        videoController.pause();
        var time = ($rightCursor.offset().left - $editBar.offset().left) / $editBar.width() * video.duration;
        console.log("time = ", time);
        video.currentTime = time;
        console.log("after mouse up video.currentTime = ", video.currentTime );
     });
    });

    $('.js-preview-button').click(function() {
      var startTime = ($leftCursor.offset().left - $editBar.offset().left) / $editBar.width() * video.duration;
      video.currentTime = startTime;
      var stopTime = ($rightCursor.offset().left - $editBar.offset().left) / $editBar.width() * video.duration;
      videoController.play();
      var stopTimer = getStopTimer(stopTime, videoController);
      video.addEventListener('timeupdate', stopTimer);
    });
  };
  
  function getStopTimer(timestamp, videoController) {
    var stopTimer = function() {
      if (video.currentTime > timestamp) {
        videoController.pause();
        video.removeEventListener('timeupdate', stopTimer);
      }
    }
    return stopTimer;
  };

  return my;
})();


var thumbnailController = (function(){
    var my = {};
    var scale = 0.6;
    my.init = function() {
        var canvas = $thumbnailCanvas[0];
        console.log('video.videoWidth = ', $videoContent.width());
        canvas.width = $videoContent.width() * scale;
        canvas.height = $videoContent.height() * scale;
        var ctx = canvas.getContext('2d');
        ctx.font = "30px Georgia"
        ctx.fillText('Video Thumbnail', 30, 80);

        $("#camera").click(function(){
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        });
    }
    return my;
})();

var utils = {
  headPaddingZero: function (num, size) {
    var s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  },
  tailPaddingZero: function (num, size) {
    var s = num.toString();
    while (s.length < size) s = s + '0';
    return s;
  },
  convertValueToTime: function (value) {
    var seconds =  parseInt(value);
    if (seconds < 60)
      result = '0:' + this.headPaddingZero(seconds, 2);
    else if (seconds < 3600) {
      minutes = seconds / 60;
      seconds = seconds % 60;
      result = minutes + ':' + this.headPaddingZero(seconds,2);
    } else {
      hours = seconds / 3600;
      minutes = seconds / 60 % 60;
      seconds = seconds % 60;
      result = hours + ':' + this.headPaddingZero(minutes,2) + ':' + this.headPaddingZero(seconds,2);;
    }
    return result;
  },
  convertValueToTimeMs: function(value) {
    var result = this.convertValueToTime(value);
    var ms = parseInt(value * 100);
    return result + ';' + this.tailPaddingZero(ms % 100, 2);
  },
  convertTimeToValue: function(time) {
    var value = 0;
    parts = time.split(':');
    for (var i = 0; i < parts.length; ++i) {
      value *= 60;
      value += parseInt(parts[i]);
    }
    return value;
  },
  convertTimeToValueMs: function(time) {
    var value = 0;
    secAndMs = time.split(';');
    parts = secAndMs[0].split(':');
    for (var i = 0; i < parts.length; ++i) {
      value *= 60;
      value += parseInt(parts[i]);
    }
    value += (parseInt(secAndMs[1]) / 100.0);
    return value;
  }
};

var startControllers = [videoController, 
                        seekBarController, 
                        volumeController, 
                        keyController,
                        adBreakController,
                        captionController,
                        editBarController,
                        thumbnailController];

startControllers.forEach( function(controller) {
  controller.init();
});

}); // end document.ready
