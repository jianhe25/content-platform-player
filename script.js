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

var fullScreenButton = $(".js_full_screen")

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
});

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
	console.log("what" + event.keyCode);
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
	});
}).mouseup(function(e) {
	volumeBar.unbind("mousemove");
}).mouseleave(function(e) {
	volumeBar.unbind("mousemove");
});
});