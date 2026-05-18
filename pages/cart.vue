<template>
  <div class="cart-wrap">
    <h1 class="cart-title">Корзина</h1>

    <!-- Success — показываем ПЕРВЫМ, иначе после clear() корзина считается пустой и success-экран теряется -->
    <div v-if="step === 'success'" class="cart-success">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <h2>Заявка отправлена!</h2>
      <p>Спасибо за заказ. Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
      <div class="cart-success-buttons">
        <NuxtLink to="/" class="btn-gold">Хорошо, на главную</NuxtLink>
        <NuxtLink to="/catalog" class="btn-back-link">← В каталог</NuxtLink>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="cart-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <p>Ваша корзина пуста</p>
      <NuxtLink to="/catalog" class="btn-gold">В каталог</NuxtLink>
    </div>

    <!-- Cart items -->
    <div v-else-if="step === 'cart'" class="cart-body">
      <div class="cart-list">
        <div v-for="item in items" :key="item.productId" class="cart-item">
          <img :src="cldImage(item.photo, { w: 200 })" :alt="item.name" class="cart-item-img" loading="lazy" decoding="async">
          <div class="cart-item-info">
            <NuxtLink :to="`/catalog/${item.slug}`" class="cart-item-name">{{ item.name }}</NuxtLink>
            <p v-if="item.article" class="cart-item-article">Артикул: {{ item.article }}</p>
            <div class="cart-item-price">{{ item.price.toLocaleString() }} ₽</div>
          </div>
          <div class="cart-item-qty">
            <button @click="updateQty(item.productId, item.qty - 1)">−</button>
            <span>{{ item.qty }}</span>
            <button @click="updateQty(item.productId, item.qty + 1)">+</button>
          </div>
          <div class="cart-item-total">{{ (item.price * item.qty).toLocaleString() }} ₽</div>
          <button class="cart-item-remove" @click="remove(item.productId)" title="Удалить">×</button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>Товары ({{ totalCount }})</span>
          <span>{{ totalPrice.toLocaleString() }} ₽</span>
        </div>
        <div class="cart-summary-row cart-summary-total">
          <span>Итого</span>
          <span>{{ totalPrice.toLocaleString() }} ₽</span>
        </div>
        <button class="btn-gold btn-checkout" @click="step = 'checkout'">Оформить заказ</button>
        <NuxtLink to="/catalog" class="cart-continue">← Продолжить покупки</NuxtLink>
      </div>
    </div>

    <!-- Checkout form -->
    <div v-else-if="step === 'checkout'" class="checkout-body">
      <div class="checkout-grid">
        <div class="checkout-form">
          <h2>Оформление заказа</h2>

          <div class="form-group">
            <label>Имя *</label>
            <input v-model="form.name" type="text" placeholder="Ваше имя">
          </div>

          <div class="form-group">
            <label>Телефон *</label>
            <input v-model="form.phone" type="tel" placeholder="+7 (999) 000-00-00">
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="email@example.com">
          </div>

          <div class="form-group">
            <label>Telegram</label>
            <input v-model="form.telegram" type="text" placeholder="@username">
          </div>

          <div class="form-group">
            <label>Способ доставки *</label>
            <select v-model="form.delivery_type">
              <option value="pickup">Самовывоз — Калининград, ул. Аксакова, 123</option>
              <option value="courier">Курьер по Калининграду</option>
              <option value="transport">Транспортная компания по РФ</option>
            </select>
          </div>

          <div class="form-group">
            <label>Город *</label>
            <input v-model="form.delivery_city" type="text" placeholder="Калининград">
          </div>

          <div class="form-group">
            <label>Адрес / пункт выдачи / ТК *</label>
            <textarea v-model="form.delivery_address" rows="2" placeholder="Улица, дом, квартира / ПВЗ СДЭК / название ТК"></textarea>
          </div>

          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="form.comment" rows="2" placeholder="Удобное время доставки, пожелания..."></textarea>
          </div>

          <label class="form-consent">
            <input v-model="form.consent" type="checkbox" required />
            <span>Я согласен на <NuxtLink to="/consent">обработку персональных данных</NuxtLink> и принимаю <NuxtLink to="/privacy">политику конфиденциальности</NuxtLink></span>
          </label>

          <p v-if="error" class="form-error">{{ error }}</p>

          <button
            class="btn-gold btn-submit"
            :disabled="submitting"
            @click="submitOrder"
          >
            {{ submitting ? 'Отправка...' : 'Подтвердить заказ' }}
          </button>
          <button class="btn-back" @click="step = 'cart'">← Назад к корзине</button>
        </div>

        <div class="checkout-summary">
          <h3>Ваш заказ</h3>
          <div class="checkout-items">
            <div v-for="item in items" :key="item.productId" class="checkout-item">
              <img :src="cldImage(item.photo, { w: 150 })" :alt="item.name" loading="lazy" decoding="async">
              <div class="checkout-item-info">
                <p>{{ item.name }}</p>
                <span>{{ item.qty }} × {{ item.price.toLocaleString() }} ₽</span>
              </div>
              <div class="checkout-item-total">{{ (item.price * item.qty).toLocaleString() }} ₽</div>
            </div>
          </div>
          <div class="checkout-total">
            <span>Итого</span>
            <span>{{ totalPrice.toLocaleString() }} ₽</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
usePageMeta({
  title: 'Корзина',
  description: 'Корзина заказа в студии аквариумного дизайна Рипарий.',
  noindex: true
})

const { items, totalCount, totalPrice, updateQty, remove, clear } = useCart()
const step = ref('cart')
const submitting = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  phone: '',
  email: '',
  telegram: '',
  delivery_type: 'pickup',
  delivery_city: 'Калининград',
  delivery_address: '',
  comment: '',
  consent: false
})

function validate () {
  if (!form.name.trim()) return 'Укажите имя'
  if (!form.phone.trim()) return 'Укажите телефон'
  if (!form.delivery_city.trim()) return 'Укажите город'
  if (!form.delivery_address.trim()) return 'Укажите адрес'
  if (!form.consent) return 'Необходимо согласие на обработку персональных данных'
  return ''
}

async function submitOrder () {
  error.value = validate()
  if (error.value) return

  submitting.value = true
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        customer_telegram: form.telegram.trim().replace('@', '') || null,
        delivery_type: form.delivery_type,
        delivery_city: form.delivery_city.trim(),
        delivery_address: form.delivery_address.trim(),
        comment: form.comment.trim() || null,
        consent: form.consent,
        items: items.value.map(i => ({
          productId: i.productId,
          name: i.name,
          article: i.article,
          photo: i.photo,
          price: i.price,
          qty: i.qty
        }))
      })
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.statusMessage || 'Ошибка оформления')
    }

    clear()
    step.value = 'success'
  } catch (e) {
    error.value = e.message || 'Не удалось оформить заказ. Попробуйте позже.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.cart-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
  color: var(--cream);
}
.cart-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  margin-bottom: 32px;
}

/* Empty */
.cart-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--cream-dim);
}
.cart-empty svg {
  margin-bottom: 16px;
  opacity: 0.4;
}
.cart-empty p {
  margin-bottom: 24px;
  font-size: 1.1rem;
}

/* Cart list */
.cart-body {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
  align-items: start;
}
@media (max-width: 768px) {
  .cart-body {
    grid-template-columns: 1fr;
  }
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto 36px;
  gap: 16px;
  align-items: center;
  background: var(--ink-mid);
  padding: 16px;
  border-radius: 12px;
}
@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 60px 1fr auto;
    grid-template-rows: auto auto;
  }
  .cart-item-img { grid-row: 1 / 3; }
  .cart-item-info { grid-column: 2; }
  .cart-item-qty { grid-column: 2; grid-row: 2; }
  .cart-item-total { grid-column: 3; grid-row: 1; }
  .cart-item-remove { grid-column: 3; grid-row: 2; }
  .cart-item-total { display: none; }
}

.cart-item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}
.cart-item-name {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--cream);
  text-decoration: none;
}
.cart-item-name:hover {
  color: var(--gold);
}
.cart-item-article {
  font-size: 0.85rem;
  color: var(--cream-dim);
  margin-top: 4px;
}
.cart-item-price {
  font-size: 0.9rem;
  color: var(--gold);
  margin-top: 4px;
}
.cart-item-qty {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cart-item-qty button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: var(--ink-soft);
  color: var(--cream);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.cart-item-qty button:hover {
  border-color: var(--gold);
}
.cart-item-qty span {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}
.cart-item-total {
  font-weight: 600;
  color: var(--gold);
  font-size: 1.1rem;
  white-space: nowrap;
}
.cart-item-remove {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--cream-dim);
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-item-remove:hover {
  background: rgba(255, 100, 100, 0.15);
  color: #ff8a8a;
}

/* Summary */
.cart-summary {
  background: var(--ink-mid);
  padding: 24px;
  border-radius: 12px;
  position: sticky;
  top: 100px;
}
.cart-summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: var(--cream-dim);
}
.cart-summary-total {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--cream);
  border-top: 1px solid var(--rule);
  margin-top: 8px;
  padding-top: 16px;
}
.btn-checkout {
  width: 100%;
  margin-top: 20px;
}
.cart-continue {
  display: block;
  text-align: center;
  margin-top: 16px;
  color: var(--cream-dim);
  text-decoration: none;
  font-size: 0.95rem;
}
.cart-continue:hover {
  color: var(--gold);
}

/* Checkout */
.checkout-body {
  max-width: 900px;
}
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
  align-items: start;
}
@media (max-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}

.checkout-form h2 {
  font-family: var(--font-serif);
  margin-bottom: 24px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--cream-dim);
  margin-bottom: 6px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
  font-size: 1rem;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--gold);
}
.form-error {
  color: #ff8a8a;
  margin-bottom: 12px;
  font-size: 0.95rem;
}
.form-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0 12px;
  font-size: 0.9rem;
  color: var(--cream-dim);
  line-height: 1.5;
  cursor: pointer;
}
.form-consent input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--gold);
  flex-shrink: 0;
}
.form-consent a {
  color: var(--gold);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.form-consent a:hover {
  opacity: 0.8;
}
.btn-submit {
  width: 100%;
  margin-top: 8px;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-back {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--cream-dim);
  cursor: pointer;
  font-size: 1rem;
}
.btn-back:hover {
  border-color: var(--gold);
  color: var(--cream);
}

.checkout-summary {
  background: var(--ink-mid);
  padding: 20px;
  border-radius: 12px;
  position: sticky;
  top: 100px;
}
.checkout-summary h3 {
  font-family: var(--font-serif);
  margin-bottom: 16px;
}
.checkout-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.checkout-item {
  display: flex;
  gap: 12px;
  align-items: center;
}
.checkout-item img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}
.checkout-item-info {
  flex: 1;
}
.checkout-item-info p {
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.3;
}
.checkout-item-info span {
  font-size: 0.8rem;
  color: var(--cream-dim);
}
.checkout-item-total {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gold);
  white-space: nowrap;
}
.checkout-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: 600;
  border-top: 1px solid var(--rule);
  padding-top: 12px;
}

/* Success */
.cart-success {
  text-align: center;
  padding: 60px 20px;
  max-width: 520px;
  margin: 0 auto;
}
.cart-success h2 {
  font-family: var(--font-serif);
  margin: 16px 0 8px;
  font-size: 1.8rem;
  color: var(--gold);
}
.cart-success p {
  color: var(--cream-dim);
  margin-bottom: 28px;
  line-height: 1.6;
}
.cart-success-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.btn-back-link {
  color: var(--cream-dim);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 8px 16px;
}
.btn-back-link:hover {
  color: var(--gold);
}

/* Shared button */
.btn-gold {
  display: inline-block;
  padding: 14px 28px;
  border-radius: 10px;
  border: none;
  background: var(--gold);
  color: var(--ink-deep);
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: background 0.2s, transform 0.2s;
}
.btn-gold:hover {
  background: var(--gold-soft);
  transform: translateY(-2px);
}
</style>
