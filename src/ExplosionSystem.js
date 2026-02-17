import * as THREE from 'three';

export class ExplosionSystem {
    constructor(scene) {
        this.count = 500;
        this.mesh = new THREE.InstancedMesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xffffff }),
            this.count
        );
        
        this.dummy = new THREE.Object3D();
        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.life = new Float32Array(this.count);
        
        for (let i = 0; i < this.count; i++) {
            this.dummy.position.set(0, -1000, 0);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        scene.add(this.mesh);
    }

    explode(pos, colorHex) {
        let spawned = 0;
        const limit = 80;
        const color = new THREE.Color(colorHex);

        for (let i = 0; i < this.count; i++) {
            if (this.life[i] <= 0) {
                this.life[i] = 1.0 + Math.random();
                this.positions[i * 3] = pos.x;
                this.positions[i * 3 + 1] = pos.y;
                this.positions[i * 3 + 2] = pos.z;
                this.velocities[i * 3] = (Math.random() - 0.5) * 15;
                this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 15;
                this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 15;
                this.mesh.setColorAt(i, color);
                spawned++;
                if (spawned >= limit) break;
            }
        }
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }

    update(dt) {
        for (let i = 0; i < this.count; i++) {
            if (this.life[i] > 0) {
                this.life[i] -= dt;
                const scale = Math.max(0, this.life[i]);
                this.positions[i * 3] += this.velocities[i * 3] * dt;
                this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
                this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
                this.dummy.position.set(this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]);
                this.dummy.scale.set(scale, scale, scale);
                this.dummy.rotation.x += dt * 5;
                this.dummy.rotation.z += dt * 5;
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    }
}