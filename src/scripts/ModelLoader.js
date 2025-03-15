import * as THREE from 'three';

export default class JSONModelLoader {
  constructor(textureLoader) {
    this.textureLoader = textureLoader;
    this.textureCache = {};
  }

  async load(modelData) {
    const root = new THREE.Group();
    const texturePath = modelData.textures.seraph;
    const texture = await this.textureLoader.loadAsync(texturePath);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    this.processElement(modelData.elements[0], root, material, modelData);
    return root;
  }

  processElement(element, parent, material, modelData) {
    const group = new THREE.Group();
    const rotationOrigin = element.rotationOrigin || [0, 0, 0];
    group.position.set(...rotationOrigin);

    // Calculate element bounds
    const size = [
      element.to[0] - element.from[0],
      element.to[1] - element.from[1],
      element.to[2] - element.from[2]
    ];

    const center = [
      (element.from[0] + element.to[0]) / 2 - rotationOrigin[0],
      (element.from[1] + element.to[1]) / 2 - rotationOrigin[1],
      (element.from[2] + element.to[2]) / 2 - rotationOrigin[2]
    ];

    // Create geometry
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    this.applyUVs(geometry, element, modelData);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(center[0], center[1], center[2]);

    // Apply rotations
    group.rotation.z = THREE.MathUtils.degToRad(element.rotationZ || 0);
    group.rotation.x = THREE.MathUtils.degToRad(element.rotationX || 0);
    group.rotation.y = THREE.MathUtils.degToRad(element.rotationY || 0);

    group.add(mesh);
    parent.add(group);

    // Process children
    if (element.children) {
      element.children.forEach(child => {
        this.processElement(child, group, material, modelData);
      });
    }
  }

  applyUVs(geometry, element, modelData) {
    const facesMap = {
      north: 5, // Back face
      south: 4, // Front face
      east: 0,  // Right face
      west: 1,  // Left face
      up: 2,    // Top face
      down: 3   // Bottom face
    };

    const uvAttribute = geometry.attributes.uv;
    const faceVertexUvs = [];

    Object.entries(element.faces).forEach(([faceName, faceData]) => {
      const faceIndex = facesMap[faceName];
      const [u1, v1, u2, v2] = faceData.uv;
      const textureWidth = modelData.textureWidth;
      const textureHeight = modelData.textureHeight;

      // Convert to normalized UV coordinates
      const uv = [
        u1 / textureWidth,
        1 - v2 / textureHeight, // Flip V coordinate
        u2 / textureWidth,
        1 - v1 / textureHeight
      ];

      // Apply rotation
      let rotatedUVs = this.rotateUVs(uv, faceData.rotation || 0);

      // Map UVs to face vertices
      const faceUvs = new Array(4).fill().map((_, i) => {
        return new THREE.Vector2(
          rotatedUVs[i % 2 === 0 ? 0 : 2],
          rotatedUVs[i < 2 ? 3 : 1]
        );
      });

      // Assign UVs to correct face vertices
      const faceIndices = this.getFaceVertexIndices(faceIndex);
      faceIndices.forEach((vertexIndex, uvIndex) => {
        uvAttribute.setXY(vertexIndex, faceUvs[uvIndex].x, faceUvs[uvIndex].y);
      });
    });
  }

  rotateUVs(uv, rotation) {
    const [u1, v1, u2, v2] = uv;
    switch (rotation) {
      case 90:
        return [u2, v1, u2, v2, u1, v2, u1, v1];
      case 180:
        return [u2, v2, u1, v2, u1, v1, u2, v1];
      case 270:
        return [u1, v2, u1, v1, u2, v1, u2, v2];
      default:
        return uv;
    }
  }

  getFaceVertexIndices(faceIndex) {
    // Returns vertex indices for each face in BoxGeometry
    const indices = [];
    const startIndex = faceIndex * 6;
    for (let i = 0; i < 6; i++) {
      indices.push(startIndex + i);
    }
    return indices;
  }
}

// Usage example:
// const loader = new JSONModelLoader(new THREE.TextureLoader());
// loader.load(jsonData).then(model => scene.add(model));