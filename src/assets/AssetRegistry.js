import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 * AssetRegistry - Central Asset Manifest & Licensing Tracker
 * Records all 3D model assets, metadata, sources, licenses, and verified collision bounding boxes.
 */
export const ASSET_CATALOG = {
  // 1. Buildings & Architecture
  'building_riverside_apartments': {
    id: 'building_riverside_apartments',
    name: 'Riverside Apartments (Multi-Story)',
    category: 'architecture',
    source: 'AFTERLIGHT Procedural PBR Architecture Pipeline',
    license: 'MIT / CC0 Equivalent (Custom Procedural Geometric Assets)',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 14.0, y: 16.0, z: 12.0 },
    collision: { type: 'building', isSolid: true }
  },
  'building_safehouse': {
    id: 'building_safehouse',
    name: 'Operational Safehouse (Interior + Exterior)',
    category: 'architecture',
    source: 'AFTERLIGHT Procedural PBR Architecture Pipeline',
    license: 'MIT / CC0 Equivalent (Custom Procedural Geometric Assets)',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 10.0, y: 4.5, z: 10.0 },
    collision: { type: 'building', isSolid: true, hasInterior: true }
  },
  'building_storefront': {
    id: 'building_storefront',
    name: 'Urban Retail Storefront',
    category: 'architecture',
    source: 'AFTERLIGHT Procedural PBR Architecture Pipeline',
    license: 'MIT / CC0 Equivalent',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 12.0, y: 8.0, z: 10.0 },
    collision: { type: 'building', isSolid: true }
  },
  'building_substation': {
    id: 'building_substation',
    name: 'Electrical Substation & Utility Hub',
    category: 'infrastructure',
    source: 'AFTERLIGHT Procedural PBR Architecture Pipeline',
    license: 'MIT / CC0 Equivalent',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 8.0, y: 5.0, z: 8.0 },
    collision: { type: 'building', isSolid: true }
  },

  // 2. Road & Ground Infrastructure
  'road_main_street': {
    id: 'road_main_street',
    name: 'Two-Lane Asphalt Street with Wet Puddles',
    category: 'environment',
    source: 'AFTERLIGHT Dynamic PBR Synthesis',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 8.0, y: 0.05, z: 60.0 },
    collision: { type: 'floor', isWalkable: true }
  },
  'sidewalk_concrete': {
    id: 'sidewalk_concrete',
    name: 'Concrete Curb Sidewalk (Raised 0.2m)',
    category: 'environment',
    source: 'AFTERLIGHT Dynamic PBR Synthesis',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 2.5, y: 0.2, z: 60.0 },
    collision: { type: 'floor', isWalkable: true }
  },

  // 3. Vehicles
  'vehicle_suv_patrol': {
    id: 'vehicle_suv_patrol',
    name: 'Modern 4x4 Tactical SUV',
    category: 'vehicle',
    source: 'AFTERLIGHT Modular Vehicle Synthesis & GLTF Spec',
    license: 'MIT / CC0 Equivalent',
    attribution: 'AFTERLIGHT Vehicle Systems',
    scale: { x: 2.2, y: 1.85, z: 4.8 },
    collision: { type: 'vehicle', isSolid: true }
  },

  // 4. Street Infrastructure & Props
  'prop_streetlight': {
    id: 'prop_streetlight',
    name: 'Urban Steel Streetlight Pole',
    category: 'prop',
    source: 'AFTERLIGHT Prop Pipeline',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 0.4, y: 6.0, z: 1.5 },
    collision: { type: 'prop', isSolid: true }
  },
  'prop_jersey_barrier': {
    id: 'prop_jersey_barrier',
    name: 'Concrete Highway Jersey Barrier',
    category: 'prop',
    source: 'AFTERLIGHT Prop Pipeline',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 0.6, y: 0.9, z: 2.5 },
    collision: { type: 'barrier', isSolid: true }
  },
  'prop_metal_dumpster': {
    id: 'prop_metal_dumpster',
    name: 'Industrial Metal Waste Dumpster',
    category: 'prop',
    source: 'AFTERLIGHT Prop Pipeline',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 1.8, y: 1.4, z: 1.2 },
    collision: { type: 'prop', isSolid: true }
  },
  'prop_utility_box': {
    id: 'prop_utility_box',
    name: 'Electrical Junction Utility Box',
    category: 'prop',
    source: 'AFTERLIGHT Prop Pipeline',
    license: 'MIT',
    attribution: 'AFTERLIGHT Engine Core',
    scale: { x: 1.0, y: 1.6, z: 0.8 },
    collision: { type: 'prop', isSolid: true }
  },

  // 5. Character
  'character_operative_survivor': {
    id: 'character_operative_survivor',
    name: 'Contemporary Human Survivor (Operative)',
    category: 'character',
    source: 'AFTERLIGHT Character Rig & PBR Materials',
    license: 'MIT',
    attribution: 'AFTERLIGHT Character Systems',
    scale: { x: 0.9, y: 1.8, z: 0.6 },
    collision: { type: 'character', isSolid: false }
  }
};

/**
 * AssetPipelineLoader
 * Manages loading of glTF / GLB assets and integrates seamlessly with CollisionManager.
 */
export class AssetPipelineLoader {
  constructor(scene, collisionManager) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.loadedAssets = new Map();
  }

  /**
   * Retrieves asset metadata by ID
   */
  getAssetMetadata(assetId) {
    return ASSET_CATALOG[assetId] || null;
  }

  /**
   * Loads a GLTF / GLB asset asynchronously with validation and fallback
   */
  async loadGLTFAsset(rootUrl, sceneFilename, options = {}) {
    const {
      position = BABYLON.Vector3.Zero(),
      rotation = BABYLON.Vector3.Zero(),
      scaling = new BABYLON.Vector3(1, 1, 1),
      assetId = null,
      generateCollision = true,
      collisionType = 'prop'
    } = options;

    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', rootUrl, sceneFilename, this.scene);
      const rootMesh = result.meshes[0];
      
      if (rootMesh) {
        rootMesh.position = position.clone();
        rootMesh.rotation = rotation.clone();
        rootMesh.scaling = scaling.clone();

        if (generateCollision && this.collisionManager) {
          result.meshes.forEach(mesh => {
            if (mesh.getTotalVertices() > 0 && mesh.isVisible) {
              this.collisionManager.addMeshCollider(mesh, collisionType, true);
            }
          });
        }
      }

      if (assetId) {
        this.loadedAssets.set(assetId, { rootMesh, result, metadata: ASSET_CATALOG[assetId] });
      }

      return result;
    } catch (err) {
      console.warn(`[AssetPipelineLoader] Failed to load ${rootUrl}${sceneFilename}: ${err.message}. Using procedural fallback.`);
      return null;
    }
  }

  /**
   * Returns list of all registered assets in catalog
   */
  getAllRegisteredAssets() {
    return Object.values(ASSET_CATALOG);
  }
}
