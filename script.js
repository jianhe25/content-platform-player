$(document).ready(function(){
	
// Video
var video = document.getElementsByClassName("js_video_content")[0];

// Buttons
var playButton = $(".js_play_pause");
var volumeIndicator = $(".js_volume_indicator");

// Sliders
var seekBar = $(".seek-bar");
var cursor = $(".js_cursor");
var progressBar = $(".js_progress_bar");
var volumeBar = $(".js_volume_bar");
var volumeBarInner = $(".js_volume_bar_inner");

var fullScreenButton = $(".js_full_screen");
var addAdbreakButton = $(".js_add_adbreak");
var timeIndicatorSpent = $(".js_time_spent");
var timeIndicatorTotal = $(".js_time_total");
var adbreakHandlerContainer = $(".adbreak-handler-container");
var adbreakButton = $(".js_adbreak_button");
var adbreakRemove = $(".js_adbreak_remove");
var captionHandler = $(".js_caption_handler");
var captionTimestamp = $(".js_caption_timestamp");
var caption = $(".js_caption");

var videoController = {
	init: function() {
		// Update the cursor as the video plays
		video.addEventListener("timeupdate", videoController.onVideoTimeUpdate);
		video.addEventListener("ended", videoController.pause);
	},
	play: function() {
		video.play();
		playButton.removeClass("fa-play");
		playButton.addClass("fa-pause");
	},
	pause: function() {
		video.pause();
		playButton.addClass("fa-play");
		playButton.removeClass("fa-pause");
	},
	onVideoTimeUpdate : function() {
		// Calculate the slider value
		var value = (seekBar.width() / video.duration) * video.currentTime;
		// Update cursor value
		// cursor.update(value);
		progressBar.update(value);
		timeIndicatorSpent.text(utils.convert_value_to_time(video.currentTime));
		timeIndicatorTotal.text(utils.convert_value_to_time(video.duration));
	}, 
};

// Event listener for the play/pause button
var onPlayButtonClick = function() {
	if (video.paused == true) {
		videoController.play();
	} else {
		videoController.pause();
	}
};
playButton.click(onPlayButtonClick);

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
fullScreenButton.click(onFullScreenButtonClick);

var seekBarController = {
	init: function() {
		seekBar.click(seekBarController.onSeekBarClick);
		seekBar.mousemove(seekBarController.onSeekBarMouseMove);
		cursor.mousemove(seekBarController.onCursorMouseMove);	
		cursor.move = function (value) {
			cursor.css("left", value);
		};
		progressBar.update = function(value) {
			progressBar.css("width", value);
		};
		seekBar.on('dblclick', '.js_adbreak', seekBarController.onSeekBarDoubleClick);
	},
	onSeekBarClick: function(e) {
		var offsetX = e.pageX - seekBar.offset().left;
		cursor.move(offsetX);
		var time = video.duration * (offsetX / seekBar.width());
		video.currentTime = time;
	},
	onSeekBarMouseMove: function(e) {
		var offsetX = e.pageX - seekBar.offset().left;
		cursor.move(offsetX);
	},
	onCursorMouseMove: function(e) {
		e.stopPropagation();
	},
	onSeekBarDoubleClick: function(e) {
		var offset = parseInt( $(e.currentTarget).css("left") ) + 1;
		var time = video.duration * (offset / seekBar.width());
		video.currentTime = time;
	}
};

var volumeController = {
	init: function() {
		volumeIndicator.mouseenter(volumeController.onVolumeIndicatorMouseEnter);
		volumeIndicator.mouseleave(volumeController.onVolumeIndicatorMouseLeave);
		volumeBar.mousedown(volumeController.onVolumeBarMouseDown)
				 .mouseup(volumeController.onVolumeBarMouseUp)
				 .mouseleave(volumeController.onVolumeBarMouseLeave);
		video.volume = (volumeBar.height() - volumeBarInner.height()) / volumeBar.height();
	},
	onVolumeIndicatorMouseEnter: function() {
		volumeBar.removeClass("hidden");
	},
	onVolumeIndicatorMouseLeave: function() {
		volumeBar.addClass("hidden");
	},
	onVolumeBarMouseDown: function(e) {
		volumeBar.on("mousemove", function(e) {
			var offsetY = e.pageY - volumeBar.offset().top;
			volumeBarInner.css("height", offsetY);
			var volume = (volumeBar.height() - offsetY) / volumeBar.height();
			video.volume = volume;
			/*
			if (volume > 0.5) {
				volumeIndicator.addClass("fa-volume-up");
				volumeIndicator.removeClass("fa-volume-down");
				volumeIndicator.removeClass("fa-volume-off");
			} else if (volume > 0.1) {
				volumeIndicator.addClass("fa-volume-down");
				volumeIndicator.removeClass("fa-volume-up");
				volumeIndicator.removeClass("fa-volume-off");
			} else {
				volumeIndicator.addClass("fa-volume-off");
				volumeIndicator.removeClass("fa-volume-down");
				volumeIndicator.removeClass("fa-volume-up");
			}
			*/
		});
	},
	onVolumeBarMouseUp: function(e) {
		volumeBar.unbind("mousemove");
	},
	onVolumeBarMouseLeave: function(e) {
		volumeBar.unbind("mousemove");
	}
};

var keyController = {
	init : function() {
		jQuery(document).bind('keydown', function (event){
			// space
			if (event.keyCode == 32) {
				playButton.click();
			}
		});
	}
};

var adBreakController = {
	numAdbreaks: 0,
	init: function() {
		addAdbreakButton.click(adBreakController.onAddAdBreakButtonClick);
		adbreakButton.click(adBreakController.onAdBreakButtonClick);
		adbreakRemove.click(adBreakController.onAdbreakRemoveClick);
	},
	onAddAdBreakButtonClick: function(e) {
		var position = cursor.css("left");
		position = parseInt(position) - 1;
		console.log("position: " + position);
		adBreakController.numAdbreaks++;
		var new_adbreak = $(".adbreak").first().clone();
		new_adbreak.attr("id", "adbreak_" + adBreakController.numAdbreaks);
		new_adbreak.css("left", position);
		new_adbreak.removeClass("adbreak-template");
		new_adbreak.appendTo(seekBar);

		var new_adbreak_handler = $(".js_adbreak_handler").first().clone(/*withDataAndEvents=*/true);
		var adbreak_time = (position+1) / seekBar.width() * video.duration;
		new_adbreak_handler.children(".js_adbreak_button").val( utils.convert_value_to_time(adbreak_time, /*inMs=*/true) );
		new_adbreak_handler.removeClass("adbreak-handler-template");

		new_adbreak_handler.data("index", adBreakController.numAdbreaks);
		new_adbreak_handler.appendTo(adbreakHandlerContainer);
	},
	onAdBreakButtonClick: function(e) {
		console.log("adbreakHandler = " + utils.convert_time_to_value($(this).val(), /*inMs=*/true) );
		video.currentTime = utils.convert_time_to_value($(this).val(), /*inMs=*/true);
	},
	onAdbreakRemoveClick: function(e) {
		var index = $(this).parent().data("index");
		var selector = "#adbreak_" + index;
		console.log("selector = " + selector);
		$(selector).remove();
		$(this).parent().remove();
	}
};


var captionController = {
	init: function() {
		captionController.prepareTestCaptions();
		captionTimestamp.click(captionController.onCaptionTimestampClick);
	},
	onCaptionTimestampClick: function(e) {	
		caption.text(captionTimestamp.next().val());
	},
	prepareTestCaptions: function() {
		for (var i = 0; i < 10; ++i) {
			var new_caption_handler = captionHandler.clone();
			new_caption_handler.appendTo(captionHandler.parent());
		}
	}
};

var utils = {
	zero_padding : function (num, size) {
		var s = num.toString();
		while (s.length < size) s = "0" + s;
		return s;
	},
	convert_value_to_time : function (value, inMs) {
		var seconds =  parseInt(value);
		if (seconds < 60)
			result = "0:" + utils.zero_padding(seconds, 2);
		else if (seconds < 3600) {
			minutes = seconds / 60;
			seconds = seconds % 60;
			result = minutes + ":" + seconds;
		} else {
			hours = seconds / 3600;
			minutes = seconds / 60 % 60;
			seconds = seconds % 60;
			result = hours + ":" + minutes + ":" + seconds;
		}
		inMs = (typeof inMs === "undefined") ? false : inMs;
		if (inMs) {
			var ms = parseInt(value * 100);
			return result + ";" + (ms % 100);
		}
		return result;
	},
	convert_time_to_value: function(time, inMs) {
		var value = 0;
		inMs = (typeof inMs === "undefined") ? false : inMs;
		if (!inMs) {
			parts = time.split(":");
			for (var i = 0; i < parts.length; ++i) {
				value *= 60;
				value += parseInt(parts[i]);
			}
		} else {
			sec_and_ms = time.split(";");
			parts = sec_and_ms[0].split(":");
			for (var i = 0; i < parts.length; ++i) {
				value *= 60;
				value += parseInt(parts[i]);
			}
			value += (parseInt(sec_and_ms[1]) / 100.0);
		}
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
