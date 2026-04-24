(async () => {
  const container = document.getElementById('water-container');
  if (!container) return;
  if (window.innerWidth <= 768 || 'ontouchstart' in window) return;

  try {
    // Загрузка PixiJS v8
    if (typeof PIXI === 'undefined' || !PIXI.Application?.prototype?.init) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.6.6/pixi.min.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    // Загрузка GSAP
    if (typeof gsap === 'undefined') {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    const app = new PIXI.Application();
    await app.init({
      resizeTo: container,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    container.appendChild(app.canvas);

    function loadImage(src) {
      return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });
    }

    // ====== ПРЕСЕТ ======
    const WATER = {
      idleBaseX: 6,
      idleBaseY: 4,
      idleAnimX: 10,
      idleAnimY: 6,
      idleDuration: 9,

      followLerp: 0.26,

      cursorSize: 560,
      cursorBaseForce: 10,
      cursorSpeedForce: 0.18,
      cursorForceMax: 30,

      trailSpawnGap: 70,
      trailLife: 1.85,
      trailStartScale: 0.75,
      trailEndScale: 2.9,
      trailForce: 18,

      globalBoostMul: 0.035,
      globalBoostMaxX: 22,
      globalBoostMaxY: 14,

      speedClamp: 160
    };

    // Мягкая градиентная карта (для cursor + trail)
    function createFlowMap(size = 512) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(size, size);
      const center = size / 2;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = dist / center;

          const bump = Math.exp(-Math.pow(t * 2.2, 2)) * 50;
          const bump2 = Math.exp(-Math.pow((t - 0.5) * 3, 2)) * 15;
          const angle = Math.atan2(dy, dx);
          const strength = (bump + bump2) * (1 - t * 0.3);

          const r = 128 + Math.cos(angle) * strength;
          const g = 128 + Math.sin(angle) * strength;

          const i = (y * size + x) * 4;
          imgData.data[i] = Math.max(0, Math.min(255, r));
          imgData.data[i + 1] = Math.max(0, Math.min(255, g));
          imgData.data[i + 2] = 128;
          imgData.data[i + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }

    // Базовая water displacement карта
    function createWaterMap(size = 512) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const w1 = Math.sin(x * 0.006) * 30;
          const w2 = Math.sin(y * 0.009 + x * 0.003) * 25;
          const w3 = Math.sin(x * 0.014 + y * 0.008) * 18;
          const w4 = Math.cos(y * 0.012 - x * 0.005) * 15;
          const w5 = Math.sin(x * 0.028 + y * 0.018) * 8;
          const noise = Math.sin(x * 0.11) * Math.cos(y * 0.09) * 3 +
                        Math.sin(x * 0.23 + y * 0.17) * 2;
          const v = 128 + w1 + w2 + w3 + w4 + w5 + noise;
          const clamped = Math.max(0, Math.min(255, v));
          imgData.data[i] = clamped;
          imgData.data[i + 1] = clamped;
          imgData.data[i + 2] = clamped;
          imgData.data[i + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }

    // ====== СЦЕНА ======
    const scene = new PIXI.Container();
    app.stage.addChild(scene);

    // 1. Фон
    const bgImg = await loadImage('/img/aquarium-bottom.jpg');
    const bg = new PIXI.Sprite(PIXI.Texture.from(bgImg));
    bg.width = app.screen.width;
    bg.height = app.screen.height;
    scene.addChild(bg);

    // 2. БАЗОВАЯ ВОДА
    const baseDispCanvas = createWaterMap(512);
    const baseDispTexture = PIXI.Texture.from(baseDispCanvas);
    if (baseDispTexture.source) {
      baseDispTexture.source.addressMode = 'repeat';
    }

    const baseDisp = new PIXI.Sprite(baseDispTexture);
    baseDisp.alpha = 0;
    baseDisp.anchor.set(0.5);
    baseDisp.x = app.screen.width / 2;
    baseDisp.y = app.screen.height / 2;
    baseDisp.width = app.screen.width * 1.8;
    baseDisp.height = app.screen.height * 1.8;
    app.stage.addChild(baseDisp);

    // 3. CURSOR LAYER (near-cut, большой, быстрый)
    const flowTexture = PIXI.Texture.from(createFlowMap(512));
    const cursorDisp = new PIXI.Sprite(flowTexture);
    cursorDisp.alpha = 0;
    cursorDisp.anchor.set(0.5);
    cursorDisp.x = app.screen.width / 2;
    cursorDisp.y = app.screen.height / 2;
    cursorDisp.width = WATER.cursorSize;
    cursorDisp.height = WATER.cursorSize;
    app.stage.addChild(cursorDisp);

    // 4. ФИЛЬТРЫ
    const baseFilter = new PIXI.DisplacementFilter(baseDisp, WATER.idleBaseX);
    baseFilter.scale.x = WATER.idleBaseX;
    baseFilter.scale.y = WATER.idleBaseY;

    const cursorFilter = new PIXI.DisplacementFilter(cursorDisp, 0);
    cursorFilter.scale.x = 0;
    cursorFilter.scale.y = 0;

    // ====== TRAIL SYSTEM ======
    const activeTrails = [];
    let lastTrailTime = 0;

    function rebuildFilters() {
      scene.filters = [baseFilter, cursorFilter, ...activeTrails.map(t => t.filter)];
    }

    function spawnTrail(x, y, speed, angle) {
      const sprite = new PIXI.Sprite(flowTexture);
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.rotation = angle;
      sprite.alpha = 0;
      sprite.width = WATER.cursorSize;
      sprite.height = WATER.cursorSize * 0.55;
      app.stage.addChild(sprite);

      const filter = new PIXI.DisplacementFilter(sprite, 0);
      filter.scale.x = 0;
      filter.scale.y = 0;

      const item = { sprite, filter };
      activeTrails.push(item);
      rebuildFilters();

      const power = Math.min(1 + speed * 0.01, 2.0);

      gsap.timeline({
        onComplete: () => {
          const i = activeTrails.indexOf(item);
          if (i !== -1) activeTrails.splice(i, 1);
          rebuildFilters();
          app.stage.removeChild(sprite);
          sprite.destroy();
        }
      })
      .fromTo(sprite.scale,
        { x: WATER.trailStartScale, y: WATER.trailStartScale },
        {
          x: WATER.trailEndScale * power,
          y: WATER.trailEndScale * 0.9 * power,
          duration: WATER.trailLife,
          ease: 'sine.out'
        },
        0
      )
      .fromTo(filter.scale,
        { x: 0, y: 0 },
        {
          x: WATER.trailForce * power,
          y: WATER.trailForce * 0.7 * power,
          duration: 0.22,
          ease: 'power2.out'
        },
        0
      )
      .to(filter.scale, {
        x: 0,
        y: 0,
        duration: WATER.trailLife,
        ease: 'expo.out'
      }, 0.15);
    }

    // ====== IDLE АНИМАЦИЯ БАЗОВОЙ ВОДЫ ======
    gsap.to(baseDisp, {
      x: '+=100',
      y: '+=35',
      duration: 16,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    gsap.to(baseDisp, {
      rotation: 0.05,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    gsap.to(baseFilter.scale, {
      x: WATER.idleAnimX,
      y: WATER.idleAnimY,
      duration: WATER.idleDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // ====== МЫШЬ + TRAIL LOOP ======
    const pointer = { x: app.screen.width / 2, y: app.screen.height / 2 };
    const smoothed = { x: pointer.x, y: pointer.y };
    let prevX = pointer.x;
    let prevY = pointer.y;
    let prevBoostX = pointer.x;
    let prevBoostY = pointer.y;

    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    });

    app.ticker.add(() => {
      const now = performance.now();

      // Сглаженное следование курсора (меньше lag)
      smoothed.x += (pointer.x - smoothed.x) * WATER.followLerp;
      smoothed.y += (pointer.y - smoothed.y) * WATER.followLerp;

      cursorDisp.x = smoothed.x;
      cursorDisp.y = smoothed.y;

      // Скорость мыши
      const speed = Math.min(Math.hypot(pointer.x - prevX, pointer.y - prevY), WATER.speedClamp);
      const angle = Math.atan2(pointer.y - prevY, pointer.x - prevX);

      // Near-cursor cut: мгновенная сила под мышью
      const immediateForce = Math.min(
        WATER.cursorBaseForce + speed * WATER.cursorSpeedForce,
        WATER.cursorForceMax
      );
      cursorFilter.scale.x = immediateForce;
      cursorFilter.scale.y = immediateForce * 0.72;

      // Trail stamps: шлейф за курсором
      if (speed > 6 && now - lastTrailTime > WATER.trailSpawnGap) {
        spawnTrail(smoothed.x, smoothed.y, speed, angle);
        lastTrailTime = now;
      }

      // Global boost: вся вода возмущается при быстрой мыши
      const boostSpeed = Math.min(Math.hypot(pointer.x - prevBoostX, pointer.y - prevBoostY), WATER.speedClamp);
      const boost = Math.min(boostSpeed * WATER.globalBoostMul, 1);
      baseFilter.scale.x = WATER.idleBaseX + (WATER.globalBoostMaxX - WATER.idleBaseX) * boost;
      baseFilter.scale.y = WATER.idleBaseY + (WATER.globalBoostMaxY - WATER.idleBaseY) * boost;

      prevX = pointer.x;
      prevY = pointer.y;
      prevBoostX = pointer.x;
      prevBoostY = pointer.y;
    });

    // Клик — резкий толчок
    window.addEventListener('pointerdown', (e) => {
      gsap.fromTo(cursorFilter.scale,
        { x: 50, y: 50 },
        {
          x: 0,
          y: 0,
          duration: 1.8,
          ease: 'expo.out'
        }
      );
    });

    // ====== RESIZE ======
    const handleResize = () => {
      bg.width = app.screen.width;
      bg.height = app.screen.height;
      baseDisp.x = app.screen.width / 2;
      baseDisp.y = app.screen.height / 2;
      baseDisp.width = app.screen.width * 1.8;
      baseDisp.height = app.screen.height * 1.8;
    };
    window.addEventListener('resize', handleResize);

    // ====== CLEANUP ======
    window.waterCleanup = () => {
      window.removeEventListener('resize', handleResize);
      app.ticker.stop();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };

  } catch (err) {
    console.error('Water init failed:', err);
    container.style.background = 'url(/img/aquarium-bottom.jpg) center/cover no-repeat';
  }
})();
