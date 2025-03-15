import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

// VS uses these face names in this order
const VS_FACES = ['north', 'east', 'west', 'south', 'up', 'down'] as const;
type FaceName = typeof VS_FACES[number];

// Map VS faces to Three.js BoxGeometry faces
// Three.js BoxGeometry face order: right, left, top, bottom, front, back
const FACE_MAP: Record<FaceName, number> = {
  // In VS: north is front (-Y), south is back (+Y), east is right (+X), west is left (-X)
  north: 5,  // front in Three.js
  south: 4,  // back in Three.js
  east: 0,   // right in Three.js
  west: 1,   // left in Three.js
  up: 2,     // top in Three.js
  down: 3    // bottom in Three.js
};

// Reverse map for looking up VS face names from Three.js face indices
const REVERSE_FACE_MAP: Record<number, FaceName> = Object.entries(FACE_MAP).reduce((acc, [key, value]) => {
  acc[value] = key as FaceName;
  return acc;
}, {} as Record<number, FaceName>);

interface Face {
  texture?: string;
  uv?: number[];
  rotation?: number;
  enabled?: boolean;
  windMode?: [number, number];
}

interface ModelElement {
  name: string;
  stepParentName?: string;
  from: number[];
  to: number[];
  rotationOrigin?: number[];
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  uv?: number[];
  faces: {
    [key: string]: Face;
  };
  children?: ModelElement[];
}

interface ModelData {
  textureWidth: number;
  textureHeight: number;
  textures: {
    [key: string]: string;
  };
  textureSizes?: {
    [key: string]: [number, number];
  };
  elements: ModelElement[];
}

interface LoadedModel {
  data: ModelData;
  textures: {[key: string]: THREE.Texture};
}

interface ModelViewerProps {
  customization?: {[key: string]: string};
}

const Compass = () => {
  const radius = 20; // Distance from center

  return (
    <group position={[0, 0, 0]}>
      {/* North (-Z) */}
      <Text
        position={[0, 0, -radius]}
        scale={[2, 2, 2]}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>

      {/* South (+Z) */}
      <Text
        position={[0, 0, radius]}
        scale={[2, 2, 2]}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        S
      </Text>

      {/* East (+X) */}
      <Text
        position={[radius, 0, 0]}
        scale={[2, 2, 2]}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        E
      </Text>

      {/* West (-X) */}
      <Text
        position={[-radius, 0, 0]}
        scale={[2, 2, 2]}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        W
      </Text>
    </group>
  );
};

const ModelViewer: React.FC<ModelViewerProps> = ({ customization = {} }) => {
  const [baseModel, setBaseModel] = useState<LoadedModel | null>(null);
  const [partModels, setPartModels] = useState<{[key: string]: LoadedModel}>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const baseElementsRef = useRef<{[key: string]: THREE.Matrix4}>({});

  // Helper function to load a texture
  const loadTexture = async (texturePath: string): Promise<THREE.Texture> => {
    const textureLoader = new THREE.TextureLoader();
    return new Promise<THREE.Texture>((resolve, reject) => {
      textureLoader.load(
        `/assets/game/textures/${texturePath}.png`,
        (tex) => {
          tex.flipY = false;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          resolve(tex);
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', texturePath, error);
          reject(error);
        }
      );
    });
  };

  // Helper function to load all textures for a model
  const loadModelTextures = async (modelData: ModelData, category?: string, variation: string = 'default'): Promise<{[key: string]: THREE.Texture}> => {
    const textures: {[key: string]: THREE.Texture} = {};

    // For hair parts, load the selected hair color texture for the #hair texture
    if (category?.startsWith('hair')) {
      const hairTexturePath = `entity/humanoid/seraphskinparts/hair/${variation}`;
      try {
        textures['hair'] = await loadTexture(hairTexturePath);
      } catch (error) {
        console.error('Error loading hair texture:', error);
      }
    }

    // For body parts, load the selected skin texture for the #skin texture
    if (category === 'body') {
      const skinTexturePath = `entity/humanoid/seraphskinparts/body/${variation}`;
      try {
        textures['skin'] = await loadTexture(skinTexturePath);
      } catch (error) {
        console.error('Error loading skin texture:', error);
      }
    }

    // For eye parts or face parts, load the selected eye color texture for the #eye texture
    if (category === 'eyes' || category === 'face') {
      const eyeTexturePath = `entity/humanoid/seraphskinparts/eyes/${customization.eyecolor || 'azure'}`;
      try {
        textures['eye'] = await loadTexture(eyeTexturePath);
      } catch (error) {
        console.error('Error loading eye texture:', error);
      }
    }

    // Load all other explicitly defined textures (except overridden ones)
    for (const [key, path] of Object.entries(modelData.textures)) {
      // Skip loading textures that are overridden by color variations
      if (
        (category?.startsWith('hair') && key === 'hair') ||
        (category === 'body' && key === 'skin') ||
        ((category === 'eyes' || category === 'face') && key === 'eye')
      ) {
        continue;
      }
      
      try {
        textures[key] = await loadTexture(path);
      } catch (error) {
        console.error(`Error loading texture ${key}:`, error);
      }
    }

    return textures;
  };

  // Load base model
  useEffect(() => {
    const loadBaseModel = async () => {
      try {
        console.log('Loading base model...');
        const response = await fetch('/assets/game/shapes/entity/humanoid/seraph-faceless.json');
        if (!response.ok) {
          throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
        }
        const modelData = await response.json();
        console.log('Base model loaded:', modelData);
        
        // Load all textures for the base model
        const textures: {[key: string]: THREE.Texture} = {};
        
        // Load the base skin texture (either custom or default)
        const skinPath = customization.baseskin 
          ? `entity/humanoid/seraphskinparts/body/${customization.baseskin}`
          : modelData.textures.seraph;
        
        try {
          // Load the skin texture and use it for both 'seraph' and 'skin' keys
          const skinTexture = await loadTexture(skinPath);
          textures['seraph'] = skinTexture;
          textures['skin'] = skinTexture;

          // Load underwear texture if specified and not 'none'
          if (customization.underwear && customization.underwear !== 'none') {
            try {
              const underwearTexture = await loadTexture(`entity/humanoid/seraphskinparts/underwear/${customization.underwear}`);
              underwearTexture.needsUpdate = true;
              textures['underwear'] = underwearTexture;
            } catch (error) {
              console.error('Error loading underwear texture:', error);
            }
          }
        } catch (error) {
          console.error('Error loading skin texture:', error);
        }
        
        // Load eye texture if specified
        if (customization.eyecolor) {
          try {
            textures['eye'] = await loadTexture(`entity/humanoid/seraphskinparts/eyes/${customization.eyecolor}`);
          } catch (error) {
            console.error('Error loading eye texture:', error);
          }
        }

        setBaseModel({ data: modelData, textures });
      } catch (error) {
        console.error('Error loading base model or textures:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    loadBaseModel();
  }, [customization.baseskin, customization.eyecolor, customization.underwear]);

  // Load part models when customization changes
  useEffect(() => {
    const loadPartModels = async () => {
      const newPartModels: {[key: string]: LoadedModel} = {};

      for (const [category, part] of Object.entries(customization)) {
        if (part === 'none') continue;

        // Skip texture-only categories
        if (['haircolor', 'hair-base-color', 'hair-extra-color', 'baseskin', 'eyecolor', 'underwear'].includes(category)) {
          continue;
        }

        try {
          const response = await fetch(`/assets/game/shapes/entity/humanoid/seraphskinparts/${category}/${part}.json`);
          if (!response.ok) continue;
          
          const modelData = await response.json();
          
          // Get the color/variation based on category
          let variation = 'default';
          if (category.startsWith('hair')) {
            variation = customization[`${category}-color`] || customization.haircolor || 'lightgray';
          } else if (category === 'body') {
            variation = customization.baseskin || 'skin1';
          } else if (category === 'eyes') {
            variation = customization.eyecolor || 'azure';
          }
          
          // Load all textures for the part
          const textures = await loadModelTextures(modelData, category, variation);
          newPartModels[`${category}-${part}`] = { data: modelData, textures };
        } catch (error) {
          console.error(`Error loading part model ${category}/${part}:`, error);
        }
      }

      setPartModels(newPartModels);
    };

    if (baseModel) {
      loadPartModels();
    }
  }, [customization, baseModel]);

  const ModelElement = ({ 
    element, 
    model, 
    parentTransform = new THREE.Matrix4(),
    isBaseModel = false 
  }: { 
    element: ModelElement; 
    model: LoadedModel; 
    parentTransform?: THREE.Matrix4;
    isBaseModel?: boolean;
  }) => {
    // Convert VS coordinates to Three.js (Z up to Y up)
    const from = [
      element.from[0],
      element.from[1],
      element.from[2]
    ];
    const to = [
      element.to[0],
      element.to[1],
      element.to[2]
    ];
    
    const width = Math.abs(to[0] - from[0]);
    const height = Math.abs(to[1] - from[1]);
    const depth = Math.abs(to[2] - from[2]);

    // Only skip if this is not a parent element
    if (width === 0 && height === 0 && depth === 0 && !element.children?.length) {
      return null;
    }

    // Create transformation matrix starting from parent
    const transform = new THREE.Matrix4().copy(parentTransform);

    // First apply the element's position
    transform.multiply(new THREE.Matrix4().makeTranslation(
      from[0],
      from[1],
      from[2]
    ));

    // Then apply rotation if present
    if (element.rotationOrigin) {
      const [rx, ry, rz] = [
        element.rotationOrigin[0] - from[0], // Make rotation relative to element position
        element.rotationOrigin[1] - from[1],
        element.rotationOrigin[2] - from[2]
      ];
      
      // Move to rotation origin
      transform.multiply(new THREE.Matrix4().makeTranslation(rx, ry, rz));
      
      // Apply rotations in VS order (XZY)
      if (element.rotationX) transform.multiply(new THREE.Matrix4().makeRotationX(element.rotationX * Math.PI / 180));
      if (element.rotationZ) transform.multiply(new THREE.Matrix4().makeRotationZ(element.rotationZ * Math.PI / 180));
      if (element.rotationY) transform.multiply(new THREE.Matrix4().makeRotationY(element.rotationY * Math.PI / 180));
      
      // Move back
      transform.multiply(new THREE.Matrix4().makeTranslation(-rx, -ry, -rz));
    }

    // Store base model element transforms for part attachment
    if (isBaseModel && element.name) {
      baseElementsRef.current[element.name] = transform.clone();
    }

    let mesh: JSX.Element | null = null;
    if (width > 0 || height > 0 || depth > 0) {
      const geometry = new THREE.BoxGeometry(width, height, depth);

      // Create materials for each face
      const materials: THREE.Material[] = [];
      let hasTexture = false; // Track if any face has a texture
      
      for (let i = 0; i < 6; i++) {
        // Find the corresponding VS face for this Three.js face index
        const vsFace = VS_FACES.find(face => FACE_MAP[face] === i);
        const face = vsFace ? element.faces[vsFace] : undefined;

        if (face?.texture) {
          hasTexture = true;
          // Get the texture key without the '#' prefix
          const textureKey = face.texture.substring(1);
          const texture = model.textures[textureKey];

          if (texture) {
            const material = new THREE.MeshStandardMaterial({
              map: texture.clone(), // Clone the texture so we can modify its UV independently
              transparent: true,
              side: THREE.DoubleSide,
              alphaTest: 0.1,
              depthWrite: true,
              depthTest: true
            });

            // If this is a skin face and we have an underwear texture, blend it with the skin texture
            if ((textureKey === 'seraph' || textureKey === 'skin') && model.textures['underwear']) {
              // Create a canvas to blend the textures
              const canvas = document.createElement('canvas');
              const skinTexture = texture;
              const underwearTexture = model.textures['underwear'];
              
              // Set canvas size to match texture size
              canvas.width = skinTexture.image.width;
              canvas.height = skinTexture.image.height;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Draw the base skin texture
                ctx.drawImage(skinTexture.image, 0, 0);
                
                // Draw the underwear texture on top with alpha blending
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(underwearTexture.image, 0, 0);
                
                // Create a new texture from the blended canvas
                const blendedTexture = new THREE.Texture(canvas);
                blendedTexture.needsUpdate = true;
                blendedTexture.flipY = false;
                blendedTexture.magFilter = THREE.NearestFilter;
                blendedTexture.minFilter = THREE.NearestFilter;
                
                // Update the material with the blended texture
                material.map = blendedTexture;
              }
            }
            
            materials.push(material);
          } else {
            // Fallback to default material if texture not found
            materials.push(new THREE.MeshStandardMaterial({
              color: 0xff00ff,
              transparent: true,
              opacity: 0,
              side: THREE.DoubleSide,
              depthWrite: false,
              depthTest: true
            }));
          }
        } else {
          // If no texture specified for this face, make it fully transparent
          materials.push(new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
          }));
        }
      }

      // UV mapping
      const uvAttribute = geometry.attributes.uv;
      const uvs = uvAttribute.array as Float32Array;

      // Reset all UVs to 0
      for (let i = 0; i < uvs.length; i++) {
        uvs[i] = 0;
      }

      VS_FACES.forEach((faceName) => {
        const face = element.faces[faceName];
        if (!face?.uv) return;

        const faceIndex = FACE_MAP[faceName];
        if (faceIndex === undefined) return;

        // Get UV coordinates from the face
        const [u1, v1, u2, v2] = face.uv;
        
        // Get the texture dimensions for this face
        let textureWidth = model.data.textureWidth;
        let textureHeight = model.data.textureHeight;
        
        if (face.texture) {
          const textureKey = face.texture.substring(1);
          const textureSizes = model.data.textureSizes?.[textureKey];
          if (textureSizes) {
            [textureWidth, textureHeight] = textureSizes;
          }
        }
        
        // Convert UV coordinates to normalized space (0-1)
        const uvX1 = u1 / textureWidth;
        const uvX2 = u2 / textureWidth;
        const uvY1 = v1 / textureHeight;
        const uvY2 = v2 / textureHeight;

        const idx = faceIndex * 8;
        const rotation = face.rotation || 0;

        const windMode = face.windMode;
        const shouldFlipX = windMode && windMode[0] === -1;
        const shouldFlipY = windMode && windMode[1] === -1;

        // Calculate final UV coordinates based on windMode
        const finalUvX1 = shouldFlipX ? uvX2 : uvX1;
        const finalUvX2 = shouldFlipX ? uvX1 : uvX2;
        const finalUvY1 = shouldFlipY ? uvY2 : uvY1;
        const finalUvY2 = shouldFlipY ? uvY1 : uvY2;

        // Handle rotated faces
        if (rotation === 90) {
          if (element.rotationX !== undefined && Math.abs(element.rotationX) === 135) {
            // Special case for h2-like elements (X rotation of 135 degrees)
            uvs[idx] = finalUvX2;     uvs[idx + 1] = finalUvY1;
            uvs[idx + 2] = finalUvX1; uvs[idx + 3] = finalUvY1;
            uvs[idx + 4] = finalUvX2; uvs[idx + 5] = finalUvY2;
            uvs[idx + 6] = finalUvX1; uvs[idx + 7] = finalUvY2;
          } else if (element.rotationZ !== undefined && Math.abs(element.rotationZ) === 135) {
            // Special case for h4-like elements (Z rotation of 135 degrees)
            uvs[idx] = finalUvX1;     uvs[idx + 1] = finalUvY1;
            uvs[idx + 2] = finalUvX2; uvs[idx + 3] = finalUvY1;
            uvs[idx + 4] = finalUvX1; uvs[idx + 5] = finalUvY2;
            uvs[idx + 6] = finalUvX2; uvs[idx + 7] = finalUvY2;
          } else {
            // Default 90-degree rotation
            uvs[idx] = finalUvX1;     uvs[idx + 1] = finalUvY2;
            uvs[idx + 2] = finalUvX1; uvs[idx + 3] = finalUvY1;
            uvs[idx + 4] = finalUvX2; uvs[idx + 5] = finalUvY2;
            uvs[idx + 6] = finalUvX2; uvs[idx + 7] = finalUvY1;
          }
        } else if (rotation === 180) {
          uvs[idx] = finalUvX2;     uvs[idx + 1] = finalUvY2;
          uvs[idx + 2] = finalUvX1; uvs[idx + 3] = finalUvY2;
          uvs[idx + 4] = finalUvX2; uvs[idx + 5] = finalUvY1;
          uvs[idx + 6] = finalUvX1; uvs[idx + 7] = finalUvY1;
        } else if (rotation === 270) {
          uvs[idx] = finalUvX2;     uvs[idx + 1] = finalUvY1;
          uvs[idx + 2] = finalUvX2; uvs[idx + 3] = finalUvY2;
          uvs[idx + 4] = finalUvX1; uvs[idx + 5] = finalUvY1;
          uvs[idx + 6] = finalUvX1; uvs[idx + 7] = finalUvY2;
        } else {
          // No rotation
          uvs[idx] = finalUvX1;     uvs[idx + 1] = finalUvY1;
          uvs[idx + 2] = finalUvX2; uvs[idx + 3] = finalUvY1;
          uvs[idx + 4] = finalUvX1; uvs[idx + 5] = finalUvY2;
          uvs[idx + 6] = finalUvX2; uvs[idx + 7] = finalUvY2;
        }

        // Handle windMode for north faces
        if (faceName === 'north' && face.windMode && Array.isArray(face.windMode) && face.windMode[0] === -1) {
          // For north faces with windMode [-1,-1,-1,-1], we need to flip the UVs horizontally
          uvs[idx] = uvX2;     uvs[idx + 1] = uvY1;
          uvs[idx + 2] = uvX1; uvs[idx + 3] = uvY1;
          uvs[idx + 4] = uvX2; uvs[idx + 5] = uvY2;
          uvs[idx + 6] = uvX1; uvs[idx + 7] = uvY2;
          return;
        }

        // Special handling for up/down faces with rotation
        if ((faceName === 'up' || faceName === 'down') && rotation === 90) {
          const hasXRotation = element.rotationX !== undefined;
          const hasZRotation = element.rotationZ !== undefined;
          const xRotation = element.rotationX || 0;
          const zRotation = element.rotationZ || 0;

          // For UpperFoot models specifically
          if (hasXRotation && hasZRotation && Math.abs(zRotation) === 5) {
            if (faceName === 'up') {
              uvs[idx] = uvX1;     uvs[idx + 1] = uvY2;
              uvs[idx + 2] = uvX1; uvs[idx + 3] = uvY1;
              uvs[idx + 4] = uvX2; uvs[idx + 5] = uvY2;
              uvs[idx + 6] = uvX2; uvs[idx + 7] = uvY1;
            } else {
              uvs[idx] = uvX2;     uvs[idx + 1] = uvY1;
              uvs[idx + 2] = uvX2; uvs[idx + 3] = uvY2;
              uvs[idx + 4] = uvX1; uvs[idx + 5] = uvY1;
              uvs[idx + 6] = uvX1; uvs[idx + 7] = uvY2;
            }
            return;
          }

          // Special handling for h2/h4-like elements with windMode
          if (face.windMode && Array.isArray(face.windMode) && face.windMode[0] === -1) {
            if (Math.abs(xRotation) === 135) {
              // h2-like elements
              uvs[idx] = uvX2;     uvs[idx + 1] = uvY2;
              uvs[idx + 2] = uvX1; uvs[idx + 3] = uvY2;
              uvs[idx + 4] = uvX2; uvs[idx + 5] = uvY1;
              uvs[idx + 6] = uvX1; uvs[idx + 7] = uvY1;
              return;
            } else if (Math.abs(zRotation) === 135) {
              // h4-like elements
              uvs[idx] = uvX2;     uvs[idx + 1] = uvY1;
              uvs[idx + 2] = uvX2; uvs[idx + 3] = uvY2;
              uvs[idx + 4] = uvX1; uvs[idx + 5] = uvY1;
              uvs[idx + 6] = uvX1; uvs[idx + 7] = uvY2;
              return;
            }
          }
        }
      });

      uvAttribute.needsUpdate = true;

      // Create a local transform for the mesh that centers it
      const meshTransform = new THREE.Matrix4().copy(transform);
      meshTransform.multiply(new THREE.Matrix4().makeTranslation(width/2, height/2, depth/2));

      mesh = (
        <mesh 
          geometry={geometry} 
          material={materials} 
          matrix={meshTransform} 
          matrixAutoUpdate={false}
          renderOrder={hasTexture ? 0 : -1}
          onClick={(event) => {
            event.stopPropagation();
            // @ts-ignore - event.faceIndex is a valid property in Three.js but not typed in React Three Fiber
            const faceIndex = Math.floor(event.faceIndex / 2);
            const vsFaceName = REVERSE_FACE_MAP[faceIndex];
            setSelectedFace(`${element.name || 'unnamed'} - ${vsFaceName || 'unknown'}`);
          }}
        />
      );
    }

    return (
      <group>
        {mesh}
        {element.children?.map((child, index) => (
          <ModelElement 
            key={child.name || index} 
            element={child} 
            model={model} 
            parentTransform={transform}
            isBaseModel={isBaseModel}
          />
        ))}
      </group>
    );
  };

  const PartModel = ({ partId, model }: { partId: string, model: LoadedModel }) => {
    return (
      <group key={partId}>
        {model.data.elements.map((element, index) => {
          // If the element has a stepParentName, use that parent's transform
          const parentTransform = element.stepParentName 
            ? baseElementsRef.current[element.stepParentName] 
            : new THREE.Matrix4();

          return (
            <ModelElement 
              key={`${partId}-${element.name || index}`} 
              element={element} 
              model={model}
              parentTransform={parentTransform}
            />
          );
        })}
      </group>
    );
  };

  if (error) {
    return <div style={{ color: 'red', padding: 20 }}>Error: {error}</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#2a2a2a', position: 'relative' }}>
      <Canvas camera={{ position: [16, 16, 16], fov: 60 }}>
        <color attach="background" args={['#2a2a2a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        <OrbitControls />
        <gridHelper args={[32, 32]} />
        <axesHelper args={[16]} />
        <Compass />
        <group position={[-8, 0, -8]}>
          {/* Render base model first to build transform references */}
          {baseModel && baseModel.data.elements.map((element, index) => (
            <ModelElement 
              key={`base-${element.name || index}`} 
              element={element} 
              model={baseModel}
              isBaseModel={true}
            />
          ))}
          
          {/* Then render part models using the transform references */}
          {Object.entries(partModels).map(([partId, model]) => (
            <PartModel key={partId} partId={partId} model={model} />
          ))}
        </group>
      </Canvas>
      {selectedFace && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          Selected Face: {selectedFace}
        </div>
      )}
    </div>
  );
};

export default ModelViewer; 