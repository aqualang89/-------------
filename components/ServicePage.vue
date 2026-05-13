<template>
  <div class="sh-service">
    <!-- HERO -->
    <div class="sh-service-hero">
      <div class="sh-service-hero-bg" :style="{ backgroundImage: `url(${heroImage})` }"></div>
      <div class="sh-service-hero-overlay"></div>
      <div class="sh-service-hero-inner" data-reveal-up>
        <span class="sh-service-label">{{ label }}</span>
        <h1 class="sh-service-title">{{ title }}</h1>
        <p class="sh-service-lead">{{ lead }}</p>
      </div>
    </div>

    <!-- INTRO (опционально) -->
    <div v-if="$slots.intro" class="sh-service-intro" data-reveal>
      <slot name="intro" />
    </div>

    <!-- CONTENT -->
    <slot />

    <!-- CLOSING (опционально) -->
    <div v-if="$slots.closing" class="sh-service-closing" data-reveal>
      <slot name="closing" />
    </div>
  </div>
</template>

<script setup>
useScrollReveal()
defineProps({
  heroImage: { type: String, required: true },
  label:     { type: String, default: '' },
  title:     { type: String, required: true },
  lead:      { type: String, required: true }
})
</script>

<style scoped>
.sh-service {
  background: var(--ink-deep);
  min-height: 100vh;
  color: var(--cream);
}

/* ─── HERO ─── */
.sh-service-hero {
  position: relative;
  height: 70vh;
  min-height: 480px;
  max-height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  /* Hero «залезает» под padding навбара, чтобы не было видимой линии между
     фоном страницы и картинкой. Возмещаем padding-top чтобы текст не уехал. */
  margin-top: -80px;
  padding-top: 80px;
}
@media (max-width: 768px) {
  .sh-service-hero {
    margin-top: -72px;
    padding-top: 72px;
  }
}
.sh-service-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 25%;
  filter: brightness(0.85) saturate(0.95);
}
/* Верхний градиент — плавный переход от тёмного фона страницы к фото hero.
   Покрывает зону под навбаром (80px) + плавный fade ещё ~200px вниз. */
.sh-service-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280px;
  background: linear-gradient(
    to bottom,
    var(--ink-deep) 0%,
    var(--ink-deep) 28%,
    rgba(14, 26, 36, 0.6) 60%,
    transparent 100%
  );
  z-index: 2;
  pointer-events: none;
}
.sh-service-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(14, 26, 36, 0.15) 0%,
    rgba(14, 26, 36, 0.4) 60%,
    var(--ink-deep) 100%
  );
}
.sh-service-hero-inner {
  position: relative;
  z-index: 3;
  padding: 0 24px;
  max-width: 720px;
}
.sh-service-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--gold);
}
.sh-service-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 400;
  line-height: 1.05;
  margin: 16px 0 20px;
}
.sh-service-lead {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.7;
  color: var(--cream-dim);
  max-width: 480px;
  margin: 0 auto;
}

/* ─── INTRO ─── */
.sh-service-intro {
  padding: 80px 48px 40px;
  max-width: 780px;
  margin: 0 auto;
  text-align: center;
}
.sh-service-intro :deep(p) {
  font-family: var(--font-serif);
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 300;
  font-style: italic;
  line-height: 1.6;
  color: var(--cream-dim);
  margin: 0;
}

/* ─── SECTIONS (используются в slot) ─── */
:deep(.sh-service-section) {
  max-width: 720px;
  margin: 0 auto;
  padding: 56px 48px;
}
:deep(.sh-section-header) {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}
:deep(.sh-section-num) {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--gold);
}
:deep(.sh-section-title) {
  font-family: var(--font-serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 400;
  line-height: 1.15;
  flex: 1;
}
:deep(.sh-section-year) {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--cream-faint);
  letter-spacing: 0.05em;
}
:deep(.sh-section-body) {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.85;
  color: var(--cream-dim);
}
:deep(.sh-section-body p) {
  margin: 0 0 18px;
}
:deep(.sh-section-body p:last-child) {
  margin-bottom: 0;
}
:deep(.sh-section-body strong) {
  color: var(--cream);
  font-weight: 400;
}

/* Подзаголовки внутри секции */
:deep(.sh-section-subtitle) {
  font-family: var(--font-serif);
  font-size: clamp(20px, 2.8vw, 26px);
  font-weight: 400;
  color: var(--cream);
  margin: 40px 0 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}

/* ─── QUOTES ─── */
:deep(.sh-section-quote) {
  margin: 32px 0 32px 24px;
  padding: 0 0 0 24px;
  border-left: 2px solid var(--gold);
  font-family: var(--font-serif);
  font-size: clamp(18px, 2.2vw, 22px);
  font-weight: 300;
  font-style: italic;
  line-height: 1.55;
  color: var(--cream);
}

/* ─── DIVIDERS ─── */
:deep(.sh-divider) {
  max-width: 720px;
  margin: 0 auto;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--gold) 30%,
    var(--gold-soft) 50%,
    var(--gold) 70%,
    transparent 100%
  );
  opacity: 0.4;
}

/* ─── CLOSING ─── */
.sh-service-closing {
  text-align: center;
  padding: 80px 24px 120px;
}
:deep(.sh-closing-line) {
  width: 48px;
  height: 1px;
  background: var(--gold);
  margin: 0 auto 24px;
  opacity: 0.5;
}
:deep(.sh-closing-text) {
  font-family: var(--font-serif);
  font-size: 16px;
  font-style: italic;
  color: var(--cream-faint);
}

/* ─── MOBILE ─── */
@media (max-width: 768px) {
  .sh-service-hero {
    height: 55vh;
    min-height: 380px;
  }
  .sh-service-intro {
    padding: 56px 24px 24px;
  }
  :deep(.sh-service-section) {
    padding: 40px 24px;
  }
  :deep(.sh-section-quote) {
    margin: 24px 0 24px 12px;
    padding-left: 16px;
  }
  :deep(.sh-section-header) {
    gap: 10px;
    margin-bottom: 24px;
  }
  :deep(.sh-section-subtitle) {
    margin: 32px 0 16px;
  }
}
</style>
