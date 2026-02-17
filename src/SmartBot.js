import * as THREE from 'three';
import { Player } from './Player.js';

export class SmartBot extends Player {
    constructor(assetManager, listener, grid, explosionSystem, scene, target) {
        // Couleur rouge/orange pour l'ennemi
        super(assetManager, listener, grid, explosionSystem, 0xff0000, 0xff4400, null);
        
        this.scene = scene;
        this.target = target; // Le joueur à traquer

        // --- PARAMÈTRES IA ---
        this.viewDistance = 80;      // Distance de vision max
        this.criticalDistance = 15;  // Distance de danger immédiat (Freinage)
        this.wallPenalty = 1000;     // Pénalité pour un mur
        this.attackBonus = 200;      // Bonus pour attaquer le joueur
        
        // --- CAPTEURS (RAYCASTERS) ---
        this.raycasters = {
            front: new THREE.Raycaster(),
            left: new THREE.Raycaster(),
            right: new THREE.Raycaster(),
            diagLeft: new THREE.Raycaster(),
            diagRight: new THREE.Raycaster()
        };

        // Configuration des angles relatifs (0 = Devant)
        this.raysConfig = [
            { id: 'front', angle: 0 },
            { id: 'left', angle: Math.PI / 2 },
            { id: 'right', angle: -Math.PI / 2 },
            { id: 'diagLeft', angle: Math.PI / 4 },
            { id: 'diagRight', angle: -Math.PI / 4 }
        ];
    }

    handleInput() {
        if (this.isDead) return;

        // 1. SCANNER L'ENVIRONNEMENT
        const sensors = this.scanSurroundings();

        // 2. ÉVALUER LES DIRECTIONS (SCORE SYSTEM)
        // On attribue un score à chaque action possible : Tout droit, Gauche, Droite
        const scores = {
            FORWARD: this.evaluateDirection('FORWARD', sensors),
            LEFT: this.evaluateDirection('LEFT', sensors),
            RIGHT: this.evaluateDirection('RIGHT', sensors)
        };

        // 3. PRENDRE UNE DÉCISION
        this.makeDecision(scores, sensors);
    }

    scanSurroundings() {
        const origin = this.mesh.position.clone();
        origin.y = 0.5;

        const results = {};
        
        // Filtrage des obstacles : Tout Mesh visible sauf soi-même et le sol
        const obstacles = [];
        this.scene.children.forEach(c => {
            if (c.isMesh && c !== this.mesh && c.geometry.type !== 'PlaneGeometry' && c.visible) {
                obstacles.push(c);
            }
        });

        this.raysConfig.forEach(config => {
            // Calcul du vecteur de direction du rayon
            const dir = this.direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), config.angle);
            
            // 1. Raycast Physique (Murs, Motos)
            this.raycasters[config.id].set(origin, dir);
            this.raycasters[config.id].far = this.viewDistance;
            const intersects = this.raycasters[config.id].intersectObjects(obstacles);
            let dist = intersects.length > 0 ? intersects[0].distance : this.viewDistance;

            // 2. Raycast Mathématique (Limites du monde +/- 100)
            const distToWall = this.getDistanceToBoundaries(origin, dir);
            
            // On garde la distance la plus courte (Obstacle ou Bord du monde)
            results[config.id] = Math.min(dist, distToWall);
        });

        return results;
    }

    getDistanceToBoundaries(origin, dir) {
        let minT = 999;
        const checkPlane = (limit, originVal, dirVal) => {
            if (Math.abs(dirVal) < 0.001) return; // Parallèle
            const t = (limit - originVal) / dirVal;
            if (t > 0 && t < minT) minT = t;
        };
        checkPlane(100, origin.x, dir.x);  // Est
        checkPlane(-100, origin.x, dir.x); // Ouest
        checkPlane(100, origin.z, dir.z);  // Sud
        checkPlane(-100, origin.z, dir.z); // Nord
        return minT;
    }

    evaluateDirection(moveDir, sensors) {
        let score = 0;
        let primarySensor = 0; // Capteur principal pour cette direction
        let diagSensor = 0;    // Capteur secondaire (diagonale)

        if (moveDir === 'FORWARD') {
            primarySensor = sensors.front;
            diagSensor = (sensors.diagLeft + sensors.diagRight) / 2;
        } else if (moveDir === 'LEFT') {
            primarySensor = sensors.left;
            diagSensor = sensors.diagLeft;
        } else if (moveDir === 'RIGHT') {
            primarySensor = sensors.right;
            diagSensor = sensors.diagRight;
        }

        // --- CRITÈRE 1 : SURVIE (Évitement de murs) ---
        if (primarySensor < 5) score -= this.wallPenalty; // Mur imminent !
        else if (primarySensor < 20) score -= (20 - primarySensor) * 50; // Mur proche

        // --- CRITÈRE 2 : ESPACE LIBRE (Flood Fill Simplifié) ---
        // Plus il y a de place, mieux c'est. Les diagonales comptent aussi.
        score += primarySensor * 2; 
        score += diagSensor * 1;

        // --- CRITÈRE 3 : ATTAQUE (Couper la route) ---
        if (this.target && !this.target.isDead) {
            const toTarget = new THREE.Vector3().subVectors(this.target.mesh.position, this.mesh.position).normalize();
            
            // Calcul du vecteur de direction théorique
            let dirVector = this.direction.clone();
            if (moveDir === 'LEFT') dirVector.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
            if (moveDir === 'RIGHT') dirVector.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2);

            // Si la cible est alignée avec cette direction, on fonce (+200 pts)
            const alignment = toTarget.dot(dirVector);
            if (alignment > 0.5) score += this.attackBonus * alignment;
        }

        return score;
    }

    makeDecision(scores, sensors) {
        // Tri des scores pour trouver la meilleure action
        const moves = ['FORWARD', 'LEFT', 'RIGHT'];
        moves.sort((a, b) => scores[b] - scores[a]);
        const bestMove = moves[0];

        // Exécution du virage
        if (bestMove === 'LEFT') this.turnBuffer = { action: 'LEFT', time: Date.now() };
        else if (bestMove === 'RIGHT') this.turnBuffer = { action: 'RIGHT', time: Date.now() };

        // --- RÉFLEXES (FREINAGE D'URGENCE) ---
        // Si un obstacle surgit devant (ex: le joueur coupe la route) et qu'on n'a pas encore tourné
        if (sensors.front < this.criticalDistance) {
            this.isBraking = true;
            this.isBoosting = false;
        } else {
            this.isBraking = false;
            // Boost opportuniste : Si tout droit c'est très dégagé et qu'on attaque
            if (bestMove === 'FORWARD' && sensors.front > 60 && scores.FORWARD > 200) {
                this.isBoosting = true;
            } else {
                this.isBoosting = false;
            }
        }
    }
}