import * as THREE from 'three';
import { Player } from './Player.js';
import { Bot } from './Bot.js'; // Assure-toi d'importer Bot et non SmartBot si ton fichier s'appelle Bot.js

export class GameManager {
    constructor(scene, camera, assetManager, listener, inputManager, musicController, uiElements, callbacks) {
        this.scene = scene;
        this.camera = camera;
        this.assetManager = assetManager;
        this.listener = listener;
        this.inputManager = inputManager;
        this.musicController = musicController;
        this.ui = uiElements; // { score, countdown, boostBar, boostBarContainer, brake }
        this.callbacks = callbacks; // { onGameOver, onShake, explosionSystem }

        this.grid = new Set();
        this.player = null;
        this.bot = null;

        // États possibles : 'IDLE', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.state = 'IDLE';
        
        this.score = 0;
        this.gameTime = 0;
        this.countdownTimer = 0;
        this.maxSpeed = 0;

        this.createPauseOverlay();
    }

    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:none;justify-content:center;align-items:center;color:#00ffff;font-size:4rem;font-weight:bold;text-shadow:0 0 20px #00ffff;z-index:100;font-family:"GameFont", sans-serif;';
        this.pauseOverlay.textContent = 'PAUSED';
        document.body.appendChild(this.pauseOverlay);
    }

    start(difficulty, settings) {
        // --- START ---
        this.reset();

        // 1. Instanciation du Joueur (Gauche)
        this.player = new Player(
            this.assetManager,
            this.listener,
            this.grid,
            this.callbacks.explosionSystem,
            settings.chassisColor,
            settings.neonColor,
            this.inputManager
        );
        this.player.addTo(this.scene);
        // POSITIONNEMENT SUR LA LIGNE DE DÉPART (Gauche)
        this.player.setPosition(-10, 80); 
        
        // Audio
        this.player.turnSound.setVolume(settings.sfxVolume);
        this.player.engineSound.setVolume(settings.sfxVolume * 0.6);
        this.player.crashSound.setVolume(settings.sfxVolume);

        // 2. Instanciation du Bot (Droite)
        this.bot = new Bot(
            this.assetManager,
            this.listener,
            this.grid,
            this.callbacks.explosionSystem,
            this.scene
        );
        this.bot.addTo(this.scene);
        // POSITIONNEMENT SUR LA LIGNE DE DÉPART (Droite)
        this.bot.setPosition(10, 80);

        // Difficulté
        let botSpeed = 20;
        if (difficulty === 'easy') botSpeed = 18;
        if (difficulty === 'medium') botSpeed = 22;
        if (difficulty === 'hard') botSpeed = 26;
        this.bot.baseSpeed = botSpeed;
        this.bot.speed = botSpeed;

        // 3. Init Variables
        this.state = 'COUNTDOWN';
        this.countdownTimer = 3;
        this.score = 0;
        this.gameTime = 0;
        this.maxSpeed = 0;

        // UI Reset
        this.ui.score.textContent = 'SCORE: 0';
        this.ui.countdown.style.display = 'block';
        this.ui.countdown.textContent = '3';
        this.ui.boostBarContainer.style.display = 'none';
        if(this.ui.brake) this.ui.brake.style.display = 'none';

        this.musicController.play('game');
    }

    update(dt) {
        // Pause Toggle
        if (this.inputManager.isActionJustPressed('PAUSE') && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
            this.togglePause();
        }

        if (this.state === 'PAUSED') return;

        // --- UPDATE ---
        
        if (this.state === 'COUNTDOWN') {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) {
                this.state = 'PLAYING';
                this.ui.countdown.style.display = 'none';
                this.ui.boostBarContainer.style.display = 'block';
            } else {
                const ceil = Math.ceil(this.countdownTimer);
                this.ui.countdown.textContent = ceil > 0 ? ceil : 'GO!';
            }
        } else if (this.state === 'PLAYING') {
            
            // JOUEUR
            if (this.player) {
                this.player.update(dt);
                if (this.player.speed > this.maxSpeed) this.maxSpeed = this.player.speed;

                // UI Boost
                if (this.ui.boostBar) {
                    this.ui.boostBar.style.width = `${Math.max(0, this.player.boostEnergy)}%`;
                    this.ui.boostBar.style.backgroundColor = (this.player.boostEnergy <= 0) ? '#ff0000' : '#00ffff';
                }
                // UI Brake
                if (this.ui.brake) {
                    this.ui.brake.style.display = this.player.isBraking ? 'block' : 'none';
                }

                // Shake
                if (this.player.isBoosting) this.callbacks.onShake(0.1);

                // CONDITION DÉFAITE (Joueur meurt)
                if (this.player.isDead) {
                    this.triggerGameOver(false); // false = Defeat
                }
            }

            // BOT
            if (this.bot) {
                this.bot.update(dt);
                
                // CONDITION VICTOIRE (Bot meurt)
                if (this.bot.isDead && !this.player.isDead) {
                    this.score += 1000; // Bonus Win
                    this.triggerGameOver(true); // true = Victory
                }
            }

            // SCORE
            if (!this.player.isDead && this.state === 'PLAYING') {
                this.score += dt * 10;
                this.ui.score.textContent = `SCORE: ${Math.floor(this.score)}`;
                this.gameTime += dt;
            }

        } else if (this.state === 'GAMEOVER') {
            // Update pour particules/animations restantes
            if (this.player) this.player.update(dt);
            if (this.bot) this.bot.update(dt);
        }
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pauseOverlay.style.display = 'flex';
            if (this.player && this.player.engineSound.isPlaying) this.player.engineSound.pause();
            if (this.bot && this.bot.engineSound.isPlaying) this.bot.engineSound.pause();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.pauseOverlay.style.display = 'none';
            if (this.player && !this.player.engineSound.isPlaying) this.player.engineSound.play();
            if (this.bot && !this.bot.engineSound.isPlaying) this.bot.engineSound.play();
        }
    }

    triggerGameOver(isVictory) {
        if (this.state === 'GAMEOVER') return;
        this.state = 'GAMEOVER';
        
        if (this.ui.boostBarContainer) this.ui.boostBarContainer.style.display = 'none';
        if (this.ui.brake) this.ui.brake.style.display = 'none';
        
        // Stop sounds
        if (this.bot) this.bot.engineSound.stop();
        if (this.player) this.player.engineSound.stop();
        
        this.musicController.play('gameover');
        
        // Callback vers main.js avec statut victoire
        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.score, this.gameTime, this.maxSpeed, isVictory);
        }
    }

    reset() {
        if (this.player) {
            this.player.dispose(this.scene);
            this.player = null;
        }
        if (this.bot) {
            this.bot.dispose(this.scene);
            this.bot = null;
        }
        this.grid.clear();
        this.pauseOverlay.style.display = 'none';
        this.state = 'IDLE';
    }
}