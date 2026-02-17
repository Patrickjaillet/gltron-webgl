import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

export class ResourceManager {
    constructor(onLoad, onProgress) {
        this.manager = new THREE.LoadingManager(onLoad, onProgress);
        this.assets = new Map();
        
        this.objLoader = new OBJLoader(this.manager);
        this.fontLoader = new FontLoader(this.manager);
        this.audioLoader = new THREE.AudioLoader(this.manager);
        this.textureLoader = new THREE.TextureLoader(this.manager);
    }

    loadOBJ(name, filename) {
        this.objLoader.load(`./assets/obj/${filename}`, (object) => {
            this.assets.set(name, object);
        });
    }

    loadFont(name, filename) {
        this.fontLoader.load(`./assets/fonts/`, (font) => {
            this.assets.set(name, font);
        });
    }

    loadAudio(name, filename, type) {
        const path = type === 'song' ? `./assets/songs/` : `./assets/sounds/`;
        this.audioLoader.load(path, (buffer) => {
            this.assets.set(name, buffer);
        });
    }

    loadVideo(name, filename) {
        const video = document.createElement('video');
        video.src = `./assets/videos/`;
        video.playsInline = true;
        video.muted = true;
        video.loop = true;
        video.preload = 'auto';
        this.assets.set(name, video);
    }

    get(name) {
        return this.assets.get(name);
    }
}
