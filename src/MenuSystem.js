import * as THREE from 'three';
import { ControlsMenu } from './ControlsMenu.js';

export class MenuSystem {
    constructor(assetManager, settings, highScore, inputManager, callbacks) {
        this.inputManager = inputManager;
        this.assetManager = assetManager;
        this.callbacks = callbacks;
        this.settings = settings;
        this.highScore = highScore;
        this.container = document.createElement('div');
        this.container.id = 'menu-system';
        
        const style = document.createElement('style');
        style.textContent = `
            #menu-system { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; flex-direction: column; justify-content: center; align-items: center; pointer-events: auto; font-family: 'GameFont', sans-serif; z-index: 10; }
            .glass-panel { background: rgba(0, 20, 40, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(0, 255, 255, 0.2); width: 80%; max-width: 600px; }
            .glass-panel-right { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 300px; background: rgba(0, 20, 40, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 15px; padding: 20px; display: none; flex-direction: column; gap: 20px; }
            .tabs { display: flex; justify-content: space-around; margin-bottom: 20px; border-bottom: 2px solid rgba(0, 255, 255, 0.3); }
            .tab-btn { background: transparent; border: none; color: #008888; font-family: inherit; font-size: 1.2rem; padding: 10px; cursor: pointer; transition: all 0.3s; }
            .tab-btn.active { color: #00ffff; text-shadow: 0 0 10px #00ffff; border-bottom: 2px solid #00ffff; }
            .tab-content { display: none; flex-direction: column; gap: 15px; align-items: center; }
            .tab-content.active { display: flex; }
            .menu-btn { background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; color: #00ffff; padding: 15px 40px; font-size: 1.5rem; cursor: pointer; font-family: inherit; transition: all 0.2s; width: 100%; text-align: center; }
            .menu-btn:hover { background: #00ffff; color: #000; box-shadow: 0 0 15px #00ffff; }
            .setting-row { display: flex; justify-content: space-between; width: 100%; align-items: center; color: #00ffff; }
            input[type=range] { width: 50%; accent-color: #00ffff; }
            .credits-list { height: 200px; overflow-y: auto; text-align: center; color: #fff; width: 100%; }
            .credits-list div { margin: 10px 0; }
            h2 { color: #00ffff; margin: 0 0 15px 0; text-shadow: 0 0 5px #00ffff; }
            .color-palette { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
            .color-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; transition: transform 0.2s; }
            .color-btn:hover { transform: scale(1.2); }
            .stat-row { color: #fff; font-size: 0.9rem; margin-bottom: 5px; }
            .stat-bar { width: 100%; height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; overflow: hidden; }
            .stat-fill { height: 100%; background: #00ffff; width: 0%; transition: width 1s ease-out; }
            #deploy-btn { background: #00ffff; color: #000; border: none; padding: 15px; font-size: 1.5rem; font-weight: bold; cursor: pointer; margin-top: 20px; border-radius: 5px; box-shadow: 0 0 15px #00ffff; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { box-shadow: 0 0 15px #00ffff; } 50% { box-shadow: 0 0 25px #00ffff; } 100% { box-shadow: 0 0 15px #00ffff; } }
            .controls-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; margin-bottom: 10px; font-weight: bold; color: #00ffff; border-bottom: 1px solid #00ffff; padding-bottom: 5px; }
            .control-row { display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; align-items: center; margin-bottom: 10px; color: #fff; }
            .bind-btn { background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; color: #fff; padding: 5px 10px; cursor: pointer; font-family: inherit; }
            .bind-btn:hover { background: rgba(0, 255, 255, 0.3); }
            .bind-btn.binding { background: #ff0000; color: #000; border-color: #ff0000; animation: pulse 0.5s infinite; }
        `;
        this.container.appendChild(style);

        const panel = document.createElement('div');
        panel.className = 'glass-panel';
        
        panel.innerHTML = `
            <nav class="tabs">
                <button class="tab-btn active" data-tab="play">JOUER</button>
                <button class="tab-btn" data-tab="garage">GARAGE</button>
                <button class="tab-btn" data-tab="options">OPTIONS</button>
                <button class="tab-btn" data-tab="controls">CONTROLS</button>
                <button class="tab-btn" data-tab="credits">CRÉDITS</button>
            </nav>
            <div class="content">
                <div id="tab-play" class="tab-content active">
                    <h2>NOUVELLE PARTIE</h2>
                    <h3 style="color: #00ffff; margin-bottom: 20px;">HIGH SCORE: <span id="menu-highscore">${this.highScore}</span></h3>
                    <div class="setting-row">
                        <span>DIFFICULTÉ</span>
                        <select id="difficulty-select" style="background: #000; color: #00ffff; border: 1px solid #00ffff; padding: 5px;">
                            <option value="easy">FACILE</option>
                            <option value="medium" selected>MOYEN</option>
                            <option value="hard">DIFFICILE</option>
                        </select>
                    </div>
                    <button id="menu-start-btn" class="menu-btn">START GAME</button>
                </div>
                <div id="tab-garage" class="tab-content">
                    <!-- Content moved to side panel -->
                </div>
                <div id="tab-options" class="tab-content">
                    <h2>PARAMÈTRES</h2>
                    <div class="setting-row">
                        <span>MUSIQUE</span>
                        <input type="range" id="music-vol" min="0" max="1" step="0.1" value="0.5">
                    </div>
                    <div class="setting-row">
                        <span>EFFETS SONORES</span>
                        <input type="range" id="sfx-vol" min="0" max="1" step="0.1" value="0.5">
                    </div>
                    <div class="setting-row">
                        <span>POST-PROCESSING</span>
                        <input type="checkbox" id="pp-toggle" checked>
                    </div>
                    <div class="setting-row">
                        <span>QUALITÉ</span>
                        <select id="quality-select" style="background: #000; color: #00ffff; border: 1px solid #00ffff; padding: 5px;">
                            <option value="low">LOW</option>
                            <option value="medium">MEDIUM</option>
                            <option value="high">HIGH</option>
                        </select>
                    </div>
                </div>
                <div id="tab-controls" class="tab-content">
                    <!-- ControlsMenu injected here -->
                </div>
                <div id="tab-credits" class="tab-content">
                    <h2>CRÉDITS</h2>
                    <div class="credits-list">
                        <div>LEAD DEV: TOI</div>
                        <div>DESIGN: TRON LEGACY</div>
                        <div>MUSIC: SYNTHWAVE MIX</div>
                        <div>ENGINE: THREE.JS</div>
                    </div>
                </div>
            </div>
        `;
        this.container.appendChild(panel);

        const customizePanel = document.createElement('div');
        customizePanel.id = 'customize-panel';
        customizePanel.className = 'glass-panel-right';
        customizePanel.innerHTML = `
            <h2>CUSTOMIZE</h2>
            
            <div class="stat-row">CHASSIS COLOR</div>
            <div class="color-palette" id="chassis-palette"></div>
            
            <div class="stat-row" style="margin-top: 15px;">NEON GLOW</div>
            <div class="color-palette" id="neon-palette"></div>

            <div style="margin-top: 20px;">
                <div class="stat-row">SPEED</div>
                <div class="stat-bar"><div class="stat-fill" style="width: 85%"></div></div>
            </div>
            <div>
                <div class="stat-row">HANDLING</div>
                <div class="stat-bar"><div class="stat-fill" style="width: 70%"></div></div>
            </div>
            <div>
                <div class="stat-row">ACCELERATION</div>
                <div class="stat-bar"><div class="stat-fill" style="width: 90%"></div></div>
            </div>

            <button id="deploy-btn">DEPLOY</button>
        `;
        this.container.appendChild(customizePanel);

        const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffa500', '#ffffff', '#800080'];
        this.createPalette(customizePanel.querySelector('#chassis-palette'), colors, 'chassis');
        this.createPalette(customizePanel.querySelector('#neon-palette'), colors, 'neon');


        document.body.appendChild(this.container);

        this.hoverSound = new THREE.Audio(new THREE.AudioListener());
        this.hoverSound.setBuffer(this.assetManager.get('ui_hover'));
        this.hoverSound.setVolume(0.5);

        this.clickSound = new THREE.Audio(new THREE.AudioListener());
        this.clickSound.setBuffer(this.assetManager.get('ui_click'));
        this.clickSound.setVolume(0.5);

        // Apply initial settings to UI
        this.container.querySelector('#difficulty-select').value = this.settings.difficulty;
        this.container.querySelector('#music-vol').value = this.settings.musicVolume;
        this.container.querySelector('#sfx-vol').value = this.settings.sfxVolume;
        this.container.querySelector('#pp-toggle').checked = this.settings.postProcessing;
        this.container.querySelector('#quality-select').value = this.settings.quality === 'auto' ? 'medium' : this.settings.quality;

        // Init Controls Menu
        new ControlsMenu(this.container.querySelector('#tab-controls'), this.inputManager);

        this.setupEvents();
    }

    createPalette(container, colors, type) {
        colors.forEach(color => {
            const btn = document.createElement('div');
            btn.className = 'color-btn';
            btn.style.backgroundColor = color;
            btn.dataset.color = color;
            btn.dataset.type = type;
            container.appendChild(btn);
        });
    }

    setupEvents() {
        const tabs = this.container.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('mouseenter', () => this.playSound(this.hoverSound));
            btn.addEventListener('click', () => {
                this.playSound(this.clickSound);
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.container.querySelector(`#tab-${btn.dataset.tab}`).classList.add('active');
                
                const customizePanel = this.container.querySelector('#customize-panel');
                if (btn.dataset.tab === 'garage') {
                    customizePanel.style.display = 'flex';
                } else {
                    customizePanel.style.display = 'none';
                }

                if (this.callbacks.onTabChange) {
                    this.callbacks.onTabChange(btn.dataset.tab);
                }
            });
        });

        const startBtn = this.container.querySelector('#menu-start-btn');
        startBtn.addEventListener('mouseenter', () => this.playSound(this.hoverSound));
        startBtn.addEventListener('click', () => {
            this.playSound(this.clickSound);
            const diff = this.container.querySelector('#difficulty-select').value;
            this.callbacks.onStart(diff);
        });

        this.container.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.playSound(this.clickSound);
                if (btn.dataset.type === 'chassis') {
                    this.callbacks.onChassisChange(btn.dataset.color);
                } else {
                    this.callbacks.onNeonChange(btn.dataset.color);
                }
            });
        });

        this.container.querySelector('#deploy-btn').addEventListener('click', () => {
            this.callbacks.onDeploy();
        });

        this.container.querySelector('#music-vol').addEventListener('input', (e) => {
            this.callbacks.onMusicVolume(parseFloat(e.target.value));
        });

        this.container.querySelector('#sfx-vol').addEventListener('input', (e) => {
            this.callbacks.onSFXVolume(parseFloat(e.target.value));
        });

        this.container.querySelector('#pp-toggle').addEventListener('change', (e) => {
            this.callbacks.onPostProcess(e.target.checked);
        });

        this.container.querySelector('#quality-select').addEventListener('change', (e) => {
            this.callbacks.onQualityChange(e.target.value);
        });
    }

    playSound(sound) {
        if (sound.isPlaying) sound.stop();
        sound.play();
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

    updateHighScore(score) {
        this.highScore = score;
        this.container.querySelector('#menu-highscore').textContent = score;
    }
}