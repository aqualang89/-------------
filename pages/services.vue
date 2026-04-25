<template>
  <div class="services-wrap">
    <h1>Наши услуги</h1>
    <div class="services-grid">
      <div class="service-card">
        <h3>Дизайн‑проект</h3>
        <p>Индивидуальный проект под ваше пространство. Подбор растений, камней, оборудования.</p>
        <span class="service-price">от 5 000 ₽</span>
      </div>
      <div class="service-card">
        <h3>Монтаж и запуск</h3>
        <p>Полный монтаж «под ключ» с оборудованием. Установка, гидроцикл, запуск системы.</p>
        <span class="service-price">от 30 000 ₽</span>
      </div>
      <div class="service-card">
        <h3>Обслуживание</h3>
        <p>Чистка, подмена воды, контроль параметров. Регулярный уход за аквариумом.</p>
        <span class="service-price">от 3 000 ₽ в месяц</span>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Услуги — Студия аквариумного дизайна' })
</script>

<style scoped>
.services-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  color: #F0EDE5;
}
.services-wrap h1 {
  font-family: 'Noto Serif', serif;
  font-size: 2.2rem;
  margin-bottom: 32px;
}
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.service-card {
  background: #0a1f15;
  border-radius: 12px;
  padding: 32px;
}
.service-card h3 {
  font-size: 1.3rem;
  margin-bottom: 12px;
  color: #F0EDE5;
}
.service-card p {
  color: #bbb;
  line-height: 1.6;
  margin-bottom: 16px;
}
.service-price {
  font-size: 1.2rem;
  color: #6fcf97;
  font-weight: 600;
}
</style>
