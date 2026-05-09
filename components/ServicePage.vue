<template>
  <div class="sh-service">
    <div class="sh-service-hero" data-reveal-up>
      <div class="sh-service-num">{{ num }}</div>
      <h1 class="sh-service-title">{{ title }}</h1>
      <p class="sh-service-lead">{{ lead }}</p>
    </div>
    <div class="sh-service-content" data-reveal>
      <div class="sh-service-img" data-reveal-left>
        <div class="sh-placeholder">Фото скоро</div>
      </div>
      <div class="sh-service-text" data-reveal-right>
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
useScrollReveal()
defineProps({
  num: { type: String, required: true },
  title: { type: String, required: true },
  lead: { type: String, required: true }
})
</script>

<style scoped>
.sh-service {
  background: #1e2933;
  min-height: 100vh;
  padding: 120px 48px 80px;
  color: var(--cream);
}
.sh-service-hero {
  max-width: 800px;
  margin: 0 auto 64px;
  text-align: center;
}
.sh-service-num {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--gold);
  letter-spacing: 0.2em;
  margin-bottom: 16px;
}
.sh-service-title {
  font-family: var(--font-serif);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 400;
  margin: 0 0 24px;
  line-height: 1.1;
}
.sh-service-lead {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 300;
  line-height: 1.7;
  color: var(--cream-dim);
  max-width: 560px;
  margin: 0 auto;
}
.sh-service-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}
.sh-service-img {
  display: flex;
  justify-content: center;
}
.sh-service-text {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.7;
  color: var(--cream-dim);
}
.sh-service-text :deep(p) {
  margin: 0 0 16px;
}
.sh-placeholder {
  width: 100%;
  max-width: 520px;
  aspect-ratio: 16 / 10;
  background: var(--ink-mid);
  border: 1px solid var(--rule);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 18px;
  font-style: italic;
  color: var(--cream-faint);
}
@media (max-width: 768px) {
  .sh-service {
    padding: 100px 24px 48px;
  }
  .sh-service-content {
    grid-template-columns: 1fr;
  }
}
</style>
