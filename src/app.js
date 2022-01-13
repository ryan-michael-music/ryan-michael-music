const ENV = "LOCAL"; // set to either LOCAL or CLOUD
const music = document.querySelector("#audio");
let playButton = document.querySelector(".play-btn");
let seekBar = document.querySelector(".seek-bar");
let currentTimeText = document.querySelector(".current-time");
let songDurationText = document.querySelector(".song-duration");
let amountLoadedBar = document.querySelector(".amount-loaded");
let nextSongButton = document.querySelector(".forward-btn");
let prevSongButton = document.querySelector(".backward-btn");

function formatTime(seconds) {
    [parsedMinutes, parsedSeconds] = 
        [Math.floor(seconds/60), Math.floor(seconds % 60)];
    parsedSeconds = parsedSeconds < 10 ?
        `0${parsedSeconds}` : // format single digit number as 00, 01, 02, etc
        parsedSeconds.toString(); // print double digit number as is.

    return `${parsedMinutes}:${parsedSeconds}`;
}

function setSong(env, songIDX) {

    let musicURL = "";
    if (env === "LOCAL")
    {
        musicURL = `http://${window.location.host}/test_assets`;
        // These file names have to be set manually 
        musicFileNames = ["REST-MIX-1.wav", "NIGHTMARE VERB.wav"];
    }
    else 
    {
        musicURL = "ERROR";
        musicFileNames = [];
        return;
    }

    // we need to store the current song index
    // so we can apply "next song" functionality
    // with current song index + 1, and 
    // "previous song" with current song index - 1
    setSong.currentSongIDX = 
        // "wrap around" to the first or last element of the song list
        // if we are out of bounds of the array of song names.
        songIDX >= 0 ?
            songIDX % musicFileNames.length: // positive or zero song idx
            musicFileNames.length + songIDX; // negative song idx.
                                             // songIDX === -1 => currentSongIDX === music len - 1, etc

    music.src = `${musicURL}/${musicFileNames[setSong.currentSongIDX]}`
    // by default, music will pause when we switch songs, but let's be
    // explicit that we want music paused when the play button is set
    // to pause.
    if (playButton.classList.contains("pause"))
    {
        music.pause();
    }
    else // play button is set to play (and not pause)
    {
        music.play();
    }
}
setSong(ENV, 0);

music.addEventListener('durationchange', () => {
    seekBar.value = 0;
    songDurationText.innerHTML = formatTime(music.duration);
    seekBar.max = music.duration;
});

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

nextSongButton.addEventListener('click', () => {
    setSong(ENV, setSong.currentSongIDX + 1);
});

prevSongButton.addEventListener('click', () => {
    setSong(ENV, setSong.currentSongIDX - 1);
})

seekBar.addEventListener('input', () => {
    music.currentTime = seekBar.value;
    currentTimeText.innerHTML = formatTime(seekBar.value);
});

music.addEventListener('timeupdate', () => {
    // periodically update slider to see what point in the song we are at
    seekBar.value = music.currentTime;
    currentTimeText.innerHTML = formatTime(music.currentTime);

    // show the last point at which we have buffered audio
    // music.duration may be set to NaN if we change songs, and the timeupdate event is fired
    // before the duration is correctly updated.
    if (!isNaN(music.duration)){
        amountLoadedBar.style.width = 
            (music.buffered.end(music.buffered.length - 1) / music.duration) * 100 + "%";
    }
});

// //TODO: Should this be an EventListener for music.timeupdate?
// setInterval(() => {


// }, 100);