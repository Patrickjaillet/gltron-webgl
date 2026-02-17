import * as THREE from 'three';
import { Player } from './Player.js';

export class Bot extends Player {
    constructor(assetManager, listener, grid, explosionSystem, scene) {
        super(assetManager, listener, grid, explosionSystem, 0xff0000, 0xff0000, null);
        
        this.scene = scene;
        
        // --- PROFIL DE L'IA ---
        this.baseSpeed = 22; 
        this.speed = this.baseSpeed;
        this.aggression = 0.3; // Moins agressif, plus survie
        this.reactionTime = 0.05; // Réflexes surhumains (50ms)
        this.timer = 0;

        // --- CAPTEURS ---
        this.raycasterFront = new THREE.Raycaster();
        this.raycasterLeft = new THREE.Raycaster();
        this.raycasterRight = new THREE.Raycaster();
        this.raycasterDiagL = new THREE.Raycaster();
        this.raycasterDiagR = new THREE.Raycaster();

        this.startDelay = 1.0; 
        this.target = null;
    }

    handleInput() {
        if (this.isDead) return;
        
        // Recherche de cible sécurisée (avec le fix du crash précédent)
        if (!this.target) {
            this.scene.traverse(child => {
                if (child.isMesh && child.material && child.material.color && child.material.color.getHex) {
                    if (child.material.color.getHex() === 0x00ffff) this.target = child;
                }
            });
        }
    }

    update(dt) {
        if (this.startDelay > 0) {
            this.startDelay -= dt;
            super.update(dt);
            return;
        }

        this.timer += dt;
        if (this.timer > this.reactionTime) {
            this.think();
            this.timer = 0;
        }

        super.update(dt);
    }

    think() {
        const origin = this.mesh.position.clone();
        origin.y = 1;

        // Vecteurs
        const forward = this.direction.clone();
        const left = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        const right = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        const diagL = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
        const diagR = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4);

        // Raycasting
        this.raycasterFront.set(origin, forward);
        this.raycasterLeft.set(origin, left);
        this.raycasterRight.set(origin, right);
        this.raycasterDiagL.set(origin, diagL);
        this.raycasterDiagR.set(origin, diagR);

        const obstacles = [];
        this.scene.children.forEach(c => {
            if (c.isMesh && c !== this.mesh && c.geometry.type !== 'PlaneGeometry') obstacles.push(c);
        });

        const dFront = this.getRayDistance(this.raycasterFront, obstacles);
        const dLeft = this.getRayDistance(this.raycasterLeft, obstacles);
        const dRight = this.getRayDistance(this.raycasterRight, obstacles);
        const dDiagL = this.getRayDistance(this.raycasterDiagL, obstacles);
        const dDiagR = this.getRayDistance(this.raycasterDiagR, obstacles);

        // --- SCORING (SURVIE PRIORITAIRE) ---
        let scoreLeft = dLeft;
        let scoreRight = dRight;
        
        // 1. DANGER IMMÉDIAT (Murs proches)
        // Distance critique augmentée à 25 (environ 1 sec de trajet)
        const PANIC_DIST = 25; 
        const TURN_DIST = 10;

        // Si mur devant, on doit tourner
        let urgentTurn = false;
        if (dFront < PANIC_DIST) {
            urgentTurn = true;
            this.isBraking = true; // FREINER pour avoir le temps de tourner
        } else {
            this.isBraking = false;
        }

        // Pénalités Diagonales (Ne pas tourner vers un coin coincé)
        if (dDiagL < 15) scoreLeft -= 500;
        if (dDiagR < 15) scoreRight -= 500;

        // Pénalités Latérales (Si je tourne, est-ce que je me prends un mur direct ?)
        if (dLeft < TURN_DIST) scoreLeft = -9999;
        if (dRight < TURN_DIST) scoreRight = -9999;

        // 2. BORDURES DU MONDE (World Boundaries)
        // L'arène fait 100x100, on sécurise à 85
        const SAFE_LIMIT = 85;
        const pos = this.mesh.position;
        
        // Prédiction : Si je tourne à gauche, où vais-je ?
        // (Logique simplifiée : on pénalise la direction qui mène hors map)
        if (this.dirZ === -1) { // Nord
            if (pos.x < -SAFE_LIMIT) scoreLeft -= 1000; // Ouest est mur
            if (pos.x > SAFE_LIMIT) scoreRight -= 1000; // Est est mur
        } else if (this.dirZ === 1) { // Sud
            if (pos.x > SAFE_LIMIT) scoreLeft -= 1000; // Est est mur
            if (pos.x < -SAFE_LIMIT) scoreRight -= 1000; // Ouest est mur
        } else if (this.dirX === -1) { // Ouest
            if (pos.z > SAFE_LIMIT) scoreLeft -= 1000; // Sud est mur
            if (pos.z < -SAFE_LIMIT) scoreRight -= 1000; // Nord est mur
        } else if (this.dirX === 1) { // Est
            if (pos.z < -SAFE_LIMIT) scoreLeft -= 1000; // Nord est mur
            if (pos.z > SAFE_LIMIT) scoreRight -= 1000; // Sud est mur
        }

        // Si on va droit dans le mur du fond
        if (this.isHeadingTowardsWall(SAFE_LIMIT)) {
            urgentTurn = true;
            this.isBraking = true;
        }

        // --- DÉCISION ---
        if (urgentTurn) {
            // Choix de survie pure
            if (scoreLeft > scoreRight && scoreLeft > 0) {
                this.turnBuffer = { action: 'LEFT', time: Date.now() };
            } else if (scoreRight > scoreLeft && scoreRight > 0) {
                this.turnBuffer = { action: 'RIGHT', time: Date.now() };
            }
            // Si les deux sont bouchés, il continuera tout droit en freinant (Désespoir)
        } else {
            // Mode "Croisière" ou "Attaque"
            // Petit hasard pour ne pas faire des lignes droites infinies
            if (Math.random() < 0.02) {
                if (scoreLeft > 50 && scoreLeft > scoreRight) this.turnBuffer = { action: 'LEFT', time: Date.now() };
                else if (scoreRight > 50) this.turnBuffer = { action: 'RIGHT', time: Date.now() };
            }
        }
    }

    getRayDistance(raycaster, obstacles) {
        const hits = raycaster.intersectObjects(obstacles);
        if (hits.length > 0) return hits[0].distance;
        return 200; 
    }

    isHeadingTowardsWall(limit) {
        const x = this.mesh.position.x;
        const z = this.mesh.position.z;
        if (this.dirX === 1 && x > limit) return true;
        if (this.dirX === -1 && x < -limit) return true;
        if (this.dirZ === 1 && z > limit) return true;
        if (this.dirZ === -1 && z < -limit) return true;
        return false;
    }
}