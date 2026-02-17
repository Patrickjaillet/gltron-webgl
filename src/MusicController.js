export class MusicController {
    constructor(musicUrls, volume = 0.5) {
        this.urls = musicUrls;
        this.volume = volume;
        this.currentAudio = null;
        this.currentTrackName = null;
    }

    play(trackName, loop = true) {
        if (this.currentTrackName === trackName && this.currentAudio && !this.currentAudio.paused) return;

        this.stop();

        const url = this.urls[trackName];
        if (!url) return;

        this.currentAudio = new Audio(url);
        this.currentAudio.loop = loop;
        this.currentAudio.volume = this.volume;
        this.currentTrackName = trackName;

        this.currentAudio.play().catch(e => {
            console.warn("Autoplay blocked or file missing", e);
        });
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.currentAudio) this.currentAudio.volume = vol;
    }
}