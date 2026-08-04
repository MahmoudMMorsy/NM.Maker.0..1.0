import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

export class ModelLoader {
    private static loader = new GLTFLoader();

    static async loadModel(url: string): Promise<{ scene: THREE.Group, animations: THREE.AnimationClip[] }> {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }), undefined, reject);
        });
    }

    static async loadFromBlob(blob: Blob): Promise<{ scene: THREE.Group, animations: THREE.AnimationClip[] }> {
        const url = URL.createObjectURL(blob);
        try { return await this.loadModel(url); } finally { URL.revokeObjectURL(url); }
    }

    static async loadFromUrl(url: string, format?: string): Promise<{ scene: THREE.Group, animations: THREE.AnimationClip[] }> {
        return this.loadModel(url); // For now assuming GLTF/GLB
    }

    static normalize(scene: THREE.Object3D, targetSize: number = 1) {
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            scene.scale.setScalar(targetSize / maxDim);
        }
        scene.position.sub(center.multiplyScalar(targetSize / maxDim));
        // Put bottom to Y=0
        const newBox = new THREE.Box3().setFromObject(scene);
        scene.position.y -= newBox.min.y;
    }

    static async exportGLB(scene: THREE.Object3D): Promise<Blob> {
        return new Promise((resolve, reject) => {
            new GLTFExporter().parse(scene, (res: any) => resolve(new Blob([res], { type: 'model/gltf-binary' })), (err: any) => reject(err), { binary: true });
        });
    }

    static async exportGLTF(scene: THREE.Object3D): Promise<Blob> {
        return new Promise((resolve, reject) => {
            new GLTFExporter().parse(scene, (res: any) => resolve(new Blob([JSON.stringify(res)], { type: 'application/json' })), (err: any) => reject(err), { binary: false });
        });
    }

    static async exportOBJ(scene: THREE.Object3D): Promise<Blob> {
        const res = new OBJExporter().parse(scene);
        return new Blob([res], { type: 'text/plain' });
    }

    static downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
