import * as THREE from 'three';
import { LightWall } from './LightWall.js';

export class Player {
    constructor(assetManager, listener, grid, explosionSystem, chassisColor = 0x00ffff, neonColor = 0x00ffff, inputManager = null) {
        this.grid = grid;
        this.explosionSystem = explosionSystem;
        this.inputManager = inputManager; // Peut être null (pour les Bots)
        
        // Setup Mesh
        const originalMesh = assetManager.get('lightcycle');
        if (!originalMesh) console.error("CRITICAL: Lightcycle OBJ not loaded via AssetManager");
        this.mesh = originalMesh ? originalMesh.clone() : new THREE.Mesh(new THREE.BoxGeometry(1,1,2), new THREE.MeshBasicMaterial({color:0xff0000}));
        
        this.material = new THREE.MeshPhongMaterial({
            color: chassisColor,
            emissive: neonColor,
            emissiveIntensity: 0.5
        });

        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.material = this.material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.mesh.scale.set(0.5, 0.5, 0.5);
        this.mesh.rotation.y = Math.PI; // Face au Nord (Z negatif)
        
        // --- LUMIÈRE LOCALE (PointLight) ---
        // Suit la moto pour éclairer le sol miroir juste en dessous
        this.pointLight = new THREE.PointLight(neonColor, 2, 20);
        this.pointLight.position.set(0, 2, 0);
        this.mesh.add(this.pointLight);

        // Physique
        this.baseSpeed = 20;
        this.turboSpeed = 30;
        this.brakeSpeed = 10;
        this.speed = this.baseSpeed;
        
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.isBraking = false;
        
        this.originalNeon = new THREE.Color(neonColor);

        // Direction (Vecteurs stricts pour la grille)
        this.dirX = 0;
        this.dirZ = -1; 
        this.direction = new THREE.Vector3(0, 0, -1);

        this.lightWall = null;
        this.isDead = false;

        // Input Buffer (Pour la tolérance de virage)
        this.turnBuffer = { action: null, time: 0 };
        this.BUFFER_DURATION = 150; // ms

        // Audio
        this.setupAudio(listener, assetManager);
    }

    setupAudio(listener, assetManager) {
        this.turnSound = new THREE.Audio(listener);
        this.turnSound.setBuffer(assetManager.get('turn'));
        this.turnSound.setVolume(0.5);

        this.engineSound = new THREE.Audio(listener);
        this.engineSound.setBuffer(assetManager.get('engine'));
        this.engineSound.setLoop(true);
        this.engineSound.setVolume(0.3);
        
        this.crashSound = new THREE.Audio(listener);
        this.crashSound.setBuffer(assetManager.get('crash'));
        this.crashSound.setVolume(0.5);

        this.boostSound = new THREE.Audio(listener);
        this.boostSound.setBuffer(assetManager.get('boost_loop'));
        this.boostSound.setLoop(true);
        this.boostSound.setVolume(0.5);
    }

    addTo(scene) {
        scene.add(this.mesh);
        this.lightWall = new LightWall(scene);
        this.lightWall.startSegment(this.mesh.position, this.direction);
        if(this.engineSound.buffer) this.engineSound.play();
    }

    // --- NOUVELLE MÉTHODE AJOUTÉE (Celle qui manquait) ---
    setPosition(x, z) {
        this.mesh.position.set(x, 0, z);
        this.mesh.rotation.y = Math.PI; // Force orientation Nord
        this.direction.set(0, 0, -1);   // Force vecteur Nord
        this.dirX = 0;
        this.dirZ = -1;
        
        // Réinitialise le mur de lumière à la nouvelle position
        if (this.lightWall) {
            this.lightWall.dispose(); // Nettoie l'ancien
            this.lightWall.startSegment(this.mesh.position, this.direction);
        }
    }

    handleInput() {
        if (!this.inputManager) return;

        // 1. Lire les Inputs et remplir le Buffer
        if (this.inputManager.isActionJustPressed('LEFT')) {
            this.turnBuffer = { action: 'LEFT', time: Date.now() };
        }
        if (this.inputManager.isActionJustPressed('RIGHT')) {
            this.turnBuffer = { action: 'RIGHT', time: Date.now() };
        }

        // 2. Gestion des États (Turbo / Frein)
        this.isBoosting = this.inputManager.isActionActive('TURBO');
        this.isBraking = this.inputManager.isActionActive('BRAKE');
    }

    update(dt) {
        if (this.isDead) return;

        // 1. Récupérer les intentions (Humain ou Bot)
        this.handleInput();

        // 2. Tenter d'exécuter le virage en attente (Buffer)
        if (this.turnBuffer.action) {
            // Expiration du buffer
            if (Date.now() - this.turnBuffer.time > this.BUFFER_DURATION) {
                this.turnBuffer.action = null;
            } else {
                // Essayer de tourner (repecte la grille)
                if (this.tryTurn(this.turnBuffer.action)) {
                    this.turnBuffer.action = null; // Consommé
                }
            }
        }

        // 3. Logique de Boost & Physique
        this.updatePhysics(dt);

        // 4. Mouvement
        this.move(dt);

        // 5. Collisions
        this.checkCollisions();

        // 6. Mise à jour visuelle du mur
        if (this.lightWall) {
            this.lightWall.update(this.mesh.position);
        }
    }

    updatePhysics(dt) {
        // --- CALCUL DE VITESSE ET CONSOMMATION DE BOOST ---
        
        // Cas 1 : Turbo activé (Espace) ET énergie disponible
        if (this.isBoosting && this.boostEnergy > 0) {
            this.boostEnergy -= dt * 30;
            this.speed = this.turboSpeed; 
            
            if (!this.boostSound.isPlaying) this.boostSound.play();
            this.engineSound.setPlaybackRate(1.5);
            
            if (this.lightWall) {
                this.lightWall.material.emissiveIntensity = 2.0;
            }
        } 
        // Cas 2 : Freinage activé (Flèche Bas)
        else if (this.isBraking) {
            this.speed = this.brakeSpeed; 
            this.isBoosting = false;
            if (this.boostSound.isPlaying) this.boostSound.stop();
            this.engineSound.setPlaybackRate(0.8); 
            
            if (this.lightWall) {
                this.lightWall.material.emissiveIntensity = 0.5;
            }
        }
        // Cas 3 : Vitesse Normale
        else {
            this.speed = this.baseSpeed;
            this.isBoosting = false;
            if (this.boostSound.isPlaying) this.boostSound.stop();
            this.engineSound.setPlaybackRate(1.0);
            
            if (this.lightWall) {
                this.lightWall.material.emissiveIntensity = 0.5;
            }
        }
    }

    move(dt) {
        this.mesh.position.x += this.dirX * this.speed * dt;
        this.mesh.position.z += this.dirZ * this.speed * dt;
        this.direction.set(this.dirX, 0, this.dirZ);
    }

    checkCollisions() {
        const x = Math.round(this.mesh.position.x);
        const z = Math.round(this.mesh.position.z);

        // Limites du monde (Arène de 200x200)
        if (Math.abs(x) > 100 || Math.abs(z) > 100) {
            this.die();
            return;
        }

        // Collision Grille (Murs)
        const currentKey = `${x},${z}`;
        
        if (this.lastKey !== currentKey) {
            if (this.grid.has(currentKey)) {
                this.die();
                return;
            }
            this.grid.add(currentKey);
            this.lastKey = currentKey;
        }
    }

    tryTurn(action) {
        let newDirX = 0;
        let newDirZ = 0;
        let newRot = 0;

        if (action === 'LEFT') {
            if (this.dirZ === -1) { newDirX = -1; newDirZ = 0; newRot = -Math.PI / 2; }
            else if (this.dirZ === 1) { newDirX = 1; newDirZ = 0; newRot = Math.PI / 2; }
            else if (this.dirX === -1) { newDirZ = 1; newDirX = 0; newRot = 0; }
            else if (this.dirX === 1) { newDirZ = -1; newDirX = 0; newRot = Math.PI; }
        } else if (action === 'RIGHT') {
            if (this.dirZ === -1) { newDirX = 1; newDirZ = 0; newRot = Math.PI / 2; }
            else if (this.dirZ === 1) { newDirX = -1; newDirZ = 0; newRot = -Math.PI / 2; }
            else if (this.dirX === -1) { newDirZ = -1; newDirX = 0; newRot = Math.PI; }
            else if (this.dirX === 1) { newDirZ = 1; newDirX = 0; newRot = 0; }
        }

        const SNAP_TOLERANCE = 0.4;
        const distToGridX = Math.abs(this.mesh.position.x - Math.round(this.mesh.position.x));
        const distToGridZ = Math.abs(this.mesh.position.z - Math.round(this.mesh.position.z));

        let canTurn = false;
        if (this.dirZ !== 0) { 
            if (distToGridZ < SNAP_TOLERANCE) canTurn = true;
        } 
        else { 
            if (distToGridX < SNAP_TOLERANCE) canTurn = true;
        }

        if (canTurn) {
            this.mesh.position.x = Math.round(this.mesh.position.x);
            this.mesh.position.z = Math.round(this.mesh.position.z);
            
            this.dirX = newDirX;
            this.dirZ = newDirZ;
            this.mesh.rotation.y = newRot;

            if (this.lightWall) {
                this.lightWall.update(this.mesh.position);
                this.lightWall.startSegment(this.mesh.position, new THREE.Vector3(this.dirX, 0, this.dirZ));
            }

            if(this.turnSound.isPlaying) this.turnSound.stop();
            this.turnSound.play();
            
            return true;
        }
        return false;
    }

    die() {
        if(this.isDead) return;
        this.isDead = true;
        
        this.engineSound.stop();
        if(this.boostSound.isPlaying) this.boostSound.stop();
        
        if(this.crashSound.isPlaying) this.crashSound.stop();
        this.crashSound.play();

        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(500);

        this.mesh.visible = false;
        if(this.explosionSystem) this.explosionSystem.explode(this.mesh.position, this.material.emissive.getHex());
    }

    dispose(scene) {
        scene.remove(this.mesh);
        if (this.lightWall) this.lightWall.dispose();
        this.engineSound.stop();
        this.boostSound.stop();
        this.turnSound.stop();
        this.crashSound.stop();
    }
}