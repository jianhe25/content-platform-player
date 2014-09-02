$(document).ready(function(){
	
// Video
var video = document.getElementsByClassName("js_video_content")[0];

// Buttons
var playButton = $(".js_play_pause");
var volumeIndicator = $(".js_volume_indicator");

// Sliders
var seekBar = $(".seek-bar");
var cursor = $(".js_cursor");
var progress = $(".js_progress");
var volumeBar = $(".js_volume_bar");
var volumeBarInner = $(".js_volume_bar_inner");

var fullScreenButton = $(".js_full_screen");
var addAdBreakButton = $(".js_add_adbreak");
var timeSpent = $(".js_time_spent");
var timeTotal = $(".js_time_total");
var adbreakHandlerContainer = $(".adbreak-handler-container");
var adbreakButton = $(".js_adbreak_button");
var adbreakRemove = $(".js_adbreak_remove");

function videoPlay() {
	video.play();
	playButton.removeClass("fa-play");
	playButton.addClass("fa-pause");
}
function videoPause() {
	video.pause();
	playButton.addClass("fa-play");
	playButton.removeClass("fa-pause");
}

// Event listener for the play/pause button
playButton.click(function() {
	if (video.paused == true) {
		videoPlay();
	} else {
		videoPause();
	}
});

// Event listener for the full-screen button
fullScreenButton.click(function() {
	if (video.requestFullscreen) {
		video.requestFullscreen();
	} else if (video.mozRequestFullScreen) {
		video.mozRequestFullScreen(); // Firefox
	} else if (video.webkitRequestFullscreen) {
		video.webkitRequestFullscreen(); // Chrome and Safari
	}
});

/*	
//Event listener for the seek bar
seekBar.onChange("change", function() {
	// Calculate the new time
	var time = video.duration * (seekBar.value / 100);
	// Update the video time
	video.currentTime = time;
});
*/

seekBar.click(function(e) {
	var offsetX = e.pageX - seekBar.offset().left;
	cursor.update(offsetX);
	var time = video.duration * (offsetX / seekBar.width());
	video.currentTime = time;
});

seekBar.mousemove(function(e){
	var offsetX = e.pageX - seekBar.offset().left;
	cursor.update(offsetX);
}); 

cursor.mousemove(function(e) {
	e.stopPropagation();
});

// Update the cursor as the video plays
video.addEventListener("timeupdate", function() {
	// Calculate the slider value
	var value = (seekBar.width() / video.duration) * video.currentTime;
	// Update cursor value
	// cursor.update(value);
	progress.update(value);
	
	timeSpent.text(convert_value_to_time(video.currentTime));
	timeTotal.text(convert_value_to_time(video.duration));
});

function zero_padding(num, size) {
	var s = num.toString();
	while (s.length < size) s = "0" + s;
	return s;
}
function convert_value_to_time(value, inMs) {
	var seconds =  parseInt(value);
	if (seconds < 60)
		result = "0:" + zero_padding(seconds, 2);
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
	console.log("inMs = " + inMs);
	if (inMs) {
		var ms = parseInt(value * 100);
		return result + ";" + (ms % 100);
	}
	return result;
}

video.addEventListener("ended", function() {
	videoPause();
});

progress.update = function(value) {
	progress.css("width", value);
}
cursor.update = function (value) {
	cursor.css("left", value);
}

volumeIndicator.mouseenter(function() {
	volumeBar.removeClass("hidden");
});

volumeIndicator.mouseleave(function() {
	volumeBar.addClass("hidden");
});

jQuery(document).bind('keydown', function (event){
	// space
	if (event.keyCode == 32) {
		playButton.click();
	}
});

volumeBar.mousedown(function(e) {
	volumeBar.on("mousemove", function(e) {
		var offsetY = e.pageY - volumeBar.offset().top;
		volumeBarInner.css("height", offsetY);
		var volume = (volumeBar.height() - offsetY) / volumeBar.height();
		console.log("volume = " + volume);
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
}).mouseup(function(e) {
	volumeBar.unbind("mousemove");
}).mouseleave(function(e) {
	volumeBar.unbind("mousemove");
});

var num_adbreaks = 0;
addAdBreakButton.click(function(e) {
	var position = cursor.css("left");
	position = parseInt(position) - 1;
	console.log("position: " + position);
	num_adbreaks++;
	var new_adbreak = $(".adbreak").first().clone();
	new_adbreak.attr("id", "adbreak_" + num_adbreaks);
	new_adbreak.css("left", position);
	new_adbreak.removeClass("adbreak-template");
	new_adbreak.appendTo(seekBar);

	var new_adbreak_handler = $(".js_adbreak_handler").first().clone(/*withDataAndEvents=*/true);
	var adbreak_time = (position+1) / seekBar.width() * video.duration;
	new_adbreak_handler.children(".js_adbreak_button").val( convert_value_to_time(adbreak_time, /*inMs=*/true) );
	new_adbreak_handler.removeClass("adbreak-handler-template");

	new_adbreak_handler.data("index", num_adbreaks);
	new_adbreak_handler.appendTo(adbreakHandlerContainer);
});

seekBar.on('dblclick', '.js_adbreak', function(e) {
	var offset = parseInt( $(e.currentTarget).css("left") ) + 1;
	var time = video.duration * (offset / seekBar.width());
	video.currentTime = time;
});

function convert_time_to_value(time, inMs) {
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

adbreakButton.click(function(e) {
	console.log("adbreakHandler = " + convert_time_to_value($(this).val(), /*inMs=*/true) );
	video.currentTime = convert_time_to_value($(this).val(), /*inMs=*/true);
});

adbreakRemove.click(function(e) {
	var index = $(this).parent().data("index");
	var selector = "#adbreak_" + index;
	console.log("selector = " + selector);
	$(selector).remove();
	$(this).parent().remove();
});

}); // end document.ready
