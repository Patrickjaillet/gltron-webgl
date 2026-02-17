import * as THREE from 'three';

export class LightWall {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.currentWall = null;
        this.wallStart = new THREE.Vector3();
        this.wallDirection = new THREE.Vector3();
        
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.geometry.translate(0, 0.5, 0);

        this.material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });
    }

    startSegment(position, direction) {
        const mesh = new THREE.Mesh(this.geometry, this.material);
        this.wallStart.copy(position);
        this.wallDirection.copy(direction);
        
        mesh.position.copy(position);
        mesh.scale.set(1, 0.5, 1);
        
        this.scene.add(mesh);
        this.walls.push(mesh);
        this.currentWall = mesh;
    }

    update(position) {
        if (!this.currentWall) return;
        
        const dist = this.wallStart.distanceTo(position);
        const mid = this.wallStart.clone().lerp(position, 0.5);
        
        this.currentWall.position.copy(mid);
        this.currentWall.lookAt(position);
        this.currentWall.scale.z = Math.max(0.1, dist);
        this.currentWall.scale.x = 0.2;
    }

    dispose() {
        this.walls.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.geometry.dispose();
        this.material.dispose();
    }
}