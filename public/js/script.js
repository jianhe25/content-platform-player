$(document).ready(function(){
  
// Video
var video = document.getElementById('video');

// Buttons
var $playButton = $('.js_play_pause');
var $volumeIndicator = $('.js_volume_indicator');

// Sliders
var $seekBar = $('.seek-bar');
var $cursor = $('.js_cursor');
var $progressBar = $('.js_progress_bar');
var $volumeBar = $('.js_volume_bar');
var $volumeBarInner = $('.js_volume_bar_inner');

var $fullScreenButton = $('.js_full_screen');
var $addAdbreakButton = $('.js_add_adbreak');
var $timeIndicatorSpent = $('.js_time_spent');
var $timeIndicatorTotal = $('.js_time_total');
var $adbreakHandlerContainer = $('.adbreak-handler-container');
var $adbreakButton = $('.js_adbreak_button');
var $adbreakRemove = $('.js_adbreak_remove');
var $captionHandler = $('.js_caption_handler');
var $captionTimestamp = $('.js_caption_timestamp');
var $caption = $('.js_caption');

var videoPlayer = new HP.VideoPlayer.BaseVideoPlayer(new HP.VideoPlayer.MediaElement(document.getElementById('video')));

function seek(position) {
  videoPlayer.seek(position);
}

var videoController = (function() {
  var my = {};

  my.init = function() {
    videoPlayer.load('http://ads.hulu.com/published/IO116612/FREEDOM_AW_D_ZENITH_96231_VS_Hulu_AdsTranscode_16x9_569579_4047235__4047235_trimmed.mp4');
    // Update the cursor as the video plays
    video.addEventListener('timeupdate', onVideoTimeUpdate);
    video.addEventListener('ended', my.pause);
    this.play();
    $playButton.click(onPlayButtonClick);
  };
  
  function onVideoTimeUpdate() {
    // Calculate the slider value
    var value = ($seekBar.width() / video.duration) * video.currentTime;
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
  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.mozRequestFullScreen) {
    video.mozRequestFullScreen(); // Firefox
  } else if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen(); // Chrome and Safari
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
    $seekBar.on('dblclick', '.js_adbreak', this.onSeekBarDoubleClick);
  },
  onSeekBarClick: function(e) {
    var offsetX = e.pageX - $(this).offset().left;
    $cursor.move(offsetX);
    var time = video.duration * (offsetX / $(this).width());
    video.currentTime = time;
    console.log('time = ' + time + ' video.currentTime = ' + video.currentTime);
  },
  onSeekBarMouseMove: function(e) {
    var offsetX = e.pageX - $(this).offset().left;
    $cursor.move(offsetX);
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
    $volumeIndicator.mouseenter(this.onVolumeIndicatorMouseEnter);
    $volumeIndicator.mouseleave(this.onVolumeIndicatorMouseLeave);
    $volumeBar.mousedown(this.onVolumeBarMouseDown)
         .mouseup(this.onVolumeBarMouseUp)
         .mouseleave(this.onVolumeBarMouseLeave);
    video.volume = ($volumeBar.height() - $volumeBarInner.height()) / $volumeBar.height();
  },
  onVolumeIndicatorMouseEnter: function() {
    $volumeBar.removeClass('hidden');
  },
  onVolumeIndicatorMouseLeave: function() {
    $volumeBar.addClass('hidden');
  },
  onVolumeBarMouseDown: function(e) {
    volumeController.updateVolumeInnerBar(e);
    $volumeBar.on('mousemove', volumeController.updateVolumeInnerBar);
  },
  onVolumeBarMouseUp: function(e) {
    $volumeBar.unbind('mousemove');
  },
  onVolumeBarMouseLeave: function(e) {
    $volumeBar.unbind('mousemove');
  },
  updateVolumeInnerBar: function(e) {
    var offsetY = e.pageY - $volumeBar.offset().top;
    $volumeBarInner.css('height', offsetY);
    var volume = ($volumeBar.height() - offsetY) / $volumeBar.height();
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
    var position = cursor.css('left');
    position = parseInt(position) - 1;
    console.log('position: ' + position);
    this.numAdbreaks++;
    var $new_adbreak = $('.adbreak').first().clone(/*withDataAndEvents=*/true);
    $new_adbreak.attr('id', 'adbreak_' + this.numAdbreaks);
    $new_adbreak.css('left', position);
    $new_adbreak.removeClass('adbreak-template');
    $new_adbreak.appendTo(seekBar);

    var $new_adbreak_handler = $('.js_adbreak_handler').first().clone(/*withDataAndEvents=*/true);
    var adbreak_time = (position+1) / seekBar.width() * video.duration;
    $new_adbreak_handler.children('.js_adbreak_button').val( utils.convertValueToTimeMs(adbreak_time) );
    $new_adbreak_handler.removeClass('adbreak-handler-template');

    $new_adbreak_handler.data('index', this.numAdbreaks);
    $new_adbreak_handler.appendTo(adbreakHandlerContainer);
  },
  onAdBreakButtonClick: function(e) {
    console.log('adbreakHandler = ' + utils.convertTimeToValueMs($(this).val()) );
    video.currentTime = utils.convertTimeToValueMs($(this).val());
  },
  onAdbreakRemoveClick: function(e) {
    var index = $(this).parent().data('index');
    var selector = '#adbreak_' + index;
    console.log('selector = ' + selector);
    $(selector).remove();
    $(this).parent().remove();
  }
};

function getMethods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof(obj[id]) == "function") {
        console.log(id + ": " + obj[id].toString());
      }
    } catch (err) {
      console.log(id + ": inaccessible");
    }
  }
  return result;
}

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
    prepareTestCaption();
    loadCaption();
    $captionTimestamp.click(function(e) {
      $caption.text($(this).next().val());
      video.currentTime = utils.convertTimeToValueMs( $(this).text() );
    });
  };

  function prepareTestCaption() {
    for (var i = 2; i <= 10; ++i) {
      var $new_caption_handler = $captionHandler.clone(/*withDataAndEvents=*/true, /*deepWithDataAndEvents=*/true);
      var old_time = $new_caption_handler.children('.js_caption_timestamp').text();
      var new_time = utils.convertValueToTimeMs(utils.convertTimeToValueMs(old_time) + i);
      $new_caption_handler.children('input').val(i + '-th line of caption');
      $new_caption_handler.children('.js_caption_timestamp').text(new_time);
      $new_caption_handler.appendTo($captionHandler.parent());
    }
  };

  function loadCaption() {
    console.log('starting load caption');
    $.ajax({
      url: 'static/captions/test.smi',
      type: 'GET',
      dataType: 'text'
    })
    .done(function(data) {
      var jq = $(data);
      var nodes = jq.children('sync');

      for (var i = 0; i < nodes.length; ++i) {
        var timestamp = parseInt($(nodes[i]).attr("start")) / 10000.0;
        var line = $(nodes[i]).html();
        captions.push( new Caption(timestamp, line) );
      }

      // var domNodes = $.parseHTML(data);
      // // domNodes.length is 1
      // var html = domNodes[0];
      // nodes = html.childNodes;
      // console.log(nodes);
      // // for (var id in html) {
      //   if (html[id] != null)
      //   console.log(id + " : " + html[id].toString());
      // }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.log("loading caption failed");
    });
    console.log('end load caption ajax call');
  };

  function binarySearch(captions, nowTime) {
    console.log(captions.length);
    var l = 0, r = captions.length - 1;
    while (l <= r) {
      var mid = Math.round( (l+r) / 2 );
      console.log(mid, captions[mid]);
      if (captions[mid].compare(nowTime) == -1) {
        l = mid + 1;
      } else {
        r = mid - 1;
      }
    }
    if (l == 0)
      return new Caption(0, "");
    else
      return captions[l-1];
  };
  
  my.updateCaptionByTime = function(time) {
    if (captions.length > 0) {
      var caption = binarySearch(captions, new Caption(time));
      $caption.html(caption.line);
    }
  };
  return my;
})();

var utils = {
  PaddingZero: function (num, size) {
    var s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  },
  convertValueToTime: function (value) {
    var seconds =  parseInt(value);
    if (seconds < 60)
      result = '0:' + utils.PaddingZero(seconds, 2);
    else if (seconds < 3600) {
      minutes = seconds / 60;
      seconds = seconds % 60;
      result = minutes + ':' + utils.PaddingZero(seconds,2);
    } else {
      hours = seconds / 3600;
      minutes = seconds / 60 % 60;
      seconds = seconds % 60;
      result = hours + ':' + utils.PaddingZero(minutes,2) + ':' + utils.PaddingZero(seconds,2);;
    }
    return result;
  },
  convertValueToTimeMs: function(value) {
    var result = utils.convertValueToTime(value);
    var ms = parseInt(value * 100);
    return result + ';' + (ms % 100);
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
    sec_and_ms = time.split(';');
    parts = sec_and_ms[0].split(':');
    for (var i = 0; i < parts.length; ++i) {
      value *= 60;
      value += parseInt(parts[i]);
    }
    value += (parseInt(sec_and_ms[1]) / 100.0);
    return value;
  }
};

var startControllers = [videoController, 
                        seekBarController, 
                        volumeController, 
                        keyController,
                        adBreakController,
                        captionController];

startControllers.forEach( function(controller) {
  controller.init();
});

}); // end document.ready
