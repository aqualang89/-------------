const FISH = [
  { file: 'img/золотая рыбка.jpg', name: 'Золотая рыбка' },
  { file: 'img/петушок.jpg',       name: 'Петушок' },
  { file: 'img/гуппи.jpg',         name: 'Гуппи' },
  { file: 'img/скалярия.jpg',      name: 'Скалярия' },
  { file: 'img/неон.jpg',          name: 'Неон' },
  { file: 'img/рыба-клоун.jpg',    name: 'Рыба-клоун' },
  { file: 'img/кои.jpg',           name: 'Кои' },
  { file: 'img/моллинезия.jpg',    name: 'Моллинезия' },
  { file: 'img/пецилия.jpg',       name: 'Пецилия' },
  { file: 'img/дискус.jpg',        name: 'Дискус' },
];

const FUNNY = [
  'Шкафопёр', 'Рыба-диван', 'Аквакот', 'Хомячок Немо', 'Суши с ножками',
  'Карась Петрович', 'Рыба-ипотека', 'Бассейн с глазами',
  'Водяная картошка', 'Кот Мурзик', 'Дима', 'Наталья'
];

const PROMO = 'FISH1';

let state = {
  queue: [],
  current: 0,
  lives: 3,
  open: false
};

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getWrongOptions(correctName) {
  const otherFish = FISH.map(f => f.name).filter(n => n !== correctName);
  const allWrong = shuffle([...otherFish, ...FUNNY]);
  return allWrong.slice(0, 2);
}

function buildOptions(correctName) {
  const wrong = getWrongOptions(correctName);
  const funny = FUNNY[Math.floor(Math.random() * FUNNY.length)];
  const options = shuffle([correctName, wrong[0], wrong[1], funny]);
  return options;
}

function renderHearts() {
  return '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
}

function showQuestion() {
  const fish = state.queue[state.current];
  const options = buildOptions(fish.name);
  const box = document.getElementById('quiz-box');

  box.querySelector('.quiz-hearts').textContent = renderHearts();
  box.querySelector('.quiz-counter').textContent = `${state.current + 1} / ${FISH.length}`;
  box.querySelector('.quiz-img').src = fish.file;
  box.querySelector('.quiz-img').alt = '?';

  const btns = box.querySelectorAll('.quiz-option');
  btns.forEach((btn, i) => {
    btn.textContent = options[i];
    btn.className = 'quiz-option';
    btn.disabled = false;
    btn.onclick = () => onAnswer(btn, options[i], fish.name);
  });

  box.querySelector('.quiz-feedback').textContent = '';
}

function onAnswer(btn, chosen, correct) {
  const box = document.getElementById('quiz-box');
  const btns = box.querySelectorAll('.quiz-option');
  btns.forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('quiz-correct');
    box.querySelector('.quiz-feedback').textContent = 'Верно! 🎉';
    state.current++;
    if (state.current >= FISH.length) {
      setTimeout(showWin, 800);
    } else {
      setTimeout(showQuestion, 900);
    }
  } else {
    btn.classList.add('quiz-wrong');
    btns.forEach(b => { if (b.textContent === correct) b.classList.add('quiz-correct'); });
    state.lives--;
    box.querySelector('.quiz-hearts').textContent = renderHearts();
    box.querySelector('.quiz-feedback').textContent = `Неверно! Это ${correct}`;
    if (state.lives <= 0) {
      setTimeout(showLose, 900);
    } else {
      setTimeout(showQuestion, 1200);
    }
  }
}

function showWin() {
  const box = document.getElementById('quiz-box');
  box.querySelector('.quiz-game').style.display = 'none';
  box.querySelector('.quiz-result').style.display = 'flex';
  box.querySelector('.quiz-result').innerHTML = `
    <div class="quiz-result-icon">🏆</div>
    <div class="quiz-result-title">Ты знаток аквариумистики!</div>
    <div class="quiz-result-text">Угадал все 10 рыбок. Держи промокод на скидку 1%:</div>
    <div class="quiz-promo">${PROMO}</div>
    <div class="quiz-result-hint">Назови его при заказе</div>
    <button class="quiz-restart" onclick="restartQuiz()">Играть ещё раз</button>
  `;
}

function showLose() {
  const box = document.getElementById('quiz-box');
  box.querySelector('.quiz-game').style.display = 'none';
  box.querySelector('.quiz-result').style.display = 'flex';
  box.querySelector('.quiz-result').innerHTML = `
    <div class="quiz-result-icon">🐟</div>
    <div class="quiz-result-title">Рыбки уплыли!</div>
    <div class="quiz-result-text">Жизни закончились. Попробуй ещё раз!</div>
    <button class="quiz-restart" onclick="restartQuiz()">Попробовать снова</button>
  `;
}

function restartQuiz() {
  state.queue = shuffle(FISH);
  state.current = 0;
  state.lives = 3;
  const box = document.getElementById('quiz-box');
  box.querySelector('.quiz-game').style.display = 'flex';
  box.querySelector('.quiz-result').style.display = 'none';
  showQuestion();
}

function toggleQuiz(open) {
  state.open = open;
  document.getElementById('quiz-box').classList.toggle('open', open);
}

function createQuizElements() {
  const btn = document.createElement('button');
  btn.id = 'quiz-toggle';
  btn.textContent = '🐠 Викторина';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'quiz-box';
  box.innerHTML = `
    <div class="quiz-header">
      <span>Угадай рыбку</span>
      <button class="quiz-close" onclick="toggleQuiz(false)">×</button>
    </div>
    <div class="quiz-game">
      <div class="quiz-top">
        <span class="quiz-hearts">❤️❤️❤️</span>
        <span class="quiz-counter">1 / 10</span>
      </div>
      <img class="quiz-img" src="" alt="?" />
      <div class="quiz-feedback"></div>
      <div class="quiz-options">
        <button class="quiz-option"></button>
        <button class="quiz-option"></button>
        <button class="quiz-option"></button>
        <button class="quiz-option"></button>
      </div>
    </div>
    <div class="quiz-result"></div>
  `;
  document.body.appendChild(box);

  btn.addEventListener('click', () => {
    if (!state.open) {
      restartQuiz();
      toggleQuiz(true);
    } else {
      toggleQuiz(false);
    }
  });
}

document.addEventListener('DOMContentLoaded', createQuizElements);
