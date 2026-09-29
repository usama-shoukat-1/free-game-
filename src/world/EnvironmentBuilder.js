import * as BABYLON from '@babylonjs/core';
import { TextureGenerator } from './TextureGenerator.js';
import { ColliderType } from './CollisionManager.js';

/**
 * EnvironmentBuilder
 * Builds a realistic modern blackout city block (Riverside District) with full PBR materials,
 * realistic blackout moonlight/emergency lighting, architectural buildings, detailed interior safehouse,
 * parked tactical SUV, street props, and dedicated physical colliders.
 */
export class EnvironmentBuilder {
  constructor(scene, collisionManager) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.texGen = new TextureGenerator(scene);
    this.meshes = [];
    this.lights = [];
    this.shadowGenerator = null;
  }

  /**
   * Builds the entire urban micro-environment
   */
  buildEnvironment() {
    this._createMaterials();
    this._setupBlackoutLighting();
    this._buildRoadsAndSidewalks();
    this._buildRiversideApartments();
    this._buildSafehouseWithInterior();
    this._buildStorefront();
    this._buildSubstationHub();
    this._buildParkedSUV();
    this._buildStreetProps();

    console.log('[EnvironmentBuilder] Modern blackout micro-environment built successfully.');
  }

  _createMaterials() {
    this.matAsphalt = this.texGen.createAsphaltMaterial(4, 30);
    this.matRoadMarking = this.texGen.createRoadMarkingMaterial(1, 15);
    this.matSidewalk = this.texGen.createSidewalkMaterial(2, 24);
    this.matBrick = this.texGen.createBrickMaterial(3, 4);
    this.matConcrete = this.texGen.createConcreteMaterial('#4d525a', 2, 2);
    this.matDarkConcrete = this.texGen.createConcreteMaterial('#2c2f35', 2, 2);
    this.matMetal = this.texGen.createMetalMaterial('#353a42', true);
    this.matCleanMetal = this.texGen.createMetalMaterial('#282b30', false);
    this.matGlass = this.texGen.createGlassMaterial();
    this.matWood = this.texGen.createWoodMaterial();
    this.matVehiclePaint = this.texGen.createVehiclePaintMaterial('#1e242d');
  }

  /**
   * Sets up realistic modern blackout lighting:
   * Cool moonlight + subtle night ambient + practical emergency lights
   */
  _setupBlackoutLighting() {
    // 1. Ambient Night Hemispheric Light (Restrained cool night ambient)
    const ambientLight = new BABYLON.HemisphericLight('ambientNightLight', new BABYLON.Vector3(0, 1, 0), this.scene);
    ambientLight.diffuse = new BABYLON.Color3(0.08, 0.12, 0.18);   // Dark cool moonlight ambient
    ambientLight.groundColor = new BABYLON.Color3(0.02, 0.03, 0.05);
    ambientLight.intensity = 0.55;
    this.lights.push(ambientLight);

    // 2. Directional Moonlight with crisp shadows
    const moonLight = new BABYLON.DirectionalLight('directionalMoonLight', new BABYLON.Vector3(-0.4, -0.8, 0.45).normalize(), this.scene);
    moonLight.position = new BABYLON.Vector3(25, 40, -30);
    moonLight.diffuse = new BABYLON.Color3(0.45, 0.55, 0.75); // Silvery-blue moonlight
    moonLight.specular = new BABYLON.Color3(0.2, 0.25, 0.35);
    moonLight.intensity = 0.95;
    this.lights.push(moonLight);

    // Shadow Generator
    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, moonLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 16;
    this.shadowGenerator.darkness = 0.6;

    // 3. Fog (Atmospheric night mist, NOT opaque wall-fog)
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.008;
    this.scene.fogColor = new BABYLON.Color3(0.02, 0.04, 0.08);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1.0);
  }

  /**
   * Main Asphalt Street & Raised Concrete Sidewalks
   */
  _buildRoadsAndSidewalks() {
    // 1. Ground Substrate
    const ground = BABYLON.MeshBuilder.CreateGround('ground_substrate', { width: 80, height: 80 }, this.scene);
    ground.position.y = -0.01;
    ground.material = this.matDarkConcrete;
    ground.receiveShadows = true;
    this.meshes.push(ground);

    // 2. Main Street Road (8m wide, 60m long, Z = -30 to +30)
    const road = BABYLON.MeshBuilder.CreateGround('road_main_street', { width: 8, height: 60 }, this.scene);
    road.position = new BABYLON.Vector3(0, 0.01, 0);
    road.material = this.matRoadMarking;
    road.receiveShadows = true;
    this.meshes.push(road);

    this.collisionManager.addBoxCollider({
      id: 'col_road_main',
      name: 'Main Street Road',
      type: ColliderType.FLOOR,
      min: { x: -4.0, y: -0.1, z: -30.0 },
      max: { x: 4.0, y: 0.0, z: 30.0 },
      isSolid: false,
      isWalkable: true
    });

    // 3. West Sidewalk (2.5m wide, raised 0.2m, X = -6.5m to -4.0m)
    const westSidewalk = BABYLON.MeshBuilder.CreateBox('sidewalk_west', { width: 2.5, height: 0.2, depth: 60 }, this.scene);
    westSidewalk.position = new BABYLON.Vector3(-5.25, 0.1, 0);
    westSidewalk.material = this.matSidewalk;
    westSidewalk.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(westSidewalk);
    this.meshes.push(westSidewalk);

    this.collisionManager.addBoxCollider({
      id: 'col_sidewalk_west',
      name: 'West Sidewalk',
      type: ColliderType.FLOOR,
      min: { x: -6.5, y: 0.0, z: -30.0 },
      max: { x: -4.0, y: 0.2, z: 30.0 },
      isSolid: false,
      isWalkable: true
    });

    // 4. East Sidewalk (2.5m wide, raised 0.2m, X = 4.0m to 6.5m)
    const eastSidewalk = BABYLON.MeshBuilder.CreateBox('sidewalk_east', { width: 2.5, height: 0.2, depth: 60 }, this.scene);
    eastSidewalk.position = new BABYLON.Vector3(5.25, 0.1, 0);
    eastSidewalk.material = this.matSidewalk;
    eastSidewalk.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(eastSidewalk);
    this.meshes.push(eastSidewalk);

    this.collisionManager.addBoxCollider({
      id: 'col_sidewalk_east',
      name: 'East Sidewalk',
      type: ColliderType.FLOOR,
      min: { x: 4.0, y: 0.0, z: -30.0 },
      max: { x: 6.5, y: 0.2, z: 30.0 },
      isSolid: false,
      isWalkable: true
    });

    // 5. Side Alley Lane (East side lane, X = 6.5m to 16.0m, Z = -2.0m to 2.0m)
    const alleyLane = BABYLON.MeshBuilder.CreateGround('road_side_alley', { width: 10, height: 4.5 }, this.scene);
    alleyLane.position = new BABYLON.Vector3(11.25, 0.02, 0);
    alleyLane.material = this.matAsphalt;
    alleyLane.receiveShadows = true;
    this.meshes.push(alleyLane);

    this.collisionManager.addBoxCollider({
      id: 'col_side_alley',
      name: 'Side Alley Lane',
      type: ColliderType.FLOOR,
      min: { x: 6.5, y: 0.0, z: -2.25 },
      max: { x: 16.0, y: 0.02, z: 2.25 },
      isSolid: false,
      isWalkable: true
    });
  }

  /**
   * Building 1: Riverside Apartments (Multi-Story Residential)
   * Position: West side, X = -14.0m, Z = 8.0m
   */
  _buildRiversideApartments() {
    const root = new BABYLON.TransformNode('building_riverside_apartments', this.scene);
    root.position = new BABYLON.Vector3(-14.0, 0, 8.0);

    const bWidth = 12.0;
    const bHeight = 15.0;
    const bDepth = 14.0;

    // Main Brick Facade
    const body = BABYLON.MeshBuilder.CreateBox('riverside_body', { width: bWidth, height: bHeight, depth: bDepth }, this.scene);
    body.position = new BABYLON.Vector3(0, bHeight / 2, 0);
    body.parent = root;
    body.material = this.matBrick;
    body.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(body);
    this.meshes.push(body);

    // Concrete Base / Plinth
    const plinth = BABYLON.MeshBuilder.CreateBox('riverside_plinth', { width: bWidth + 0.4, height: 1.2, depth: bDepth + 0.4 }, this.scene);
    plinth.position = new BABYLON.Vector3(0, 0.6, 0);
    plinth.parent = root;
    plinth.material = this.matDarkConcrete;
    this.shadowGenerator.addShadowCaster(plinth);
    this.meshes.push(plinth);

    // Roof Cornice
    const cornice = BABYLON.MeshBuilder.CreateBox('riverside_cornice', { width: bWidth + 0.6, height: 0.6, depth: bDepth + 0.6 }, this.scene);
    cornice.position = new BABYLON.Vector3(0, bHeight + 0.3, 0);
    cornice.parent = root;
    cornice.material = this.matConcrete;
    this.meshes.push(cornice);

    // Windows (Reflective dark glass grids)
    for (let floor = 1; floor <= 4; floor++) {
      for (let col = -1; col <= 1; col++) {
        const win = BABYLON.MeshBuilder.CreateBox(`riverside_win_f${floor}_c${col}`, { width: 1.6, height: 2.0, depth: 0.1 }, this.scene);
        win.position = new BABYLON.Vector3(bWidth / 2 + 0.05, floor * 3.0, col * 3.5);
        win.rotation.y = Math.PI / 2;
        win.parent = root;
        win.material = this.matGlass;
        this.meshes.push(win);
      }
    }

    // Metal Fire Escape (Industrial black steel)
    const fireEscape = BABYLON.MeshBuilder.CreateBox('riverside_fire_escape', { width: 1.2, height: 11.0, depth: 2.2 }, this.scene);
    fireEscape.position = new BABYLON.Vector3(bWidth / 2 + 0.6, 6.0, 4.0);
    fireEscape.parent = root;
    fireEscape.material = this.matMetal;
    this.shadowGenerator.addShadowCaster(fireEscape);
    this.meshes.push(fireEscape);

    // Register Solid Collision AABB
    this.collisionManager.addBoxCollider({
      id: 'col_building_riverside',
      name: 'Riverside Apartments',
      type: ColliderType.BUILDING,
      min: { x: -20.0, y: 0.0, z: 1.0 },
      max: { x: -8.0, y: 16.0, z: 15.0 },
      isSolid: true
    });
  }

  /**
   * Building 2: Operational Safehouse with Walkable Interior
   * Position: West side, X = -12.0m, Z = -14.0m
   */
  _buildSafehouseWithInterior() {
    const root = new BABYLON.TransformNode('building_safehouse', this.scene);
    root.position = new BABYLON.Vector3(-12.0, 0, -14.0);

    const sWidth = 9.0;
    const sHeight = 4.2;
    const sDepth = 9.0;
    const wallThick = 0.4;

    // 1. Interior Floor
    const floor = BABYLON.MeshBuilder.CreateBox('safehouse_floor', { width: sWidth, height: 0.2, depth: sDepth }, this.scene);
    floor.position = new BABYLON.Vector3(0, 0.1, 0);
    floor.parent = root;
    floor.material = this.matConcrete;
    floor.receiveShadows = true;
    this.meshes.push(floor);

    // 2. Ceiling / Roof
    const roof = BABYLON.MeshBuilder.CreateBox('safehouse_roof', { width: sWidth + 0.6, height: 0.3, depth: sDepth + 0.6 }, this.scene);
    roof.position = new BABYLON.Vector3(0, sHeight, 0);
    roof.parent = root;
    roof.material = this.matConcrete;
    this.shadowGenerator.addShadowCaster(roof);
    this.meshes.push(roof);

    // 3. West Exterior Wall (Back wall, Solid)
    const wallWest = BABYLON.MeshBuilder.CreateBox('safehouse_wall_west', { width: wallThick, height: sHeight, depth: sDepth }, this.scene);
    wallWest.position = new BABYLON.Vector3(-sWidth / 2 + wallThick / 2, sHeight / 2, 0);
    wallWest.parent = root;
    wallWest.material = this.matBrick;
    this.shadowGenerator.addShadowCaster(wallWest);
    this.meshes.push(wallWest);

    // 4. North Wall (Solid)
    const wallNorth = BABYLON.MeshBuilder.CreateBox('safehouse_wall_north', { width: sWidth, height: sHeight, depth: wallThick }, this.scene);
    wallNorth.position = new BABYLON.Vector3(0, sHeight / 2, sDepth / 2 - wallThick / 2);
    wallNorth.parent = root;
    wallNorth.material = this.matBrick;
    this.shadowGenerator.addShadowCaster(wallNorth);
    this.meshes.push(wallNorth);

    // 5. South Wall (Solid)
    const wallSouth = BABYLON.MeshBuilder.CreateBox('safehouse_wall_south', { width: sWidth, height: sHeight, depth: wallThick }, this.scene);
    wallSouth.position = new BABYLON.Vector3(0, sHeight / 2, -sDepth / 2 + wallThick / 2);
    wallSouth.parent = root;
    wallSouth.material = this.matBrick;
    this.shadowGenerator.addShadowCaster(wallSouth);
    this.meshes.push(wallSouth);

    // 6. East Wall (Front facing street, with 1.6m wide Open Doorway)
    // Left segment
    const wallEastLeft = BABYLON.MeshBuilder.CreateBox('safehouse_wall_east_left', { width: wallThick, height: sHeight, depth: 3.5 }, this.scene);
    wallEastLeft.position = new BABYLON.Vector3(sWidth / 2 - wallThick / 2, sHeight / 2, 2.75);
    wallEastLeft.parent = root;
    wallEastLeft.material = this.matBrick;
    this.shadowGenerator.addShadowCaster(wallEastLeft);
    this.meshes.push(wallEastLeft);

    // Right segment
    const wallEastRight = BABYLON.MeshBuilder.CreateBox('safehouse_wall_east_right', { width: wallThick, height: sHeight, depth: 3.5 }, this.scene);
    wallEastRight.position = new BABYLON.Vector3(sWidth / 2 - wallThick / 2, sHeight / 2, -2.75);
    wallEastRight.parent = root;
    wallEastRight.material = this.matBrick;
    this.shadowGenerator.addShadowCaster(wallEastRight);
    this.meshes.push(wallEastRight);

    // Lintel above doorway
    const lintel = BABYLON.MeshBuilder.CreateBox('safehouse_lintel', { width: wallThick, height: 1.6, depth: 2.0 }, this.scene);
    lintel.position = new BABYLON.Vector3(sWidth / 2 - wallThick / 2, sHeight - 0.8, 0);
    lintel.parent = root;
    lintel.material = this.matDarkConcrete;
    this.shadowGenerator.addShadowCaster(lintel);
    this.meshes.push(lintel);

    // 7. Interior Operational Desk & Terminal
    const desk = BABYLON.MeshBuilder.CreateBox('safehouse_desk', { width: 2.4, height: 0.9, depth: 1.2 }, this.scene);
    desk.position = new BABYLON.Vector3(-2.2, 0.45, 0);
    desk.parent = root;
    desk.material = this.matWood;
    desk.receiveShadows = true;
    this.meshes.push(desk);

    // Supply crate
    const crate = BABYLON.MeshBuilder.CreateBox('safehouse_supply_crate', { width: 1.1, height: 0.8, depth: 0.9 }, this.scene);
    crate.position = new BABYLON.Vector3(-2.2, 0.4, 2.6);
    crate.parent = root;
    crate.material = this.matMetal;
    this.meshes.push(crate);

    // Safehouse Interior Practical Emergency Light (Amber warm LED)
    const safehouseLight = new BABYLON.PointLight('safehouseEmergencyLight', new BABYLON.Vector3(-12.0, 3.2, -14.0), this.scene);
    safehouseLight.diffuse = new BABYLON.Color3(1.0, 0.65, 0.25); // Warm emergency amber
    safehouseLight.specular = new BABYLON.Color3(0.5, 0.35, 0.1);
    safehouseLight.intensity = 1.4;
    safehouseLight.range = 8.0;
    this.lights.push(safehouseLight);

    // Register Separate Colliders for Safehouse (Allows player to walk through doorway)
    // Walkable Interior Floor
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_floor',
      name: 'Safehouse Interior Floor',
      type: ColliderType.FLOOR,
      min: { x: -16.5, y: 0.0, z: -18.5 },
      max: { x: -7.5, y: 0.2, z: -9.5 },
      isSolid: false,
      isWalkable: true
    });

    // West Wall
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_wall_west',
      name: 'Safehouse West Wall',
      type: ColliderType.WALL,
      min: { x: -16.7, y: 0.0, z: -18.7 },
      max: { x: -16.1, y: 4.5, z: -9.3 },
      isSolid: true
    });

    // North Wall
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_wall_north',
      name: 'Safehouse North Wall',
      type: ColliderType.WALL,
      min: { x: -16.7, y: 0.0, z: -9.7 },
      max: { x: -7.3, y: 4.5, z: -9.3 },
      isSolid: true
    });

    // South Wall
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_wall_south',
      name: 'Safehouse South Wall',
      type: ColliderType.WALL,
      min: { x: -16.7, y: 0.0, z: -18.7 },
      max: { x: -7.3, y: 4.5, z: -18.3 },
      isSolid: true
    });

    // East Wall Left
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_wall_east_left',
      name: 'Safehouse East Wall Left',
      type: ColliderType.WALL,
      min: { x: -7.7, y: 0.0, z: -13.0 },
      max: { x: -7.3, y: 4.5, z: -9.3 },
      isSolid: true
    });

    // East Wall Right
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_wall_east_right',
      name: 'Safehouse East Wall Right',
      type: ColliderType.WALL,
      min: { x: -7.7, y: 0.0, z: -18.7 },
      max: { x: -7.3, y: 4.5, z: -15.0 },
      isSolid: true
    });

    // Interior Desk & Crate
    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_desk',
      name: 'Safehouse Desk',
      type: ColliderType.PROP,
      min: { x: -15.4, y: 0.0, z: -14.6 },
      max: { x: -13.0, y: 1.0, z: -13.4 },
      isSolid: true
    });

    this.collisionManager.addBoxCollider({
      id: 'col_safehouse_crate',
      name: 'Safehouse Supply Crate',
      type: ColliderType.PROP,
      min: { x: -14.8, y: 0.0, z: -12.0 },
      max: { x: -13.6, y: 0.9, z: -10.8 },
      isSolid: true
    });
  }

  /**
   * Building 3: Urban Retail Storefront
   * Position: East side, X = 13.0m, Z = 14.0m
   */
  _buildStorefront() {
    const root = new BABYLON.TransformNode('building_storefront', this.scene);
    root.position = new BABYLON.Vector3(13.0, 0, 14.0);

    const bWidth = 11.0;
    const bHeight = 8.5;
    const bDepth = 12.0;

    // Main Structure
    const body = BABYLON.MeshBuilder.CreateBox('storefront_body', { width: bWidth, height: bHeight, depth: bDepth }, this.scene);
    body.position = new BABYLON.Vector3(0, bHeight / 2, 0);
    body.parent = root;
    body.material = this.matDarkConcrete;
    body.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(body);
    this.meshes.push(body);

    // Large Glass Display Windows on Street Facade
    const glassDisplay = BABYLON.MeshBuilder.CreateBox('storefront_glass', { width: 0.1, height: 3.2, depth: 8.0 }, this.scene);
    glassDisplay.position = new BABYLON.Vector3(-bWidth / 2 - 0.05, 2.0, 0);
    glassDisplay.parent = root;
    glassDisplay.material = this.matGlass;
    this.meshes.push(glassDisplay);

    // Awning Overhang
    const awning = BABYLON.MeshBuilder.CreateBox('storefront_awning', { width: 1.6, height: 0.2, depth: 8.4 }, this.scene);
    awning.position = new BABYLON.Vector3(-bWidth / 2 - 0.8, 3.8, 0);
    awning.parent = root;
    awning.material = this.matMetal;
    this.shadowGenerator.addShadowCaster(awning);
    this.meshes.push(awning);

    // Solid Collider
    this.collisionManager.addBoxCollider({
      id: 'col_building_storefront',
      name: 'Retail Storefront',
      type: ColliderType.BUILDING,
      min: { x: 7.5, y: 0.0, z: 8.0 },
      max: { x: 18.5, y: 8.5, z: 20.0 },
      isSolid: true
    });
  }

  /**
   * Building 4: Substation & Electrical Utility Hub
   * Position: East side, X = 13.0m, Z = -14.0m
   */
  _buildSubstationHub() {
    const root = new BABYLON.TransformNode('building_substation', this.scene);
    root.position = new BABYLON.Vector3(13.0, 0, -14.0);

    // Main Substation Concrete Enclosure
    const bWidth = 8.0;
    const bHeight = 5.0;
    const bDepth = 8.0;

    const mainBuilding = BABYLON.MeshBuilder.CreateBox('substation_body', { width: bWidth, height: bHeight, depth: bDepth }, this.scene);
    mainBuilding.position = new BABYLON.Vector3(0, bHeight / 2, 0);
    mainBuilding.parent = root;
    mainBuilding.material = this.matConcrete;
    mainBuilding.receiveShadows = true;
    this.shadowGenerator.addShadowCaster(mainBuilding);
    this.meshes.push(mainBuilding);

    // High Voltage Transformer Equipment Cylinders
    for (let i = -1; i <= 1; i += 2) {
      const transformer = BABYLON.MeshBuilder.CreateCylinder(`substation_xfmr_${i}`, { diameter: 1.4, height: 2.8, tessellation: 16 }, this.scene);
      transformer.position = new BABYLON.Vector3(-2.0, 1.4, i * 2.2);
      transformer.parent = root;
      transformer.material = this.matMetal;
      this.shadowGenerator.addShadowCaster(transformer);
      this.meshes.push(transformer);
    }

    // Security Chain-Link Fence along sidewalk boundary
    const fence = BABYLON.MeshBuilder.CreateBox('substation_fence', { width: 0.1, height: 2.4, depth: 9.0 }, this.scene);
    fence.position = new BABYLON.Vector3(-bWidth / 2 - 1.2, 1.2, 0);
    fence.parent = root;
    fence.material = this.matMetal;
    this.shadowGenerator.addShadowCaster(fence);
    this.meshes.push(fence);

    // Solid Collider
    this.collisionManager.addBoxCollider({
      id: 'col_building_substation',
      name: 'Substation Hub',
      type: ColliderType.BUILDING,
      min: { x: 7.8, y: 0.0, z: -19.0 },
      max: { x: 18.0, y: 5.5, z: -9.0 },
      isSolid: true
    });
  }

  /**
   * Realistic Modern 4x4 Tactical SUV (Parked Vehicle)
   * Position: Curbside, X = -2.8m, Z = 2.0m
   */
  _buildParkedSUV() {
    const root = new BABYLON.TransformNode('vehicle_suv_patrol', this.scene);
    root.position = new BABYLON.Vector3(-2.8, 0, 2.0);
    root.rotation.y = Math.PI; // Parked facing south

    // 1. Lower Chassis & Skid Plate
    const chassis = BABYLON.MeshBuilder.CreateBox('suv_chassis', { width: 2.1, height: 0.55, depth: 4.8 }, this.scene);
    chassis.position = new BABYLON.Vector3(0, 0.55, 0);
    chassis.parent = root;
    chassis.material = this.matCleanMetal;
    this.shadowGenerator.addShadowCaster(chassis);
    this.meshes.push(chassis);

    // 2. Main Body / Hood & Trunk
    const body = BABYLON.MeshBuilder.CreateBox('suv_body', { width: 2.15, height: 0.7, depth: 4.6 }, this.scene);
    body.position = new BABYLON.Vector3(0, 1.05, 0);
    body.parent = root;
    body.material = this.matVehiclePaint;
    this.shadowGenerator.addShadowCaster(body);
    this.meshes.push(body);

    // 3. Cabin & Tinted Windows
    const cabin = BABYLON.MeshBuilder.CreateBox('suv_cabin', { width: 1.95, height: 0.65, depth: 2.8 }, this.scene);
    cabin.position = new BABYLON.Vector3(0, 1.65, -0.3);
    cabin.parent = root;
    cabin.material = this.matGlass;
    this.shadowGenerator.addShadowCaster(cabin);
    this.meshes.push(cabin);

    // 4. Roof Rack
    const roofRack = BABYLON.MeshBuilder.CreateBox('suv_roofrack', { width: 1.8, height: 0.1, depth: 2.4 }, this.scene);
    roofRack.position = new BABYLON.Vector3(0, 2.0, -0.3);
    roofRack.parent = root;
    roofRack.material = this.matMetal;
    this.meshes.push(roofRack);

    // 5. Rugged Off-Road Wheels
    const wheelPositions = [
      { x: -1.05, y: 0.45, z: 1.5 },
      { x: 1.05, y: 0.45, z: 1.5 },
      { x: -1.05, y: 0.45, z: -1.5 },
      { x: 1.05, y: 0.45, z: -1.5 }
    ];

    const wheelMat = this.texGen.createMetalMaterial('#15171a', false);
    wheelPositions.forEach((pos, idx) => {
      const wheel = BABYLON.MeshBuilder.CreateCylinder(`suv_wheel_${idx}`, { diameter: 0.85, height: 0.35, tessellation: 20 }, this.scene);
      wheel.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.parent = root;
      wheel.material = wheelMat;
      this.shadowGenerator.addShadowCaster(wheel);
      this.meshes.push(wheel);
    });

    // 6. Front Grille & Bullbar
    const bullbar = BABYLON.MeshBuilder.CreateBox('suv_bullbar', { width: 1.8, height: 0.6, depth: 0.2 }, this.scene);
    bullbar.position = new BABYLON.Vector3(0, 0.8, 2.45);
    bullbar.parent = root;
    bullbar.material = this.matMetal;
    this.meshes.push(bullbar);

    // 7. Practical Headlights (Halogen illumination cast onto street)
    const headlightMat = new BABYLON.StandardMaterial('mat_headlight_glow', this.scene);
    headlightMat.emissiveColor = new BABYLON.Color3(1.0, 0.95, 0.8);
    [-0.7, 0.7].forEach((hx, hidx) => {
      const hl = BABYLON.MeshBuilder.CreateBox(`suv_headlight_${hidx}`, { width: 0.35, height: 0.2, depth: 0.05 }, this.scene);
      hl.position = new BABYLON.Vector3(hx, 1.0, 2.42);
      hl.parent = root;
      hl.material = headlightMat;
      this.meshes.push(hl);
    });

    // SUV Headlight Spotlights
    const suvSpotlight = new BABYLON.SpotLight('suvHeadlightCone', new BABYLON.Vector3(-2.8, 0.9, -0.4), new BABYLON.Vector3(0, -0.15, -1.0).normalize(), Math.PI / 3, 2, this.scene);
    suvSpotlight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);
    suvSpotlight.intensity = 2.0;
    suvSpotlight.range = 22.0;
    this.lights.push(suvSpotlight);

    // Register Solid Vehicle Collider (Length 4.8m, Width 2.2m, Height 2.0m)
    this.collisionManager.addBoxCollider({
      id: 'col_vehicle_suv',
      name: 'Tactical 4x4 SUV',
      type: ColliderType.VEHICLE,
      min: { x: -3.9, y: 0.0, z: -0.4 },
      max: { x: -1.7, y: 2.1, z: 4.4 },
      isSolid: true
    });
  }

  /**
   * Street Infrastructure & Props (Streetlights, Jersey Barriers, Dumpster, Utility Box)
   */
  _buildStreetProps() {
    // 1. Concrete Jersey Highway Barriers (Street barricades)
    const barrier1 = BABYLON.MeshBuilder.CreateBox('prop_barrier_north', { width: 0.6, height: 0.9, depth: 3.5 }, this.scene);
    barrier1.position = new BABYLON.Vector3(0, 0.45, 24.0);
    barrier1.rotation.y = Math.PI / 2;
    barrier1.material = this.matConcrete;
    this.shadowGenerator.addShadowCaster(barrier1);
    this.meshes.push(barrier1);

    this.collisionManager.addBoxCollider({
      id: 'col_barrier_north',
      name: 'North Street Barrier',
      type: ColliderType.BARRIER,
      min: { x: -1.8, y: 0.0, z: 23.7 },
      max: { x: 1.8, y: 0.9, z: 24.3 },
      isSolid: true
    });

    const barrier2 = BABYLON.MeshBuilder.CreateBox('prop_barrier_south', { width: 0.6, height: 0.9, depth: 3.5 }, this.scene);
    barrier2.position = new BABYLON.Vector3(0, 0.45, -24.0);
    barrier2.rotation.y = Math.PI / 2;
    barrier2.material = this.matConcrete;
    this.shadowGenerator.addShadowCaster(barrier2);
    this.meshes.push(barrier2);

    this.collisionManager.addBoxCollider({
      id: 'col_barrier_south',
      name: 'South Street Barrier',
      type: ColliderType.BARRIER,
      min: { x: -1.8, y: 0.0, z: -24.3 },
      max: { x: 1.8, y: 0.9, z: -23.7 },
      isSolid: true
    });

    // 2. Heavy Industrial Metal Dumpster (East sidewalk)
    const dumpster = BABYLON.MeshBuilder.CreateBox('prop_dumpster', { width: 1.6, height: 1.3, depth: 1.2 }, this.scene);
    dumpster.position = new BABYLON.Vector3(5.2, 0.85, -5.0);
    dumpster.material = this.matMetal;
    this.shadowGenerator.addShadowCaster(dumpster);
    this.meshes.push(dumpster);

    this.collisionManager.addBoxCollider({
      id: 'col_prop_dumpster',
      name: 'Metal Dumpster',
      type: ColliderType.PROP,
      min: { x: 4.4, y: 0.0, z: -5.6 },
      max: { x: 6.0, y: 1.6, z: -4.4 },
      isSolid: true
    });

    // 3. Electrical Utility Junction Box (West sidewalk)
    const utilityBox = BABYLON.MeshBuilder.CreateBox('prop_utility_box', { width: 0.8, height: 1.5, depth: 0.7 }, this.scene);
    utilityBox.position = new BABYLON.Vector3(-5.2, 0.95, -6.0);
    utilityBox.material = this.matMetal;
    this.shadowGenerator.addShadowCaster(utilityBox);
    this.meshes.push(utilityBox);

    this.collisionManager.addBoxCollider({
      id: 'col_prop_utility_box',
      name: 'Utility Box',
      type: ColliderType.PROP,
      min: { x: -5.6, y: 0.0, z: -6.4 },
      max: { x: -4.8, y: 1.8, z: -5.6 },
      isSolid: true
    });

    // 4. Streetlights (Poles + Emergency Battery Lamp Fixture)
    const streetlightLocations = [
      { x: -5.4, z: -1.0 },
      { x: -5.4, z: 18.0 },
      { x: 5.4, z: -18.0 },
      { x: 5.4, z: 10.0 }
    ];

    streetlightLocations.forEach((loc, idx) => {
      const pole = BABYLON.MeshBuilder.CreateCylinder(`streetlight_pole_${idx}`, { diameter: 0.22, height: 5.5 }, this.scene);
      pole.position = new BABYLON.Vector3(loc.x, 2.85, loc.z);
      pole.material = this.matCleanMetal;
      this.shadowGenerator.addShadowCaster(pole);
      this.meshes.push(pole);

      const arm = BABYLON.MeshBuilder.CreateBox(`streetlight_arm_${idx}`, { width: loc.x < 0 ? 1.4 : -1.4, height: 0.15, depth: 0.2 }, this.scene);
      arm.position = new BABYLON.Vector3(loc.x < 0 ? loc.x + 0.6 : loc.x - 0.6, 5.5, loc.z);
      arm.material = this.matCleanMetal;
      this.meshes.push(arm);

      // Solid Pole Collider
      this.collisionManager.addBoxCollider({
        id: `col_streetlight_${idx}`,
        name: `Streetlight Pole ${idx}`,
        type: ColliderType.PROP,
        min: { x: loc.x - 0.25, y: 0.0, z: loc.z - 0.25 },
        max: { x: loc.x + 0.25, y: 5.5, z: loc.z + 0.25 },
        isSolid: true
      });
    });

    // Practical Emergency Street Beacon on Streetlight 0 (Flickering low-power sodium light)
    const emergencyBeacon = new BABYLON.PointLight('emergencyStreetBeacon', new BABYLON.Vector3(-4.8, 5.3, -1.0), this.scene);
    emergencyBeacon.diffuse = new BABYLON.Color3(1.0, 0.75, 0.3); // Sodium vapor
    emergencyBeacon.intensity = 1.2;
    emergencyBeacon.range = 14.0;
    this.lights.push(emergencyBeacon);
  }
}
