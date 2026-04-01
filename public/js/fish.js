(function () {
  const el = document.createElement('div');
  el.id = 'fish-mascot';
  el.innerHTML = `
    <svg width="54" height="36" viewBox="0 0 54 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- хвост -->
      <polygon points="8,18 0,6 0,30" fill="#0097a7"/>
      <!-- тело -->
      <ellipse cx="26" cy="18" rx="18" ry="11" fill="#00bcd4"/>
      <!-- брюшко -->
      <ellipse cx="27" cy="21" rx="12" ry="6" fill="#4dd0e1" opacity="0.5"/>
      <!-- верхний плавник -->
      <path d="M20 7 Q26 1 32 7" stroke="#0097a7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- глаз белок -->
      <circle cx="36" cy="14" r="4" fill="white"/>
      <!-- зрачок -->
      <circle cx="37" cy="14" r="2" fill="#1a1a2e"/>
      <!-- блик -->
      <circle cx="38" cy="13" r="0.8" fill="white"/>
      <!-- рот -->
      <path d="M44 18 Q47 21 44 23" stroke="#0097a7" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- чешуйки -->
      <path d="M24 10 Q26 14 24 18" stroke="#0097a7" stroke-width="1" fill="none" opacity="0.4"/>
      <path d="M30 10 Q32 14 30 18" stroke="#0097a7" stroke-width="1" fill="none" opacity="0.4"/>
    </svg>
  `;

  el.style.cssText = `
    position: fixed;
    z-index: 500;
    pointer-events: none;
    filter: drop-shadow(0 3px 8px rgba(0,188,212,0.35));
    will-change: transform, left, top;
  `;
  document.body.appendChild(el);

  let x = window.innerWidth * 0.3;
  let y = window.innerHeight * 0.5;
  let vx = 1.0;
  let time = 0;
  let flipped = false;
  let targetY = y;
  let lastDirChange = 0;

  function animate() {
    time += 0.018;

    // Иногда меняем целевую высоту
    if (time - lastDirChange > 4 + Math.random() * 4) {
      const margin = 100;
      targetY = margin + Math.random() * (window.innerHeight - margin * 2);
      lastDirChange = time;
    }

    // Плавно тянемся к targetY + синусоида для волны
    y += (targetY - y) * 0.008 + Math.sin(time * 2.2) * 0.6;
    x += vx;

    const maxX = window.innerWidth - 70;
    const minX = 10;

    if (x > maxX) { x = maxX; vx = -(0.8 + Math.random() * 0.6); }
    if (x < minX) { x = minX; vx = (0.8 + Math.random() * 0.6); }

    const shouldFlip = vx < 0;
    if (shouldFlip !== flipped) {
      flipped = shouldFlip;
      el.style.transition = 'transform 0.25s ease';
    }

    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    el.style.transform = flipped ? 'scaleX(-1)' : 'scaleX(1)';

    requestAnimationFrame(animate);
  }

  animate();
})();
