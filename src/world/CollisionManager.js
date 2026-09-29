import * as BABYLON from '@babylonjs/core';

/**
 * Solid Collider Types
 */
export const ColliderType = {
  BUILDING: 'building',
  WALL: 'wall',
  BARRIER: 'barrier',
  PROP: 'prop',
  VEHICLE: 'vehicle',
  FLOOR: 'floor',
  DOOR: 'door',
  TRIGGER: 'trigger'
};

/**
 * CollisionManager
 * Dedicated physics-decoupled collision subsystem for AFTERLIGHT.
 * Handles AABB registry, continuous player-sphere wall sliding, step climbing,
 * ground elevation query, and camera collision raycast sphere probing.
 */
export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.debugMeshes = [];
    this.debugVisible = false;
  }

  /**
   * Registers an Axis-Aligned Bounding Box (AABB) solid obstacle
   * @param {Object} options { id, name, type, min: {x,y,z}, max: {x,y,z}, isSolid, isWalkable, onTrigger }
   */
  addBoxCollider({
    id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name = 'Collider',
    type = ColliderType.WALL,
    min = { x: -1, y: 0, z: -1 },
    max = { x: 1, y: 2, z: 1 },
    isSolid = true,
    isWalkable = false,
    metadata = {}
  }) {
    const collider = {
      id,
      name,
      type,
      min: { x: Math.min(min.x, max.x), y: Math.min(min.y, max.y), z: Math.min(min.z, max.z) },
      max: { x: Math.max(min.x, max.x), y: Math.max(min.y, max.y), z: Math.max(min.z, max.z) },
      isSolid,
      isWalkable,
      enabled: true,
      metadata
    };

    // Calculate center and extents
    collider.center = {
      x: (collider.min.x + collider.max.x) / 2,
      y: (collider.min.y + collider.max.y) / 2,
      z: (collider.min.z + collider.max.z) / 2
    };
    collider.size = {
      x: collider.max.x - collider.min.x,
      y: collider.max.y - collider.min.y,
      z: collider.max.z - collider.min.z
    };

    this.colliders.push(collider);
    return collider;
  }

  /**
   * Registers a collider from a Babylon.js mesh bounding box
   */
  addMeshCollider(mesh, type = ColliderType.PROP, isSolid = true, isWalkable = false) {
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    return this.addBoxCollider({
      id: `mesh_col_${mesh.name}_${mesh.uniqueId}`,
      name: mesh.name,
      type,
      min: { x: min.x, y: min.y, z: min.z },
      max: { x: max.x, y: max.y, z: max.z },
      isSolid,
      isWalkable,
      metadata: { meshId: mesh.id }
    });
  }

  /**
   * Removes a collider by ID
   */
  removeCollider(id) {
    const index = this.colliders.findIndex(c => c.id === id);
    if (index !== -1) {
      this.colliders.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enables or disables a collider (e.g. for doors opening/closing)
   */
  setColliderEnabled(id, enabled) {
    const col = this.colliders.find(c => c.id === id);
    if (col) {
      col.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Clears all registered colliders
   */
  clear() {
    this.colliders = [];
    if (this.debugMeshes.length > 0) {
      this.debugMeshes.forEach(m => m.dispose());
      this.debugMeshes = [];
    }
  }

  /**
   * Checks if an AABB intersects with a 2D/3D sphere
   */
  _sphereIntersectsAABB(sphereCenter, sphereRadius, box) {
    const closestX = Math.max(box.min.x, Math.min(sphereCenter.x, box.max.x));
    const closestY = Math.max(box.min.y, Math.min(sphereCenter.y, box.max.y));
    const closestZ = Math.max(box.min.z, Math.min(sphereCenter.z, box.max.z));

    const dx = sphereCenter.x - closestX;
    const dy = sphereCenter.y - closestY;
    const dz = sphereCenter.z - closestZ;

    const distanceSq = (dx * dx) + (dy * dy) + (dz * dz);
    return distanceSq < (sphereRadius * sphereRadius);
  }

  /**
   * Resolves player horizontal movement with continuous wall sliding and step climbing
   * @param {BABYLON.Vector3} currentPos Current player bottom origin
   * @param {BABYLON.Vector3} targetPos Desired target position after velocity * dt
   * @param {number} radius Player collision cylinder radius (default 0.45m)
   * @param {number} height Player height (default 1.8m)
   * @param {number} stepHeight Maximum climbable step/curb height (default 0.35m)
   * @returns {Object} { position: BABYLON.Vector3, collidedX: boolean, collidedZ: boolean, climbedStep: boolean }
   */
  resolveMovement(currentPos, targetPos, radius = 0.45, height = 1.8, stepHeight = 0.35) {
    let resultX = targetPos.x;
    let resultY = targetPos.y;
    let resultZ = targetPos.z;

    let collidedX = false;
    let collidedZ = false;
    let climbedStep = false;

    // Player vertical bounds for horizontal collision testing (waist to head)
    const playerFeetY = currentPos.y;
    const playerHeadY = currentPos.y + height;
    const checkWaistY = currentPos.y + Math.max(stepHeight + 0.1, height * 0.5);

    // Filter solid active colliders that overlap in Y
    const activeColliders = this.colliders.filter(c => {
      if (!c.enabled || !c.isSolid) return false;
      // Overlap on Y axis
      return c.max.y > (playerFeetY + stepHeight) && c.min.y < playerHeadY;
    });

    // 1. Resolve X-Axis Motion
    const testPosAlongX = new BABYLON.Vector3(resultX, checkWaistY, currentPos.z);
    for (const col of activeColliders) {
      if (this._sphereIntersectsAABB(testPosAlongX, radius, col)) {
        collidedX = true;
        // Push back out along X
        if (currentPos.x < col.center.x) {
          resultX = col.min.x - radius - 0.002;
        } else {
          resultX = col.max.x + radius + 0.002;
        }
      }
    }

    // 2. Resolve Z-Axis Motion
    const testPosAlongZ = new BABYLON.Vector3(resultX, checkWaistY, resultZ);
    for (const col of activeColliders) {
      if (this._sphereIntersectsAABB(testPosAlongZ, radius, col)) {
        collidedZ = true;
        // Push back out along Z
        if (currentPos.z < col.center.z) {
          resultZ = col.min.z - radius - 0.002;
        } else {
          resultZ = col.max.z + radius + 0.002;
        }
      }
    }

    // 3. Ground / Step Check at new position
    const groundHeight = this.getGroundHeight(resultX, resultZ, currentPos.y + 0.5);
    if (groundHeight > playerFeetY && groundHeight <= playerFeetY + stepHeight) {
      // Step climbing: smoothly step onto curb or low obstacle
      resultY = groundHeight;
      climbedStep = true;
    }

    return {
      position: new BABYLON.Vector3(resultX, resultY, resultZ),
      collidedX,
      collidedZ,
      climbedStep
    };
  }

  /**
   * Queries the highest solid walkable surface elevation at (x, z)
   */
  getGroundHeight(x, z, checkStartY = 10.0) {
    let maxGround = 0.0; // Base terrain elevation

    for (const col of this.colliders) {
      if (!col.enabled) continue;
      // Check if (x, z) is within the horizontal footprint of collider
      if (x >= col.min.x && x <= col.max.x && z >= col.min.z && z <= col.max.z) {
        if (col.isWalkable || col.type === ColliderType.FLOOR || col.type === ColliderType.BARRIER) {
          // If the top of this collider is below checkStartY, it can support the player
          if (col.max.y <= checkStartY && col.max.y > maxGround) {
            maxGround = col.max.y;
          }
        }
      }
    }

    return maxGround;
  }

  /**
   * Raycast / Sphere Probe for Camera Collision Avoidance
   * Casts a probe from origin (player focus) to target (ideal camera position).
   * Returns safe position clamped before intersecting any solid geometry.
   */
  resolveCameraPosition(origin, target, probeRadius = 0.3, minDistance = 0.8) {
    const rayDir = target.subtract(origin);
    const fullDistance = rayDir.length();
    
    if (fullDistance < 0.001) {
      return target.clone();
    }

    const normDir = rayDir.scale(1.0 / fullDistance);
    let safeDistance = fullDistance;

    // Check intersection with all solid colliders
    for (const col of this.colliders) {
      if (!col.enabled || !col.isSolid) continue;

      // Expand collider bounds by probeRadius
      const expandedMin = {
        x: col.min.x - probeRadius,
        y: col.min.y - probeRadius,
        z: col.min.z - probeRadius
      };
      const expandedMax = {
        x: col.max.x + probeRadius,
        y: col.max.y + probeRadius,
        z: col.max.z + probeRadius
      };

      const hitDist = this._rayAABBIntersect(origin, normDir, expandedMin, expandedMax);
      if (hitDist !== null && hitDist >= 0 && hitDist < safeDistance) {
        // Safe buffer standoff of 0.25m from wall surface
        const standoff = Math.max(minDistance, hitDist - 0.25);
        if (standoff < safeDistance) {
          safeDistance = standoff;
        }
      }
    }

    safeDistance = Math.max(minDistance, safeDistance);
    return origin.add(normDir.scale(safeDistance));
  }

  /**
   * Ray-AABB Intersection slab method
   */
  _rayAABBIntersect(origin, dir, min, max) {
    let tmin = -Infinity;
    let tmax = Infinity;

    // X slab
    if (Math.abs(dir.x) > 1e-6) {
      let t1 = (min.x - origin.x) / dir.x;
      let t2 = (max.x - origin.x) / dir.x;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else if (origin.x < min.x || origin.x > max.x) {
      return null;
    }

    // Y slab
    if (Math.abs(dir.y) > 1e-6) {
      let t1 = (min.y - origin.y) / dir.y;
      let t2 = (max.y - origin.y) / dir.y;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else if (origin.y < min.y || origin.y > max.y) {
      return null;
    }

    // Z slab
    if (Math.abs(dir.z) > 1e-6) {
      let t1 = (min.z - origin.z) / dir.z;
      let t2 = (max.z - origin.z) / dir.z;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else if (origin.z < min.z || origin.z > max.z) {
      return null;
    }

    return tmin >= 0 ? tmin : (tmax >= 0 ? 0 : null);
  }

  /**
   * Toggles visual debug wireframe bounding boxes
   */
  setDebugVisible(visible) {
    this.debugVisible = visible;
    if (!visible) {
      this.debugMeshes.forEach(m => m.dispose());
      this.debugMeshes = [];
      return;
    }

    // Create wireframes
    if (this.scene) {
      this.colliders.forEach(col => {
        const box = BABYLON.MeshBuilder.CreateBox(`debug_col_${col.id}`, {
          width: col.size.x,
          height: col.size.y,
          depth: col.size.z
        }, this.scene);
        box.position = new BABYLON.Vector3(col.center.x, col.center.y, col.center.z);
        box.isPickable = false;

        const mat = new BABYLON.StandardMaterial(`mat_debug_${col.id}`, this.scene);
        mat.wireframe = true;
        mat.emissiveColor = col.isSolid ? new BABYLON.Color3(1, 0.2, 0.2) : new BABYLON.Color3(0.2, 1, 0.2);
        box.material = mat;
        this.debugMeshes.push(box);
      });
    }
  }
}
