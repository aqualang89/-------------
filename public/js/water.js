// Водный эффект отложен — PixiJS DisplacementFilter не дал результата в v8
// Оставляем минимальный canvas-градиент для интро
// Вернуться: нужен рабочий подход (возможно, Three.js MeshPhysicalMaterial, видео-текстура, или другой метод)

(async () => {
  const container = document.getElementById('water-container');
  if (!container) return;
  if (window.innerWidth <= 768 || 'ontouchstart' in window) return;

  try {
    if (typeof PIXI === 'undefined' || !PIXI.Application?.prototype?.init) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.6.6/pixi.min.js';
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

    // Фон — радиальный градиент
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 1024;
    bgCanvas.height = 1024;
    const ctx = bgCanvas.getContext('2d');
    const g = ctx.createRadialGradient(512, 400, 0, 512, 400, 800);
    g.addColorStop(0, '#024a35');
    g.addColorStop(0.5, '#013220');
    g.addColorStop(1, '#011a10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);

    const bg = PIXI.Sprite.from(bgCanvas);
    bg.width = app.screen.width;
    bg.height = app.screen.height;
    app.stage.addChild(bg);

    window.addEventListener('resize', () => {
      bg.width = app.screen.width;
      bg.height = app.screen.height;
    });

    window.waterCleanup = () => {
      app.ticker.stop();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };

  } catch (err) {
    console.error('Water init failed:', err);
    container.style.background = 'radial-gradient(ellipse at 50% 40%, #024a35 0%, #013220 60%, #011a10 100%)';
  }
})();
