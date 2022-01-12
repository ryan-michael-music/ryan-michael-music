const music = document.querySelector("#audio");
let playButton = document.querySelector(".play-btn");
let seekBar = document.querySelector(".seek-bar");
let currentTimeText = document.querySelector(".current-time");
let songDurationText = document.querySelector(".song-duration");
let amountLoadedBar = document.querySelector(".amount-loaded");

function formatTime(seconds) {
    [parsedMinutes, parsedSeconds] = 
        [Math.floor(seconds/60), Math.floor(seconds % 60)];
    parsedSeconds = parsedSeconds < 10 ?
        `0${parsedSeconds}` : // format single digit number as 00, 01, 02, etc
        parsedSeconds.toString(); // print double digit number as is.

    return `${parsedMinutes}:${parsedSeconds}`;
}

function setSong() {
    seekBar.value = 0;
    songDurationText.innerHTML = formatTime(music.duration);
    seekBar.max = music.duration;
}

// Initialize after all content has been loaded
window.addEventListener('load', setSong);


playButton.addEventListener('click', () => {
    if (playButton.classList.contains("pause"))
    {
        music.play();
    }
    else // not paused
    {
        music.pause();
    }
    playButton.classList.toggle("pause");
});

seekBar.addEventListener('input', () => {
    music.currentTime = seekBar.value;
    currentTimeText.innerHTML = formatTime(seekBar.value);
});

music.addEventListener('timeupdate', () => {
    // periodically update slider to see what point in the song we are at
    seekBar.value = music.currentTime;
    currentTimeText.innerHTML = formatTime(music.currentTime);

    // show the last point at which we have buffered audio
    amountLoadedBar.style.width = 
        (music.buffered.end(music.buffered.length - 1) / music.duration) * 100 + "%";
});

// //TODO: Should this be an EventListener for music.timeupdate?
// setInterval(() => {


// }, 100);