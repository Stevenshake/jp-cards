const LESSONS_URL = 'lessons.json';

let lessons = [];
let session = null;

const els = {
  lessonsScreen: document.getElementById('lessons-screen'),
  sessionScreen: document.getElementById('session-screen'),
  doneScreen:    document.getElementById('done-screen'),
  lessonsList:   document.getElementById('lessons-list'),
  exitBtn:       document.getElementById('exit-btn'),
  progress:      document.getElementById('progress'),
  card:          document.getElementById('card'),
  cardInner:     document.querySelector('.card-inner'),
  frontText:     document.getElementById('front-text'),
  backText:      document.getElementById('back-text'),
  readingText:   document.getElementById('reading-text'),
  knowBtn:       document.getElementById('know-btn'),
  dontKnowBtn:   document.getElementById('dont-know-btn'),
  doneText:      document.getElementById('done-text'),
  doneBtn:       document.getElementById('done-btn'),
};

function showScreen(name) {
  els.lessonsScreen.classList.toggle('hidden', name !== 'lessons');
  els.sessionScreen.classList.toggle('hidden', name !== 'session');
  els.doneScreen.classList.toggle('hidden', name !== 'done');
}

async function loadLessons() {
  try {
    const res = await fetch(LESSONS_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    lessons = data.lessons || [];
  } catch (e) {
    console.error(e);
    els.lessonsList.innerHTML = '<p style="color:var(--muted)">Не удалось загрузить уроки.</p>';
    return;
  }
  renderLessons();
}

function renderLessons() {
  els.lessonsList.innerHTML = '';
  lessons.forEach((lesson) => {
    const btn = document.createElement('button');
    btn.className = 'lesson-btn';
    btn.type = 'button';

    const title = document.createElement('span');
    title.textContent = lesson.title || `Урок ${lesson.id}`;

    const count = document.createElement('span');
    count.className = 'lesson-count';
    count.textContent = `${lesson.cards.length} карточек`;

    btn.append(title, count);
    btn.addEventListener('click', () => startSession(lesson));
    els.lessonsList.appendChild(btn);
  });
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startSession(lesson) {
  session = {
    lesson,
    queue: shuffle(lesson.cards),
    total: lesson.cards.length,
  };
  showScreen('session');
  renderCurrentCard();
}

function renderCurrentCard() {
  if (!session || session.queue.length === 0) {
    finishSession();
    return;
  }

  const card = session.queue[0];

  // Мгновенно возвращаем карточку на лицевую сторону (без анимации)
  els.cardInner.style.transition = 'none';
  els.card.classList.remove('flipped');
  void els.cardInner.offsetWidth;
  els.cardInner.style.transition = '';

  els.frontText.textContent = card.front;
  els.backText.textContent = card.back;

  if (card.reading) {
    els.readingText.textContent = card.reading;
    els.readingText.style.display = '';
  } else {
    els.readingText.textContent = '';
    els.readingText.style.display = 'none';
  }

  const learned = session.total - session.queue.length;
  els.progress.textContent = `${learned} / ${session.total}`;
}

function markKnow() {
  if (!session || session.queue.length === 0) return;
  session.queue.shift();
  renderCurrentCard();
}

function markDontKnow() {
  if (!session || session.queue.length === 0) return;
  const card = session.queue.shift();
  session.queue.push(card);
  renderCurrentCard();
}

function finishSession() {
  const count = session ? session.total : 0;
  els.doneText.textContent = `Вы прошли все ${count} карточек этого урока.`;
  session = null;
  showScreen('done');
}

function exitSession() {
  session = null;
  showScreen('lessons');
}

els.card.addEventListener('click', () => els.card.classList.toggle('flipped'));
els.knowBtn.addEventListener('click', markKnow);
els.dontKnowBtn.addEventListener('click', markDontKnow);
els.exitBtn.addEventListener('click', exitSession);
els.doneBtn.addEventListener('click', () => showScreen('lessons'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(console.error);
  });
}

loadLessons();