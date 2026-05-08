<template>
  <div class="sh-about">
    <div class="sh-about-hero">
      <span class="sh-about-label">О студии</span>
      <h1 class="sh-about-title">Рипарий</h1>
      <p class="sh-about-lead">
        Студия аквариумного дизайна в Калининграде. Создаём живые подводные пейзажи 
        для домов, офисов и общественных пространств.
      </p>
    </div>

    <div class="sh-about-content">
      <div class="sh-about-img">
        <div class="sh-placeholder">Фото скоро</div>
      </div>
      <div class="sh-about-text">
        <p>
          Каждый проект начинается с разговора. Мы узнаём, какое пространство доступно, 
          какой уход планируется, какие рыбы нравятся — и предлагаем решение, которое 
          будет жить долго и радовать каждый день.
        </p>
        <p>
          Работаем с натуральными материалами: камни, коряги, живые растения, 
          натуральный грунт. Подбираем оборудование под конкретный объём и задачу.
        </p>
        <p>
          После запуска остаёмся на связи: консультируем по уходу, помогаем 
          с подменами воды, подкормкой растений, решением вопросов.
        </p>
      </div>
    </div>

    <div class="sh-about-contacts">
      <h2>Контакты</h2>
      <div class="sh-about-list">
        <div class="sh-about-item">
          <span class="sh-about-item-label">Адрес</span>
          <p>Калининград <em>(уточним позже)</em></p>
        </div>
        <div class="sh-about-item">
          <span class="sh-about-item-label">Телефон</span>
          <p><a href="tel:+70000000000">+7 (XXX) XXX-XX-XX</a></p>
        </div>
        <div class="sh-about-item">
          <span class="sh-about-item-label">Email</span>
          <p><a href="mailto:info@riparium.ru">info@riparium.ru</a></p>
        </div>
        <div class="sh-about-item">
          <span class="sh-about-item-label">Telegram</span>
          <p><a href="https://t.me/riparium" target="_blank" rel="noopener">@riparium</a></p>
        </div>
        <div class="sh-about-item">
          <span class="sh-about-item-label">Часы работы</span>
          <p>Пн–Пт 10:00–19:00</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'О нас — Студия аквариумного дизайна' })
</script>

<style scoped>
.sh-about {
  background: #1e2933;
  min-height: 100vh;
  padding: 120px 48px 80px;
  color: var(--cream);
  max-width: 1200px;
  margin: 0 auto;
}
.sh-about-hero {
  text-align: center;
  margin-bottom: 64px;
}
.sh-about-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
}
.sh-about-title {
  font-family: var(--font-serif);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 400;
  margin: 16px 0 24px;
  line-height: 1.1;
}
.sh-about-lead {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 300;
  line-height: 1.7;
  color: var(--cream-dim);
  max-width: 560px;
  margin: 0 auto;
}
.sh-about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
  margin-bottom: 80px;
}
.sh-about-img {
  display: flex;
  justify-content: center;
}
.sh-about-text {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.7;
  color: var(--cream-dim);
}
.sh-about-text p {
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
.sh-about-contacts h2 {
  font-family: var(--font-serif);
  font-size: 32px;
  margin-bottom: 32px;
  text-align: center;
}
.sh-about-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}
.sh-about-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sh-about-item-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-faint);
}
.sh-about-item p {
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--cream-dim);
  margin: 0;
}
.sh-about-item a {
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-about-item a:hover {
  color: var(--gold);
}
.sh-about-item em {
  color: var(--cream-faint);
  font-style: italic;
}
@media (max-width: 768px) {
  .sh-about {
    padding: 100px 24px 48px;
  }
  .sh-about-content {
    grid-template-columns: 1fr;
  }
}
</style>
