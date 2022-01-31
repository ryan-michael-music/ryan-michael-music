const ENV = "CLOUD"; // set to either LOCAL or CLOUD
const music = document.querySelector("#audio");
let playButton = document.querySelector(".play-btn");
let seekBar = document.querySelector(".seek-bar");
let currentTimeText = document.querySelector(".current-time");
let songDurationText = document.querySelector(".song-duration");
let amountLoadedBar = document.querySelector(".amount-loaded");
let nextSongButton = document.querySelector(".forward-btn");
let prevSongButton = document.querySelector(".backward-btn");
let musicNameText = document.querySelector(".music-name");

function formatTime(seconds) {
    [parsedMinutes, parsedSeconds] = 
        [Math.floor(seconds/60), Math.floor(seconds % 60)];
    parsedSeconds = parsedSeconds < 10 ?
        `0${parsedSeconds}` : // format single digit number as 00, 01, 02, etc
        parsedSeconds.toString(); // print double digit number as is.

    return `${parsedMinutes}:${parsedSeconds}`;
}

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

async function getSongList(env) {
    if (env === 'LOCAL') {
        // These song names need to be set manually
        getSongList.songNames = ["REST-MIX-1.wav", "NIGHTMARE VERB.wav"]
        return getSongList.songNames;
    }
    else if (env === 'CLOUD') {
        // if we have already pulled song names from the s3 bucket/server
        // we don't want to do so a second time.
        // s3 GETs aren't free!!
        if (typeof getSongList.songNames !== 'undefined') {
            return getSongList.songNames;
        }

        let endpointName = 'https://ryanmichaelmusic.live';
        let parameters = 'list-type=2&prefix=assets/&delimeter=/';
        try {
            let response = await fetch(`${endpointName}/?${parameters}`);
            let xmlBucketData = await response.text();
            let parser = new DOMParser();
            let songTags = parser.parseFromString(xmlBucketData, "text/xml").getElementsByTagName("Key");
            getSongList.songNames = Array.from(songTags).map(tag => tag.textContent);
            return getSongList.songNames;
        }
        catch (e) {
            console.error(`Could not retrieve song names from bucket: ${e}`);
            return [];
        }
    }
    else {
       console.error("Could not determine environment to get song list.");
       return [];
    }
}

async function setSong(env, songIDX) {
    // initialize static variable
    if (typeof setSong.currentSongIDX === 'undefined')
    {
        setSong.currentSongIDX = 0;
    }

    let musicURL = "";
    let musicFileNames = await getSongList(env);
    if (env === "LOCAL")
    {
        musicURL = `http://${window.location.host}/test_assets`;
    }
    else if (env === "CLOUD")
    {
        musicURL = 'https://ryanmichaelmusic.live';
    }
    else 
    {
        musicURL = "ERROR";
        console.error("Could not determine environment to set song.");
        return;
    }

    // with current song index + 1, and 
    // "previous song" with current song index - 1
    setSong.currentSongIDX = 
        // "wrap around" to the first or last element of the song list
        // if we are out of bounds of the array of song names.
        songIDX >= 0 ?
            songIDX % musicFileNames.length: // positive or zero song idx
            musicFileNames.length + songIDX; // negative song idx.
                                             // songIDX === -1 => currentSongIDX === music len - 1, etc

    music.src = `${musicURL}/${musicFileNames[setSong.currentSongIDX]}`;
    musicNameText.innerHTML = getSongName(music);
    music.load();
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