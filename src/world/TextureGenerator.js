import * as BABYLON from '@babylonjs/core';

/**
 * TextureGenerator - Procedural PBR Texture Generator
 * Creates realistic photographic PBR materials using HTML5 Canvas & Babylon.js DynamicTexture.
 * In headless/Node.js testing environments, gracefully falls back to procedural PBR colors.
 */
export class TextureGenerator {
  constructor(scene) {
    this.scene = scene;
    this.cache = new Map();
    this.hasCanvasSupport = typeof document !== 'undefined' || typeof OffscreenCanvas !== 'undefined';
  }

  /**
   * Generates a canvas-based dynamic texture
   */
  _createDynamicTexture(name, width, height, drawFn) {
    if (!this.hasCanvasSupport) return null;

    const key = `${name}_${width}x${height}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const dynTexture = new BABYLON.DynamicTexture(name, { width, height }, this.scene, true);
      const ctx = dynTexture.getContext();
      if (ctx) {
        drawFn(ctx, width, height);
        dynTexture.update(false);
        dynTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        dynTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
      }
      this.cache.set(key, dynTexture);
      return dynTexture;
    } catch (e) {
      // In headless environments where Canvas context is not supported
      return null;
    }
  }

  /**
   * Asphalt Road Texture with wet sheen and tire tracks
   */
  createAsphaltMaterial(uScale = 8, vScale = 8) {
    const pbr = new BABYLON.PBRMaterial('mat_asphalt_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.12, 0.13, 0.15); // Base dark asphalt
    
    // Albedo: Dark grey asphalt with aggregate grain
    const albedoTex = this._createDynamicTexture('asphalt_albedo', 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1c1f24';
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 35;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Subtle asphalt cracks
      ctx.strokeStyle = 'rgba(12, 14, 18, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (Math.random() - 0.5) * 60;
          y += (Math.random() - 0.5) * 60;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    if (albedoTex) {
      albedoTex.uScale = uScale;
      albedoTex.vScale = vScale;
      pbr.albedoTexture = albedoTex;
    }

    // Bump / Normal Map
    const bumpTex = this._createDynamicTexture('asphalt_bump', 256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128 + (Math.random() - 0.5) * 40;
        data[i + 1] = 128 + (Math.random() - 0.5) * 40;
        data[i + 2] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    });

    if (bumpTex) {
      bumpTex.uScale = uScale;
      bumpTex.vScale = vScale;
      pbr.bumpTexture = bumpTex;
    }

    pbr.metallic = 0.15;
    pbr.roughness = 0.65;
    pbr.environmentIntensity = 0.7;
    return pbr;
  }

  /**
   * Road Markings Texture (Yellow centerlines & white lane borders on asphalt)
   */
  createRoadMarkingMaterial(uScale = 1, vScale = 1) {
    const pbr = new BABYLON.PBRMaterial('mat_road_marking_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.14, 0.15, 0.18);
    
    const albedoTex = this._createDynamicTexture('road_marking_albedo', 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1e2229';
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Yellow double dashed center line
      ctx.fillStyle = '#d49b28';
      for (let y = 10; y < h; y += 80) {
        ctx.fillRect(w / 2 - 14, y, 8, 48);
        ctx.fillRect(w / 2 + 6, y, 8, 48);
      }

      // White edge lines
      ctx.fillStyle = '#d0d5dd';
      ctx.fillRect(16, 0, 10, h);
      ctx.fillRect(w - 26, 0, 10, h);
    });

    if (albedoTex) {
      albedoTex.uScale = uScale;
      albedoTex.vScale = vScale;
      pbr.albedoTexture = albedoTex;
    }

    pbr.metallic = 0.1;
    pbr.roughness = 0.6;
    return pbr;
  }

  /**
   * Concrete Sidewalk with slab seams and weathering
   */
  createSidewalkMaterial(uScale = 4, vScale = 4) {
    const pbr = new BABYLON.PBRMaterial('mat_sidewalk_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.42, 0.44, 0.48);
    
    const albedoTex = this._createDynamicTexture('sidewalk_albedo', 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#6e737b';
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      ctx.strokeStyle = '#383b40';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(30, 32, 36, 0.4)';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    });

    if (albedoTex) {
      albedoTex.uScale = uScale;
      albedoTex.vScale = vScale;
      pbr.albedoTexture = albedoTex;
    }

    pbr.metallic = 0.05;
    pbr.roughness = 0.85;
    return pbr;
  }

  /**
   * Realistic Urban Brick Material (Riverside Apartments / Residential)
   */
  createBrickMaterial(uScale = 4, vScale = 4) {
    const pbr = new BABYLON.PBRMaterial('mat_brick_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.45, 0.24, 0.18);

    const albedoTex = this._createDynamicTexture('brick_albedo', 512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#8f8d88';
      ctx.fillRect(0, 0, w, h);

      const brickH = 32;
      const brickW = 64;
      const mortar = 4;

      const brickColors = [
        '#683424', '#7a3e2d', '#5c2d20', '#743829', '#854533', '#52271a'
      ];

      let row = 0;
      for (let y = 0; y < h; y += brickH + mortar) {
        const offset = (row % 2 === 0) ? 0 : -brickW / 2;
        for (let x = offset; x < w + brickW; x += brickW + mortar) {
          ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
          ctx.fillRect(x, y, brickW, brickH);

          ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`;
          ctx.fillRect(x, y, brickW, brickH);
        }
        row++;
      }

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(30, 20, 15, 0.3)');
      grad.addColorStop(1, 'rgba(10, 10, 10, 0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    if (albedoTex) {
      albedoTex.uScale = uScale;
      albedoTex.vScale = vScale;
      pbr.albedoTexture = albedoTex;
    }

    const bumpTex = this._createDynamicTexture('brick_bump', 256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, w, h);

      const brickH = 16;
      const brickW = 32;
      const mortar = 2;

      let row = 0;
      for (let y = 0; y < h; y += brickH + mortar) {
        const offset = (row % 2 === 0) ? 0 : -brickW / 2;
        for (let x = offset; x < w + brickW; x += brickW + mortar) {
          ctx.fillStyle = '#9090ff';
          ctx.fillRect(x, y, brickW, brickH);
        }
        row++;
      }
    });

    if (bumpTex) {
      bumpTex.uScale = uScale;
      bumpTex.vScale = vScale;
      pbr.bumpTexture = bumpTex;
    }

    pbr.metallic = 0.05;
    pbr.roughness = 0.9;
    return pbr;
  }

  /**
   * Industrial Weathered Metal / Steel
   */
  createMetalMaterial(colorHex = '#3a404a', rust = true) {
    const pbr = new BABYLON.PBRMaterial(`mat_metal_${colorHex}`, this.scene);
    pbr.albedoColor = BABYLON.Color3.FromHexString(colorHex);

    const albedoTex = this._createDynamicTexture(`metal_${colorHex}`, 256, 256, (ctx, w, h) => {
      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 25;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      if (rust) {
        ctx.fillStyle = 'rgba(128, 56, 24, 0.45)';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    if (albedoTex) {
      pbr.albedoTexture = albedoTex;
    }

    pbr.metallic = 0.85;
    pbr.roughness = 0.45;
    return pbr;
  }

  /**
   * Concrete Wall / Foundation Material
   */
  createConcreteMaterial(colorHex = '#585d66', uScale = 2, vScale = 2) {
    const pbr = new BABYLON.PBRMaterial(`mat_concrete_${colorHex}`, this.scene);
    pbr.albedoColor = BABYLON.Color3.FromHexString(colorHex);

    const albedoTex = this._createDynamicTexture(`concrete_${colorHex}`, 256, 256, (ctx, w, h) => {
      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    });

    if (albedoTex) {
      albedoTex.uScale = uScale;
      albedoTex.vScale = vScale;
      pbr.albedoTexture = albedoTex;
    }

    pbr.metallic = 0.05;
    pbr.roughness = 0.88;
    return pbr;
  }

  /**
   * Realistic Automotive Vehicle Paint (Dark Slate / Metallic Charcoal)
   */
  createVehiclePaintMaterial(color = '#262d35') {
    const pbr = new BABYLON.PBRMaterial('mat_vehicle_paint', this.scene);
    pbr.albedoColor = BABYLON.Color3.FromHexString(color);
    pbr.metallic = 0.9;
    pbr.roughness = 0.3;
    pbr.environmentIntensity = 1.0;
    return pbr;
  }

  /**
   * Vehicle Tinted Glass Window Material
   */
  createGlassMaterial() {
    const pbr = new BABYLON.PBRMaterial('mat_glass_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.05, 0.07, 0.1);
    pbr.metallic = 0.1;
    pbr.roughness = 0.1;
    pbr.alpha = 0.65;
    pbr.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
    return pbr;
  }

  /**
   * Wood Planks Material (Safehouse Table / Door)
   */
  createWoodMaterial() {
    const pbr = new BABYLON.PBRMaterial('mat_wood_pbr', this.scene);
    pbr.albedoColor = new BABYLON.Color3(0.3, 0.2, 0.12);

    const albedoTex = this._createDynamicTexture('wood_albedo', 256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#4a321e';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#322012';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y + (Math.random() - 0.5) * 4);
        ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 8, w * 0.7, y + (Math.random() - 0.5) * 8, w, y + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
    });

    if (albedoTex) {
      pbr.albedoTexture = albedoTex;
    }

    pbr.metallic = 0.02;
    pbr.roughness = 0.75;
    return pbr;
  }
}
