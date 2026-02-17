import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

export class AssetManager {
    constructor() {
        this.manager = new THREE.LoadingManager();
        this.assets = new Map();
        this.objLoader = new OBJLoader(this.manager);
        this.fontLoader = new FontLoader(this.manager);
        this.audioLoader = new THREE.AudioLoader(this.manager);
        this.musicUrls = {
            'menu': './assets/songs/menu_theme.mp3',
            'game': './assets/songs/game_theme.mp3',
            'gameover': './assets/songs/gameover_theme.mp3'
        };
    }

    loadStarterAssets() {
        const loadAudioSafe = (path, name) => {
            this.audioLoader.load(path, (buffer) => {
                console.warn(`Audio Loaded: ${name}`);
                this.assets.set(name, buffer);
            }, undefined, (err) => {
                console.error(`MISSING AUDIO ASSET: ${name}`, err);
                throw new Error(`MISSING AUDIO ASSET: ${name}`);
            });
        };

        this.objLoader.load('./assets/obj/lightcycle-low.obj', (object) => {
            this.assets.set('lightcycle', object);
        });

        this.fontLoader.load('./assets/fonts/main_font.json', (font) => {
            this.assets.set('mainFont', font);
        });

        loadAudioSafe('./assets/sounds/turn.wav', 'turn');
        loadAudioSafe('./assets/sounds/engine.wav', 'engine');
        loadAudioSafe('./assets/sounds/crash.wav', 'crash');
        loadAudioSafe('./assets/sounds/ui_hover.wav', 'ui_hover');
        loadAudioSafe('./assets/sounds/ui_click.wav', 'ui_click');
        loadAudioSafe('./assets/sounds/boost_loop.wav', 'boost_loop');
        loadAudioSafe('./assets/sounds/wind.wav', 'wind');

        this.loadVideo('bgLoop', 'bg_loop.mp4');
        this.loadVideo('staticNoise', 'static_noise.mp4');
    }

    loadVideo(name, filename) {
        const video = document.createElement('video');
        video.src = `./assets/videos/${filename}`;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        this.assets.set(name, video);
    }

    get(name) {
        return this.assets.get(name);
    }
}