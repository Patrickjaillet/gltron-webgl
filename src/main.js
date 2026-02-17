import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { AssetManager } from './AssetManager.js';
import { ExplosionSystem } from './ExplosionSystem.js';
import { IntroManager } from './IntroManager.js';
import { MenuSystem } from './MenuSystem.js';
import { GameOverScreen } from './GameOverScreen.js';
import { SaveManager } from './SaveManager.js';
import { QualityManager } from './QualityManager.js';
import { GarageScene } from './GarageScene.js';
import { MusicController } from './MusicController.js';
import { InputManager } from './InputManager.js';
import { Environment } from './Environment.js';
import { GameManager } from './GameManager.js';

// --- UI & STYLES ---
const style = document.createElement('style');
style.textContent = `
    @font-face { font-family: 'GameFont'; src: url('./assets/fonts/main_font.ttf'); }
    body { margin: 0; overflow: hidden; font-family: 'GameFont', sans-serif; user-select: none; -webkit-user-select: none; background: #000; }
    #ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
    #score { position: absolute; top: calc(20px + env(safe-area-inset-top)); width: 100%; text-align: center; color: #00ffff; font-size: 24px; text-shadow: 0 0 5px #00ffff; }
    #countdown { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #00ffff; font-size: 80px; font-weight: bold; text-shadow: 0 0 20px #00ffff; display: none; pointer-events: none; }
    #boost-bar-container { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); width: 200px; height: 10px; border: 1px solid #00ffff; border-radius: 5px; overflow: hidden; display: none; }
    #boost-bar { width: 100%; height: 100%; background: #00ffff; transition: width 0.1s; }
    #brake-indicator { position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); color: #ff0000; font-size: 24px; font-weight: bold; text-shadow: 0 0 10px #ff0000; display: none; border: 2px solid #ff0000; padding: 5px 15px; border-radius: 5px; background: rgba(255, 0, 0, 0.2); letter-spacing: 2px; }
`;
document.head.appendChild(style);

const ui = document.createElement('div');
ui.id = 'ui';
ui.innerHTML = `
    <div id="score">SCORE: 0</div>
    <div id="countdown">3</div>
    <div id="boost-bar-container"><div id="boost-bar"></div></div>
    <div id="brake-indicator">BRAKE</div>
`;
document.body.appendChild(ui);

// --- LOADING SCREEN ---
const loadingScreen = document.createElement('div');
loadingScreen.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;color:#00ffff;display:flex;justify-content:center;align-items:center;font-size:2rem;font-family:"GameFont",sans-serif;z-index:9999;';
loadingScreen.textContent = 'LOADING SYSTEM...';
document.body.appendChild(loadingScreen);

// --- ASSET LOADING ---
const assetManager = new AssetManager();
assetManager.manager.onLoad = () => {
    loadingScreen.style.display = 'none';
    init();
};
assetManager.loadStarterAssets();

// --- INITIALIZATION ---
function init() {
    // 1. SETUP (SCENE, CAMERA, RENDERER)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // 2. ENVIRONMENT & GRAPHICS
    const environment = new Environment(scene, assetManager);

    // Post-Processing
    const renderScene = new RenderPass(scene, camera);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.3;

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.002;

    const glitchPass = new GlitchPass();
    glitchPass.enabled = false;
    glitchPass.goWild = true;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(rgbShiftPass);
    composer.addPass(glitchPass);

    // 3. SYSTEMS (AUDIO, INPUT, SAVE)
    const listener = new THREE.AudioListener();
    camera.add(listener);
    scene.add(camera);
    listener.setMasterVolume(1);

    // Ambiance Sonore
    if (assetManager.get('wind')) {
        const windSound = new THREE.Audio(listener);
        windSound.setBuffer(assetManager.get('wind'));
        windSound.setLoop(true);
        windSound.setVolume(0.15);
        windSound.play();
    }

    const saveManager = new SaveManager();
    const settings = saveManager.getSettings();
    const inputManager = new InputManager();
    const musicController = new MusicController(assetManager.musicUrls, settings.musicVolume);
    const explosionSystem = new ExplosionSystem(scene);

    // Quality Settings
    const qualityManager = new QualityManager(renderer, composer, scene, bloomPass);
    let currentQuality = settings.quality === 'auto' ? qualityManager.detectDevice() : settings.quality;
    qualityManager.setQuality(currentQuality);
    settings.quality = currentQuality;

    // Apply initial settings
    bloomPass.enabled = settings.postProcessing;
    rgbShiftPass.enabled = settings.postProcessing;

    // 4. GAME LOGIC
    const uiElements = {
        score: document.getElementById('score'),
        countdown: document.getElementById('countdown'),
        boostBar: document.getElementById('boost-bar'),
        boostBarContainer: document.getElementById('boost-bar-container'),
        brake: document.getElementById('brake-indicator')
    };

    // Camera Shake Logic
    let shakeIntensity = 0;
    const shakeCamera = (intensity) => { shakeIntensity = intensity; };

    // Game State
    const STATE = { MENU: 0, GAME: 1, GAMEOVER: 2, GARAGE: 3 };
    let currentState = STATE.MENU;
    let timeScale = 1.0;
    let gameOverTimer = 0;

    // Garage Scene (Menu Background)
    const garageScene = new GarageScene(scene, camera, renderer, assetManager, settings.chassisColor, settings.neonColor);

    // --- LOGIQUE DE FIN DE PARTIE ---
    const endGame = (isVictory) => {
        shakeCamera(1.0);
        glitchPass.enabled = true;
        glitchPass.goWild = !isVictory; // Glitch violent si défaite, léger si victoire

        currentState = STATE.GAMEOVER;
        timeScale = 0.1;
        gameOverTimer = 0;

        // Feedback Visuel Immédiat (Overlay)
        const countdownEl = document.getElementById('countdown');
        countdownEl.style.display = 'block';
        countdownEl.textContent = isVictory ? "VICTORY" : "CRASHED";
        countdownEl.style.color = isVictory ? "#00ff00" : "#ff0000";
        countdownEl.style.textShadow = isVictory ? "0 0 20px #00ff00" : "0 0 20px #ff0000";

        // Sauvegarde HighScore (Uniquement si victoire)
        if (isVictory) {
            if (saveManager.setHighScore(Math.floor(gameManager.score))) {
                menuSystem.updateHighScore(saveManager.getHighScore());
            }
        }

        // Préparation des données pour l'écran de fin
        gameOverScreen.data = { 
            score: gameManager.score, 
            time: gameManager.gameTime, 
            maxSpeed: gameManager.maxSpeed 
        };

        // Arrêt des sons
        if (gameManager.player) gameManager.player.engineSound.stop();
        if (gameManager.bot) gameManager.bot.engineSound.stop();
    };

    // Game Manager
    const gameManager = new GameManager(
        scene, camera, assetManager, listener, inputManager, musicController, uiElements,
        {
            explosionSystem: explosionSystem,
            onShake: shakeCamera,
            onGameOver: (score, time, maxSpeed) => {
                // Callback déclenché par GameManager quand le JOUEUR meurt
                endGame(false);
            }
        }
    );

    // 5. INTERFACE (MENU, GAMEOVER)
    const menuSystem = new MenuSystem(assetManager, settings, saveManager.getHighScore(), inputManager, {
        onStart: (difficulty) => {
            saveManager.setSetting('difficulty', difficulty);
            currentState = STATE.GAME;
            timeScale = 1.0;
            glitchPass.enabled = false;
            camera.fov = 75;
            camera.updateProjectionMatrix();
            shakeIntensity = 0;
            menuSystem.hide();
            garageScene.exit();
            if (listener.context.state === 'suspended') listener.context.resume();
            gameManager.start(difficulty, {
                chassisColor: settings.chassisColor,
                neonColor: settings.neonColor,
                sfxVolume: settings.sfxVolume
            });
        },
        onChassisChange: (color) => {
            settings.chassisColor = color;
            saveManager.setSetting('chassisColor', color);
            garageScene.setChassisColor(color);
        },
        onNeonChange: (color) => {
            settings.neonColor = color;
            saveManager.setSetting('neonColor', color);
            garageScene.setNeonColor(color);
        },
        onMusicVolume: (vol) => {
            musicController.setVolume(vol);
            saveManager.setSetting('musicVolume', vol);
        },
        onSFXVolume: (vol) => {
            settings.sfxVolume = vol;
            saveManager.setSetting('sfxVolume', vol);
            if (gameManager.player) {
                gameManager.player.turnSound.setVolume(vol);
                gameManager.player.engineSound.setVolume(vol * 0.6);
                gameManager.player.crashSound.setVolume(vol);
            }
        },
        onPostProcess: (enabled) => {
            bloomPass.enabled = enabled;
            rgbShiftPass.enabled = enabled;
            if (!enabled) glitchPass.enabled = false;
            saveManager.setSetting('postProcessing', enabled);
        },
        onQualityChange: (quality) => {
            qualityManager.setQuality(quality);
            saveManager.setSetting('quality', quality);
        },
        onTabChange: (tab) => {
            if (tab === 'garage') {
                currentState = STATE.GARAGE;
                garageScene.enter();
                environment.setVisible(false);
            } else if (currentState === STATE.GARAGE) {
                currentState = STATE.MENU;
                garageScene.exit();
                environment.setVisible(true);
            }
        },
        onDeploy: () => {
            menuSystem.callbacks.onStart(settings.difficulty);
        }
    });

    const gameOverScreen = new GameOverScreen(assetManager, {
        onRetry: () => menuSystem.callbacks.onStart(settings.difficulty),
        onMenu: () => {
            menuSystem.show();
            musicController.play('menu');
            currentState = STATE.MENU;
            environment.setVisible(true);
            gameManager.reset();
        }
    });

    // Intro
    new IntroManager(() => menuSystem.show(), () => {
        if (listener.context.state === 'suspended') listener.context.resume();
        musicController.play('menu');
    });

    // 6. EVENTS
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (listener.context.state === 'running') listener.context.suspend();
            clock.stop();
        } else {
            if (listener.context.state === 'suspended') listener.context.resume();
            clock.start();
        }
    });

    // 7. RENDER LOOP
    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        const time = clock.getElapsedTime();
        
        inputManager.update();

        // State Machine
        if (currentState === STATE.MENU) {
            // Camera Orbit
            const radius = 30;
            const speed = 0.2;
            camera.position.x = radius * Math.cos(time * speed);
            camera.position.z = radius * Math.sin(time * speed);
            camera.position.y = 15;
            camera.lookAt(0, 0, 0);
            
            explosionSystem.update(dt);

        } else if (currentState === STATE.GARAGE) {
            garageScene.update();

        } else if (currentState === STATE.GAME) {
            // Camera Follow
            if (gameManager.player && gameManager.player.mesh) {
                const dist = 10;
                const height = 6;
                const targetPos = gameManager.player.mesh.position.clone().sub(gameManager.player.direction.clone().multiplyScalar(dist));
                targetPos.y += height;
                camera.position.lerp(targetPos, dt * 3);
                camera.lookAt(gameManager.player.mesh.position);
                
                // Dynamic FOV
                const targetFov = 75 + (gameManager.player.speed - 20) * 1.5;
                camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 2);
                camera.updateProjectionMatrix();
            }

            gameManager.update(dt);
            explosionSystem.update(dt);

            // --- WIN CONDITION (Si le Bot meurt et que le joueur est vivant) ---
            if (gameManager.bot && gameManager.bot.isDead && !gameManager.player.isDead) {
                endGame(true);
            }

        } else if (currentState === STATE.GAMEOVER) {
            const slowDt = dt * timeScale;
            gameManager.update(slowDt);
            explosionSystem.update(slowDt);
            
            gameOverTimer += dt;
            if (gameOverTimer > 1.0 && glitchPass.enabled) {
                glitchPass.enabled = false;
                document.getElementById('countdown').style.display = 'none'; // Cacher l'overlay "VICTORY/CRASHED"
                if (gameOverScreen.data) {
                    gameOverScreen.show(gameOverScreen.data.score, gameOverScreen.data.time, gameOverScreen.data.maxSpeed);
                }
            }
        }

        // Camera Shake
        if (shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * shakeIntensity;
            const ry = (Math.random() - 0.5) * shakeIntensity;
            camera.position.x += rx;
            camera.position.y += ry;
            shakeIntensity -= dt;
            if (shakeIntensity < 0) shakeIntensity = 0;
        }

        composer.render();
    });
}
