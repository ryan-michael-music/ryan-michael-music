// TODO: Manage environments with webpack
const CONFIG = require("./env-config.json");
const ENV_CONFIG = CONFIG[ENVIRONMENT];
const music = document.querySelector("#audio");
let playButton = document.querySelector(".play-btn");
let seekBar = document.querySelector(".seek-bar");
let currentTimeText = document.querySelector(".current-time");
let songDurationText = document.querySelector(".song-duration");
let amountLoadedBar = document.querySelector(".amount-loaded");
let nextSongButton = document.querySelector(".forward-btn");
let prevSongButton = document.querySelector(".backward-btn");
let musicNameText = document.querySelector(".music-name");
let acousticSongsButton = document.querySelector(".music-tab.acoustic");
let electronicSongsButton = document.querySelector(".music-tab.electronic");
let bandSongsButton = document.querySelector(".music-tab.band");
let artworkDisk = document.querySelector(".disk");


function formatTime(seconds) {
    [parsedMinutes, parsedSeconds] = 
        [Math.floor(seconds/60), Math.floor(seconds % 60)];
    parsedSeconds = parsedSeconds < 10 ?
        `0${parsedSeconds}` : // format single digit number as 00, 01, 02, etc
        parsedSeconds.toString(); // print double digit number as is.

    return `${parsedMinutes}:${parsedSeconds}`;
}

// TODO: REPLACE THIS WITH SONG NAMES IN CONFIG FILE
function getSongName(song) {
    // Use the file name minus the extension a the song title.
    // The "correct" way to do this would be to read the meta
    // data from the mp3 file, but 1) this data can change across
    // different file types, and 2) mp3 files (and probably other
    // formats) keep the metadata at the end of the file, which
    // we don't have access to if we're at the beginning of
    // streaming a file.
    let nameWithExtension = song.src.split("/");
    nameWithExtension = nameWithExtension[nameWithExtension.length - 1];
    let nameWithoutExtension = nameWithExtension.split('.')[0]; // don't put . in your file name. SorryNotSorry

    // capitalize the first letter of each word.
    return decodeURI(
        nameWithoutExtension
        .split(' ')
        .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
        .join(' '));
}

async function setSong(env, songIDX, newSongType) {
    // TODO: static vars are adding up. refactor this out to a class??

    // initialize static variables
    if (typeof setSong.currentSongIDX === 'undefined') {
        setSong.currentSongIDX = 0;
    }
    if (typeof newSongType === 'undefined') {
        if (typeof setSong.currentSongType === 'undefined'){
            setSong.currentSongType = 'band';
        }
        else {
            ; // song type has already been set and a new one hasn't been passed in.
              // do nothing.
        }
    }
    else {  // new song type was passed in. Let's set it.
        setSong.currentSongType = newSongType;
    }

    let musicURL = env["music_url"];
    let musicFileNames = env["song_names"][setSong.currentSongType];

    // with current song index + 1, and 
    // "previous song" with current song index - 1
    setSong.currentSongIDX = 
        // "wrap around" to the first or last element of the song list
        // if we are out of bounds of the array of song names.
        songIDX >= 0 ?
            songIDX % musicFileNames.length: // positive or zero song idx
            musicFileNames.length + songIDX; // negative song idx.
                                             // songIDX === -1 => currentSongIDX === music len - 1, etc

    music.src = `${musicURL}/${musicFileNames[setSong.currentSongIDX][0]}`;
    // musicNameText.innerHTML = getSongName(music);
    musicNameText.innerHTML = musicFileNames[setSong.currentSongIDX][1]
    music.load();
    // by default, music will pause when we switch songs, but let's be
    // explicit that we want music paused when the play button is set
    // to pause.
    if (playButton.classList.contains("pause")) {
        music.pause();
    }
    else { // play button is set to play (and not pause)
        music.play();
    }
}

setSong(ENV_CONFIG, 0);

music.addEventListener('durationchange', () => {
    seekBar.value = 0;
    songDurationText.innerHTML = formatTime(music.duration);
    seekBar.max = music.duration;
});

playButton.addEventListener('click', () => {
    if (playButton.classList.contains("pause")) {
        music.play();
    }
    else { // not paused
        music.pause();
    }
    playButton.classList.toggle("pause");
});

acousticSongsButton.addEventListener('click', () => {
    setSong(ENV_CONFIG, setSong.currentSongIDX, 'acoustic');
    // set icon to acoustic image
    artworkDisk.style['background-image'] = 'url("acoustic.jpg")'
});

electronicSongsButton.addEventListener('click', () => {
    setSong(ENV_CONFIG, setSong.currentSongIDX, 'electronic');
    // set icon to electronic image
    artworkDisk.style['background-image'] = 'url("electronic.jpg")'
});

bandSongsButton.addEventListener('click', () => {
    setSong(ENV_CONFIG, setSong.currentSongIDX, 'band');
    // set icon to electronic image
    artworkDisk.style['background-image'] = 'url("band.png")'
});

nextSongButton.addEventListener('click', () => {
    setSong(ENV_CONFIG, setSong.currentSongIDX + 1);
});

prevSongButton.addEventListener('click', () => {
    setSong(ENV_CONFIG, setSong.currentSongIDX - 1);
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
    if (!isNaN(music.duration)) {
        amountLoadedBar.style.width = 
            (music.buffered.end(music.buffered.length - 1) / music.duration) * 100 + "%";
    }
});