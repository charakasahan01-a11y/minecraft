/**
 * Procedural pixel-art texture generator for Minecraft-style textures
 * Uses HTML Canvas to generate crisp 16x16 pixel textures
 * with NearestFilter for authentic Minecraft aesthetic.
 */
import * as THREE from 'three';

// Helper to create a canvas texture with pixelated filtering
function createPixelTexture(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pseudo-random deterministic noise helper
function seededRandom(x: number, y: number, seed = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Grass Top Texture (16x16 authentic Minecraft lush green pattern)
 */
export function createGrassTopTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const greens = ['#598f32', '#639c38', '#4f802c', '#6ba73d', '#487627', '#53862f'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 101);
        const colorIdx = Math.floor(rand * greens.length);
        ctx.fillStyle = greens[colorIdx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/**
 * Grass Side Texture
 */
export function createGrassSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const dirtColors = ['#866043', '#795438', '#6b492f', '#8f684a', '#604128'];
    const grassColors = ['#598f32', '#639c38', '#4f802c', '#6ba73d'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 202);
        const colorIdx = Math.floor(rand * dirtColors.length);
        ctx.fillStyle = dirtColors[colorIdx];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const overhang = [3, 4, 3, 5, 4, 3, 4, 3, 5, 4, 3, 4, 3, 5, 4, 3];
    for (let x = 0; x < 16; x++) {
      const depth = overhang[x];
      for (let y = 0; y < depth; y++) {
        const rand = seededRandom(x, y, 303);
        const colorIdx = Math.floor(rand * grassColors.length);
        ctx.fillStyle = grassColors[colorIdx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/**
 * Dirt Texture
 */
export function createDirtTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const dirtColors = ['#866043', '#795438', '#6b492f', '#8f684a', '#604128'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 404);
        const colorIdx = Math.floor(rand * dirtColors.length);
        ctx.fillStyle = dirtColors[colorIdx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/**
 * Cobblestone Texture (16x16)
 */
export function createCobblestoneTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const grays = ['#777777', '#636363', '#525252', '#858585', '#454545', '#929292'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 414);
        ctx.fillStyle = grays[Math.floor(rand * grays.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Mortar outlines
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < 16; i += 4) {
      ctx.fillRect(0, i, 16, 1);
      ctx.fillRect((i * 3) % 16, 0, 1, 16);
    }
  });
}

/**
 * Oak Wood Planks Texture (16x16)
 */
export function createOakPlanksTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const woods = ['#b8945f', '#a8844f', '#c8a46f', '#9a7541'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 424);
        ctx.fillStyle = woods[Math.floor(rand * woods.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Plank horizontal lines
    ctx.fillStyle = '#6d4f26';
    ctx.fillRect(0, 3, 16, 1);
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    // Vertical seams
    ctx.fillRect(7, 0, 1, 3);
    ctx.fillRect(12, 4, 1, 3);
    ctx.fillRect(4, 8, 1, 3);
    ctx.fillRect(10, 12, 1, 3);
  });
}

/**
 * Oak Log Bark Texture (16x16)
 */
export function createOakLogTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const barks = ['#6b5333', '#5a4325', '#7a613f', '#4d371c'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 434);
        ctx.fillStyle = barks[Math.floor(rand * barks.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Vertical bark grooves
    ctx.fillStyle = '#3d2b15';
    for (let x = 1; x < 16; x += 4) {
      ctx.fillRect(x, 0, 1, 16);
    }
  });
}

/**
 * Glass Window Texture
 */
export function createGlassTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#bde5f8';
    ctx.fillRect(0, 0, 16, 16);
    // Frame
    ctx.fillStyle = '#6d4f26';
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillRect(7, 0, 2, 16);
    ctx.fillRect(0, 7, 16, 2);
    // Reflection streaks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 3, 1);
    ctx.fillRect(10, 2, 3, 1);
  });
}

/**
 * Target Archery Bullseye Texture (16x16)
 */
export function createTargetTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // White background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 16, 16);
    // Outer red ring
    ctx.fillStyle = '#d32f2f';
    ctx.strokeRect(1, 1, 14, 14);
    ctx.strokeRect(2, 2, 12, 12);
    // Inner ring
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(4, 4, 8, 8);
    // Red bullseye center
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(6, 6, 4, 4);
    // Center point
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(7, 7, 2, 2);
  });
}

/**
 * Campfire Top Texture (Wood logs + glowing embers)
 */
export function createCampfireTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Ash & coals
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 16, 16);

    // Glowing embers
    const coals = ['#ff4500', '#ff8c00', '#ffd700', '#b22222', '#ff6347'];
    for (let x = 2; x < 14; x++) {
      for (let y = 2; y < 14; y++) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = coals[Math.floor(Math.random() * coals.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Crossed logs
    ctx.fillStyle = '#5a4325';
    ctx.fillRect(1, 6, 14, 4);
    ctx.fillRect(6, 1, 4, 14);
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(7, 7, 2, 2);
  });
}

/**
 * Wheat Crop Texture
 */
export function createWheatTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    // Golden wheat stalks
    const golds = ['#e6c84f', '#d4b335', '#f0d96d', '#8ca336'];
    for (let col = 1; col < 15; col += 3) {
      for (let y = 4; y < 16; y++) {
        ctx.fillStyle = golds[(col + y) % golds.length];
        ctx.fillRect(col, y, 2, 1);
        if (y < 8) {
          ctx.fillRect(col - 1, y, 4, 1);
        }
      }
    }
  });
}

/**
 * Animal Textures: Pig, Cow, Sheep
 */

// Pig Face Texture (16x16)
export function createPigFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Pink skin
    const pinks = ['#f4a6b2', '#ea94a0', '#f9b5c0', '#df8290'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 515);
        ctx.fillStyle = pinks[Math.floor(rand * pinks.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Eyes (x = 1..3 and x = 12..14, y = 6..8)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 6, 3, 2);
    ctx.fillRect(12, 6, 3, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 6, 2, 2);
    ctx.fillRect(12, 6, 2, 2);

    // Big Pig Snout in center (x = 4..11, y = 8..13)
    ctx.fillStyle = '#df7082';
    ctx.fillRect(4, 9, 8, 5);
    ctx.fillStyle = '#cc5669';
    ctx.fillRect(4, 9, 8, 1);
    // Nostrils
    ctx.fillStyle = '#8c2d3d';
    ctx.fillRect(5, 11, 2, 2);
    ctx.fillRect(9, 11, 2, 2);
  });
}

// Pig Body Texture (Pink)
export function createPigBodyTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const pinks = ['#f4a6b2', '#ea94a0', '#f9b5c0', '#df8290'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 525);
        ctx.fillStyle = pinks[Math.floor(rand * pinks.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

// Cow Face Texture
export function createCowFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Brown / Black & White
    const browns = ['#4a3728', '#594433', '#3d2c1e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 616);
        ctx.fillStyle = browns[Math.floor(rand * browns.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // White blaze down center
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(6, 2, 4, 7);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 2, 2);
    ctx.fillRect(12, 6, 2, 2);
    ctx.fillStyle = '#111111';
    ctx.fillRect(3, 6, 1, 2);
    ctx.fillRect(12, 6, 1, 2);

    // Grey muzzle
    ctx.fillStyle = '#8a7d75';
    ctx.fillRect(4, 10, 8, 5);
    ctx.fillStyle = '#3a2d25';
    ctx.fillRect(5, 12, 2, 2);
    ctx.fillRect(9, 12, 2, 2);

    // Horns at top
    ctx.fillStyle = '#d4cbb8';
    ctx.fillRect(1, 0, 2, 2);
    ctx.fillRect(13, 0, 2, 2);
  });
}

// Cow Spotted Body
export function createCowBodyTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const browns = ['#4a3728', '#594433', '#3d2c1e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 626);
        ctx.fillStyle = browns[Math.floor(rand * browns.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // White patches
    ctx.fillStyle = '#ededed';
    ctx.fillRect(2, 2, 6, 5);
    ctx.fillRect(10, 7, 5, 6);
    ctx.fillRect(3, 11, 4, 4);
  });
}

// Sheep Wool Texture (Fluffy white cube texture)
export function createSheepWoolTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const wools = ['#ffffff', '#f5f5f5', '#ededed', '#e0e0e0', '#d8d8d8'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 717);
        ctx.fillStyle = wools[Math.floor(rand * wools.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

// Sheep Face Texture
export function createSheepFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const skins = ['#e8cfbe', '#dbc1b0', '#cfae9d'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 727);
        ctx.fillStyle = skins[Math.floor(rand * skins.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Wool top of head
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 16, 4);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 2, 2);
    ctx.fillRect(12, 6, 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(3, 6, 1, 2);
    ctx.fillRect(12, 6, 1, 2);

    // Pink nose
    ctx.fillStyle = '#e594a0';
    ctx.fillRect(7, 11, 2, 2);
  });
}

// Villager Face & Nose Texture
export function createVillagerFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const skins = ['#d29a75', '#c8906b', '#bc8460', '#dfa883'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 818);
        ctx.fillStyle = skins[Math.floor(rand * skins.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Monobrow
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(3, 5, 10, 2);

    // Green eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 7, 2, 2);
    ctx.fillRect(11, 7, 2, 2);
    ctx.fillStyle = '#1e7b34';
    ctx.fillRect(4, 7, 1, 2);
    ctx.fillRect(11, 7, 1, 2);

    // Big iconic Villager nose
    ctx.fillStyle = '#b57f59';
    ctx.fillRect(6, 8, 4, 6);
    ctx.fillStyle = '#9e6a47';
    ctx.fillRect(6, 13, 4, 1);
  });
}

// Villager Robe (Brown)
export function createVillagerRobeTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const robes = ['#6e4a2c', '#5f3e23', '#7d5433', '#52341b'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 828);
        ctx.fillStyle = robes[Math.floor(rand * robes.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Collar & Belt trim
    ctx.fillStyle = '#3e2413';
    ctx.fillRect(0, 9, 16, 1);
    ctx.fillRect(7, 0, 2, 9);
  });
}

/**
 * Player Skin Textures
 */
export function createHeadFrontTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const skinTones = ['#e0a887', '#d99f7d', '#c98e6e', '#e7b293'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 505);
        ctx.fillStyle = skinTones[Math.floor(rand * skinTones.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const hairColors = ['#492c19', '#3e2413', '#56351f', '#361e10'];
    const hairBangs = [
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2, 3],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3],
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2, 3],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
    ];

    for (let x = 0; x < 16; x++) {
      for (const y of hairBangs[x]) {
        const rand = seededRandom(x, y, 606);
        ctx.fillStyle = hairColors[Math.floor(rand * hairColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 8, 2, 2);
    ctx.fillStyle = '#211832';
    ctx.fillRect(4, 8, 2, 2);

    ctx.fillStyle = '#211832';
    ctx.fillRect(10, 8, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 8, 2, 2);

    ctx.fillStyle = '#b77c5c';
    ctx.fillRect(7, 9, 2, 2);

    ctx.fillStyle = '#6e432a';
    ctx.fillRect(6, 12, 4, 1);
    ctx.fillStyle = '#59341e';
    ctx.fillRect(7, 13, 2, 1);
  });
}

export function createHeadSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const skinTones = ['#e0a887', '#d99f7d', '#c98e6e'];
    const hairColors = ['#492c19', '#3e2413', '#56351f', '#361e10'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 707);
        ctx.fillStyle = hairColors[Math.floor(rand * hairColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    for (let x = 4; x < 12; x++) {
      for (let y = 9; y < 16; y++) {
        const rand = seededRandom(x, y, 808);
        ctx.fillStyle = skinTones[Math.floor(rand * skinTones.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#c98e6e';
    ctx.fillRect(7, 10, 2, 3);
  });
}

export function createHeadBackTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const hairColors = ['#492c19', '#3e2413', '#56351f', '#361e10'];
    const skinTones = ['#e0a887', '#d99f7d'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 909);
        ctx.fillStyle = hairColors[Math.floor(rand * hairColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    for (let x = 3; x < 13; x++) {
      for (let y = 14; y < 16; y++) {
        ctx.fillStyle = skinTones[(x + y) % 2];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

export function createHeadTopTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const hairColors = ['#492c19', '#3e2413', '#56351f', '#361e10'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 1001);
        ctx.fillStyle = hairColors[Math.floor(rand * hairColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

export function createTorsoFrontTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const shirtBlues = ['#0096a6', '#008796', '#08a7b8', '#007b88', '#0aa1b1'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 1101);
        ctx.fillStyle = shirtBlues[Math.floor(rand * shirtBlues.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const skinTones = ['#e0a887', '#d99f7d'];
    for (let x = 5; x <= 10; x++) {
      const rand = seededRandom(x, 0, 1150);
      ctx.fillStyle = skinTones[Math.floor(rand * skinTones.length)];
      ctx.fillRect(x, 0, 1, 1);
    }
    for (let x = 6; x <= 9; x++) {
      ctx.fillStyle = skinTones[0];
      ctx.fillRect(x, 1, 1, 1);
    }
    ctx.fillStyle = skinTones[1];
    ctx.fillRect(7, 2, 2, 1);

    ctx.fillStyle = '#006d77';
    ctx.fillRect(5, 1, 1, 1);
    ctx.fillRect(10, 1, 1, 1);
    ctx.fillRect(6, 2, 1, 1);
    ctx.fillRect(9, 2, 1, 1);
    ctx.fillRect(7, 3, 2, 1);

    ctx.fillStyle = '#00646e';
    ctx.fillRect(0, 15, 16, 1);
  });
}

export function createTorsoBackTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const shirtBlues = ['#0096a6', '#008796', '#08a7b8', '#007b88'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = seededRandom(x, y, 1201);
        ctx.fillStyle = shirtBlues[Math.floor(rand * shirtBlues.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#006d77';
    ctx.fillRect(4, 0, 8, 1);
  });
}

export function createArmTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const shirtBlues = ['#0096a6', '#008796', '#08a7b8'];
    const skinTones = ['#e0a887', '#d99f7d', '#c98e6e', '#e7b293'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 4; y++) {
        const rand = seededRandom(x, y, 1301);
        ctx.fillStyle = shirtBlues[Math.floor(rand * shirtBlues.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.fillStyle = '#006d77';
    ctx.fillRect(0, 3, 16, 1);

    for (let x = 0; x < 16; x++) {
      for (let y = 4; y < 16; y++) {
        const rand = seededRandom(x, y, 1401);
        ctx.fillStyle = skinTones[Math.floor(rand * skinTones.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

export function createLegTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const pantBlues = ['#2b336e', '#232a5c', '#333c82', '#1d234d'];
    const shoeGrays = ['#454545', '#333333', '#2a2a2a', '#525252'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 13; y++) {
        const rand = seededRandom(x, y, 1501);
        ctx.fillStyle = pantBlues[Math.floor(rand * pantBlues.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.fillStyle = '#1a1f44';
    ctx.fillRect(0, 7, 16, 1);

    for (let x = 0; x < 16; x++) {
      for (let y = 13; y < 16; y++) {
        const rand = seededRandom(x, y, 1601);
        ctx.fillStyle = shoeGrays[Math.floor(rand * shoeGrays.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

export function createSunTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#fffbe0';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#fff4a3';
    ctx.fillRect(3, 3, 10, 10);
  });
}
