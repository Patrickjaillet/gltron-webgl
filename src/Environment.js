import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export class Environment {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        
        // Stockage des éléments pour gérer la visibilité (ex: mode Garage)
        this.lights = [];
        this.meshes = [];

        this.initLighting();
        this.initFloor();
        this.initGrid();
        this.initWalls();
        this.initSkybox();
    }

    initLighting() {
        // --- ÉCLAIRAGE (LIGHTING) ---
        // Lumière ambiante : Éclaire uniformément la scène pour éviter les zones totalement noires.
        // Intensité faible pour garder le contraste élevé du style Cyberpunk.
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0); 
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Lumière directionnelle : Simule une source lumineuse lointaine (soleil artificiel).
        // Essentielle pour générer des ombres portées par les motos.
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(50, 100, 50); // Position en hauteur et décalée
        dirLight.castShadow = true; // Active la projection d'ombres

        // Configuration de la Shadow Map (Qualité des ombres)
        dirLight.shadow.mapSize.width = 2048; // Résolution élevée pour des ombres nettes
        dirLight.shadow.mapSize.height = 2048;
        
        // Volume de la caméra d'ombre (Doit couvrir toute l'arène de jeu)
        const d = 120;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        
        this.scene.add(dirLight);
        this.lights.push(dirLight);
    }

    initFloor() {
        // --- SOL MIROIR (REFLECTIVE FLOOR) ---
        // Création d'un plan géométrique de 200x200 unités (taille de l'arène).
        const geometry = new THREE.PlaneGeometry(200, 200);

        // Utilisation de Reflector pour créer un effet de miroir réaliste en temps réel.
        // Cela rend une caméra virtuelle inversée dans une texture.
        this.groundMirror = new Reflector(geometry, {
            clipBias: 0.003, // Décalage pour éviter les artefacts de rendu (z-fighting)
            textureWidth: 1024, // Largeur de la texture de réflexion (1024 = bon compromis qualité/perf)
            textureHeight: 1024, // Hauteur de la texture de réflexion
            color: 0x111111 // Couleur de base du sol (Noir profond pour un effet sombre et brillant)
        });

        this.groundMirror.position.y = 0; // Au niveau zéro
        this.groundMirror.rotation.x = -Math.PI / 2; // Rotation à plat (horizontal)
        this.scene.add(this.groundMirror);
        this.meshes.push(this.groundMirror);
    }

    initGrid() {
        // --- GRILLE NÉON (NEON GRID) ---
        // GridHelper crée une grille de lignes simples.
        // Taille: 200 unités, Divisions: 200 (donc 1 ligne par unité).
        // Couleur 1 (Centre): 0x00ffff (Cyan fluo)
        // Couleur 2 (Lignes): 0x004444 (Cyan foncé)
        const gridHelper = new THREE.GridHelper(200, 200, 0x00ffff, 0x004444);
        
        // Positionnement légèrement au-dessus du sol miroir (0.1) pour éviter le scintillement (Z-fighting).
        gridHelper.position.y = 0.1;
        
        // Transparence pour un effet plus subtil qui se mélange aux reflets
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        
        this.scene.add(gridHelper);
        this.meshes.push(gridHelper);
    }

    initWalls() {
        // --- MURS DE L'ARÈNE (ARENA WALLS) ---
        // Création d'une texture procédurale pour l'aspect "Circuit"
        const texture = this.createTechTexture();
        
        // Configuration de la répétition (Texture Repeat)
        // Le mur fait 200 unités de long. On répète la texture 4 fois horizontalement
        // pour éviter qu'elle ne soit trop étirée (aspect ratio plus cohérent).
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);

        // Matériau Standard avec émission pour le Bloom
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: texture,              // Texture de base (couleur)
            color: 0x222222,           // Teinte sombre pour le fond
            emissive: 0x5500ff,        // Couleur d'émission (Bleu/Violet)
            emissiveMap: texture,      // La texture définit les zones lumineuses
            emissiveIntensity: 2.0,    // Intensité de la lueur (Bloom)
            roughness: 0.4,
            metalness: 0.8
        });

        // Géométrie : BoxGeometry(Largeur, Hauteur, Épaisseur)
        // Largeur = 200 (Taille de l'arène)
        // Hauteur = 10 (Hauteur des murs)
        // Épaisseur = 2 (Épaisseur physique)
        const geometry = new THREE.BoxGeometry(200, 10, 2);

        // --- POSITIONNEMENT MATHÉMATIQUE ---
        // L'arène est centrée en (0,0) et fait 200x200.
        // Les bords sont donc à x = +/- 100 et z = +/- 100.
        // La hauteur du mur est 10, donc son centre Y est à 5 (pour poser sur le sol à 0).

        // 1. Mur Nord (Z négatif)
        // Positionné à z = -100.
        const wallNorth = new THREE.Mesh(geometry, wallMaterial);
        wallNorth.position.set(0, 5, -100);
        this.scene.add(wallNorth);
        this.meshes.push(wallNorth);

        // 2. Mur Sud (Z positif)
        // Positionné à z = 100.
        const wallSouth = new THREE.Mesh(geometry, wallMaterial);
        wallSouth.position.set(0, 5, 100);
        this.scene.add(wallSouth);
        this.meshes.push(wallSouth);

        // 3. Mur Est (X positif)
        // Positionné à x = 100.
        // Rotation de 90 degrés (PI/2) autour de Y pour s'aligner sur l'axe Z.
        const wallEast = new THREE.Mesh(geometry, wallMaterial);
        wallEast.position.set(100, 5, 0);
        wallEast.rotation.y = Math.PI / 2;
        this.scene.add(wallEast);
        this.meshes.push(wallEast);

        // 4. Mur Ouest (X négatif)
        // Positionné à x = -100.
        // Rotation de 90 degrés.
        const wallWest = new THREE.Mesh(geometry, wallMaterial);
        wallWest.position.set(-100, 5, 0);
        wallWest.rotation.y = Math.PI / 2;
        this.scene.add(wallWest);
        this.meshes.push(wallWest);
    }

    createTechTexture() {
        // Création d'un canvas pour générer une texture procédurale
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fond noir
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 512);

        // Dessin du motif "Circuit"
        ctx.strokeStyle = '#ffffff'; // Les lignes blanches deviendront la couleur émissive
        ctx.lineWidth = 8;
        ctx.lineCap = 'square';

        // Bordure
        ctx.strokeRect(10, 10, 492, 492);

        // Lignes aléatoires horizontales et verticales
        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            // Lignes horizontales
            const y = Math.random() * 512;
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            
            // Quelques lignes verticales pour faire "circuit"
            if (i % 2 === 0) {
                const x = Math.random() * 512;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 512);
            }
        }
        ctx.stroke();

        // Ajout de "Noeuds" (carrés lumineux)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 480 + 16;
            const y = Math.random() * 480 + 16;
            ctx.fillRect(x, y, 20, 20);
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    initSkybox() {
        // --- SKYBOX VIDÉO (VIDEO BACKGROUND) ---
        // Récupération de la vidéo chargée par l'AssetManager
        const video = this.assetManager.get('bgLoop');
        if (video) {
            // Création d'une texture vidéo
            const videoTexture = new THREE.VideoTexture(video);
            videoTexture.colorSpace = THREE.SRGBColorSpace; // Gestion correcte des couleurs

            // Sphère géante qui englobe toute la scène
            const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
            
            // Inversion de l'échelle X pour que la texture soit visible de l'intérieur de la sphère
            skyGeometry.scale(-1, 1, 1);

            // Matériau basique (pas affecté par la lumière) affichant la vidéo
            const skyMaterial = new THREE.MeshBasicMaterial({ 
                map: videoTexture 
            });

            this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
            this.scene.add(this.skybox);
            this.meshes.push(this.skybox);

            // Lancement de la lecture vidéo si ce n'est pas déjà fait
            video.play();
        }
    }

    setVisible(visible) {
        this.lights.forEach(l => l.visible = visible);
        this.meshes.forEach(m => m.visible = visible);
    }
}
