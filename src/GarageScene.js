import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class GarageScene {
    constructor(scene, camera, renderer, assetManager, chassisColor, neonColor) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.visible = false;

        // Sol réfléchissant
        const floorGeometry = new THREE.CircleGeometry(10, 64);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.8,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Éclairage Dramatique
        const keyLight = new THREE.SpotLight(0xffffff, 100);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.group.add(keyLight);

        const rimLight = new THREE.SpotLight(0x0000ff, 50);
        rimLight.position.set(-5, 2, -5);
        this.group.add(rimLight);

        const fillLight = new THREE.SpotLight(0xff00ff, 30);
        fillLight.position.set(0, -2, 5);
        this.group.add(fillLight);

        // Modèle du Cycle
        this.cycle = assetManager.get('lightcycle').clone();
        this.cycleMaterial = new THREE.MeshPhongMaterial({
            color: chassisColor,
            emissive: neonColor,
            emissiveIntensity: 0.5
        });
        this.cycle.traverse((child) => {
            if (child.isMesh) {
                child.material = this.cycleMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        this.cycle.scale.set(0.5, 0.5, 0.5);
        this.cycle.rotation.y = Math.PI;
        this.group.add(this.cycle);

        this.cycleLight = new THREE.PointLight(neonColor, 2, 10);
        this.cycleLight.position.set(0, 1, 0);
        this.cycle.add(this.cycleLight);

        // Particules d'ambiance
        const particlesGeom = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 8;
            positions[i*3+1] = Math.random() * 4;
            positions[i*3+2] = (Math.random() - 0.5) * 8;
        }
        particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(particlesGeom, particlesMat);
        this.group.add(this.particles);

        // Contrôles Orbitaux
        this.controls = new OrbitControls(camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2.0;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
        this.controls.enabled = false;
    }

    enter() {
        this.group.visible = true;
        this.controls.enabled = true;
        this.camera.position.set(4, 2, 4);
        this.controls.target.set(0, 0.5, 0);
        this.controls.update();
    }

    exit() {
        this.group.visible = false;
        this.controls.enabled = false;
    }

    update() {
        this.controls.update();
        this.particles.rotation.y += 0.001;
        this.cycleMaterial.color.set(this.cycleMaterial.color); // Force update if needed
    }

    setChassisColor(color) {
        this.cycleMaterial.color.set(color);
    }

    setNeonColor(color) {
        this.cycleMaterial.emissive.set(color);
        this.cycleLight.color.set(color);
    }
}