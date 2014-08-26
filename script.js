$(document).ready(function(){
	

	// Video
	var video = document.getElementById("video");

	// Buttons
	var playButton = $(".js_play_pause");
	var muteButton = $("#mute");
	var fullScreenButton = $("#full-screen");

	// Sliders
	var seekBar = $(".seek-bar");
	var cursor = $(".js_cursor");
	var volumeBar = $("#volume-bar");


	// Event listener for the play/pause button
	playButton.click(function() {
		if (video.paused == true) {
			// Play the video
			video.play();
			playButton.removeClass("fa-play");
			playButton.addClass("fa-pause");
		} else {
			// Pause the video
			video.pause();
			playButton.addClass("fa-play");
			playButton.removeClass("fa-pause");
		}
	});


	// Event listener for the mute button
	muteButton.click(function() {
		if (video.muted == false) {
			// Mute the video
			video.muted = true;

			// Update the button text
			muteButton.innerHTML = "Unmute";
		} else {
			// Unmute the video
			video.muted = false;

			// Update the button text
			muteButton.innerHTML = "Mute";
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
	
	
	seekBar.mousemove(function(e){
		var offsetX = e.pageX - seekBar.offset().left;
		console.log("left = " + seekBar.offset().left + "top = " + seekBar.offset().top + "offsetX = " + offsetX);
		cursor.update(offsetX);
		var time = video.duration * (offsetX / seekBar.width());
		video.currentTime = time;
	}); 
	
	// Update the cursor as the video plays
	video.addEventListener("timeupdate", function() {
		console.log("seekBar.width = " + seekBar.width());
		// Calculate the slider value
		var value = (seekBar.width() / video.duration) * video.currentTime;
		// Update cursor value
		cursor.update(value);
	});

	cursor.update = function (value) {
		cursor.css("margin-left", value);
	}

	jQuery(document).bind('keydown', function (event){
    	console.log("what" + event.keyCode);
    	// space
    	if (event.keyCode == 32) {
			playButton.click();
		}
  	});

	// // Pause the video when the seek handle is being dragged
	// seekBar.addEventListener("mousedown", function() {
	// 	video.pause();
	// });

	// // Play the video when the seek handle is dropped
	// seekBar.addEventListener("mouseup", function() {
	// 	video.play();
	// });

	// // Event listener for the volume bar
	// volumeBar.addEventListener("change", function() {
	// 	// Update the video volume
	// 	video.volume = volumeBar.value;
	// });
});