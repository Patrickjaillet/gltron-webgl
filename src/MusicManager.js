import * as THREE from 'three';

export class MusicManager {
    constructor(listener, assetManager, globalVolume = 0.5) {
        this.listener = listener;
        this.globalVolume = globalVolume;
        this.tracks = {};
        this.currentTrack = null;
        this.fadingTracks = [];

        const setupTrack = (name, assetName, loop) => {
            const buffer = assetManager.get(assetName);
            if (buffer) {
                const sound = new THREE.Audio(listener);
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(0);
                this.tracks[name] = sound;
            }
        };

        setupTrack('menu', 'menu_theme', true);
        setupTrack('game', 'game_theme', true);
        setupTrack('gameover', 'gameover_theme', false);
    }

    playTrack(name, fadeDuration = 2.0) {
        const nextTrack = this.tracks[name];
        if (!nextTrack) return;

        if (this.currentTrack === nextTrack && nextTrack.isPlaying) return;

        // Fade out current
        if (this.currentTrack && this.currentTrack.isPlaying) {
            this.fade(this.currentTrack, this.currentTrack.getVolume(), 0, fadeDuration);
        }

        // Fade in next
        if (!nextTrack.isPlaying) nextTrack.play();
        this.fade(nextTrack, 0, this.globalVolume, fadeDuration);
        
        this.currentTrack = nextTrack;
    }

    fade(sound, startVol, endVol, duration) {
        this.fadingTracks = this.fadingTracks.filter(f => f.sound !== sound);
        
        this.fadingTracks.push({
            sound,
            startVol,
            endVol,
            startTime: performance.now() / 1000,
            duration
        });
    }

    setGlobalVolume(vol) {
        this.globalVolume = vol;
        if (this.currentTrack) {
            const isFading = this.fadingTracks.find(f => f.sound === this.currentTrack);
            if (!isFading) {
                this.currentTrack.setVolume(vol);
            } else if (isFading) {
                isFading.endVol = vol;
            }
        }
    }

    update(dt) {
        const now = performance.now() / 1000;
        for (let i = this.fadingTracks.length - 1; i >= 0; i--) {
            const fade = this.fadingTracks[i];
            const elapsed = now - fade.startTime;
            const t = Math.min(1, elapsed / fade.duration);
            const newVol = fade.startVol + (fade.endVol - fade.startVol) * t;
            fade.sound.setVolume(newVol);
            if (t >= 1) {
                if (fade.endVol === 0) fade.sound.stop();
                this.fadingTracks.splice(i, 1);
            }
        }
    }
}