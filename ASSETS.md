# AFTERLIGHT Asset Registry & Licensing Manifest

**Phase:** Phase 2 (Rendering, Asset Pipeline, World Blockout & Collision Foundation)  
**Game Engine:** Babylon.js v9.28.0 (Modern WebGL2 Engine)  
**Licensing Policy:** 100% Permissive / Open Source (MIT, CC0, Apache 2.0, or Procedurally Synthesized). No unlicensed, proprietary, or restricted assets.

---

## 1. Asset Catalog

| Asset ID | Name | Category | Real Scale (W x H x D) | License | Source / Pipeline | Collision Representation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `building_riverside_apartments` | Riverside Apartments (Multi-Story) | Architecture | 14.0m x 16.0m x 12.0m | MIT / CC0 Equiv | Procedural PBR Brick & Architectural Mesh | Perimeter AABB Wall Colliders |
| `building_safehouse` | Operational Safehouse (Interior + Exterior) | Architecture | 10.0m x 4.5m x 10.0m | MIT / CC0 Equiv | Procedural PBR Concrete & Wood Shell | Individual Wall/Ceiling/Doorway Colliders |
| `building_storefront` | Urban Retail Storefront | Architecture | 12.0m x 8.0m x 10.0m | MIT / CC0 Equiv | Glass & Concrete Storefront Mesh | Perimeter AABB Wall Colliders |
| `building_substation` | Electrical Substation & Utility Hub | Infrastructure | 8.0m x 5.0m x 8.0m | MIT / CC0 Equiv | Industrial Steel & Fence Compound | Solid Compound Collider + Fence |
| `road_main_street` | Two-Lane Asphalt Street with Wet Puddles | Environment | 8.0m x 0.05m x 60.0m | MIT | Dynamic PBR Asphalt Synthesis | Walkable Ground Floor Plane |
| `sidewalk_concrete` | Concrete Sidewalks with Curbs | Environment | 2.5m x 0.2m x 60.0m | MIT | Dynamic PBR Concrete Slab Synthesis | Walkable Elevated Floor (0.2m height) |
| `vehicle_suv_patrol` | Modern 4x4 Tactical SUV | Vehicle | 2.2m x 1.85m x 4.8m | MIT / CC0 Equiv | Modern SUV Model (Chassis, Cab, Wheels, Lights) | Solid Vehicle AABB Collider |
| `prop_streetlight` | Urban Steel Streetlight Pole | Props | 0.4m x 6.0m x 1.5m | MIT | Industrial Steel Tube & Emergency Lamp | Solid Cylinder/Box Collider |
| `prop_jersey_barrier` | Concrete Highway Jersey Barrier | Props | 0.6m x 0.9m x 2.5m | MIT | Distressed Concrete Highway Barrier | Solid Barrier AABB Collider |
| `prop_metal_dumpster` | Industrial Metal Waste Dumpster | Props | 1.8m x 1.4m x 1.2m | MIT | Rusted Steel Container with Lids | Solid Prop AABB Collider |
| `prop_utility_box` | Electrical Junction Utility Box | Props | 1.0m x 1.6m x 0.8m | MIT | Painted Steel Junction Enclosure | Solid Prop AABB Collider |
| `character_operative_survivor` | Contemporary Human Survivor | Character | 0.9m x 1.8m x 0.6m | MIT | Realistic Survivor Model & Rig | Dynamic Capsule Controller (R=0.45, H=1.8) |

---

## 2. Textures & Procedural PBR Synthesis

All materials used in the environment (Asphalt, Sidewalk Concrete, Weathered Brick, Rusted Metal, Highway Concrete, Automotive Paint, Tinted Glass, Wood Planks) are synthesized dynamically via HTML5 Canvas and Babylon.js `DynamicTexture` with normal/bump mapping and PBR metallic-roughness properties.

- **Storage / Generation**: In-memory procedural generation at startup.
- **Dependencies**: 0 external proprietary texture assets.
- **Performance**: Instant load, zero HTTP asset download latency, deterministic reproduction across all client platforms.

---

## 3. glTF / GLB Ingestion Pipeline

The `AssetPipelineLoader` (`src/assets/AssetRegistry.js`) supports runtime loading of standard glTF/GLB models using `@babylonjs/loaders`. Loaded meshes automatically register bounding box colliders in `CollisionManager` and inherit correct world-space scaling.
