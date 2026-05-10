<template>
  <NuxtLink to="/cart" class="cart-icon" aria-label="Корзина">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
    <span v-if="totalCount > 0" class="cart-badge">{{ totalCount }}</span>
  </NuxtLink>
</template>

<script setup>
const { totalCount } = useCart()
</script>

<style scoped>
.cart-icon {
  position: relative;
  display: flex;
  align-items: center;
  color: rgba(241, 230, 200, 0.65);
  text-decoration: none;
  transition: color 0.3s ease;
}
.cart-icon:hover {
  color: #f1e6c8;
}
.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #d9b46a;
  color: #0e1a24;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
