import * as THREE from 'three';

export class QualityManager {
    constructor(renderer, composer, scene, bloomPass) {
        this.renderer = renderer;
        this.composer = composer;
        this.scene = scene;
        this.bloomPass = bloomPass;
    }

    detectDevice() {
        const ua = navigator.userAgent;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            return 'low';
        }
        return 'high';
    }

    setQuality(level) {
        switch (level) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                this.bloomPass.resolution.set(window.innerWidth / 4, window.innerHeight / 4);
                break;
            case 'medium':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                this.renderer.shadowMap.enabled = false;
                this.bloomPass.resolution.set(window.innerWidth / 2, window.innerHeight / 2);
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.bloomPass.resolution.set(window.innerWidth, window.innerHeight);
                break;
        }

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);

        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = (level === 'high');
                child.receiveShadow = (level === 'high');
            }
            if (child.isLight && child.shadow) {
                child.castShadow = (level === 'high');
            }
        });
    }
}