/* 원판 화면 아래 가운데: Language — 위에 작은 검은 창, 한국어 / English 를 고르면 화면 글이 바뀜.
   고른 말은 이 브라우저에 기억해 둠 (처음에는 한국어).
   한국어 글은 index.html 에 그대로 두고, 처음 읽을 때 저장해 두었다가 되돌림.
   바뀐 뒤 document 에 'langchange' 이벤트를 보냄 (js/links.js 의 소개 창 제목, js/theme.js 의 음양 이름) */
(() => {
  const root = document.documentElement;
  const live = document.getElementById('live');

  // [선택자, 영어] — 영어가 문자열이면 맞는 요소 모두에, 배열이면 차례대로 하나씩
  const EN = [
    // 나무·연못 화면 왼쪽 설명
    ['.side-info[data-scene="tree"] .el-name', '<span class="el-hanja">木</span>Wood'],
    ['.side-info[data-scene="tree"] .el-sense', 'Growth · Reaching out'],
    ['.side-info[data-scene="pond"] .el-name', '<span class="el-hanja">水</span>Water'],
    ['.side-info[data-scene="pond"] .el-sense', 'Flow · Passage'],
    ['.rule[data-rule="가획"] .rule-name', 'Adding strokes'],
    ['.rule[data-rule="병서"] .rule-name', 'Doubling'],
    ['.rule[data-rule="통함"] .rule-name', 'Passage'],
    ['.rule-desc', [
      'Add a stroke to a basic letter, and its sound grows stronger.',
      'Write the same letter side by side to mark a tense sound.',
      'Each added stroke makes the throat sound stronger — and the ripples reach farther.',
      'Write the same letter side by side, and a double ripple spreads.',
      'A ripple makes buds bloom and sets floating letters ringing. The larger the bud, the firmer it is, and the stronger the ripple it needs. Bloom them all, and the pond flows as one.',
    ]],
    ['.rule-note', [
      'ㆆ (yeorin hieut) was one of the 17 initial consonants of Hunminjeongeum, but it disappeared after the 15th century and is no longer used.',
      'In Hunminjeongeum, ㆅ was the initial sound of 洪 (hong), but it disappeared after the 15th century and is no longer used.',
    ]],

    // 원판 맨 위 칸의 오행 설명
    ['.element .el-eyebrow', 'Yin-Yang &amp; Five Elements 陰陽五行'],
    ['.element .el-name', [
      '<span class="el-hanja">木</span>Wood',
      '<span class="el-hanja">火</span>Fire',
      '<span class="el-hanja">土</span>Earth',
      '<span class="el-hanja">金</span>Metal',
      '<span class="el-hanja">水</span>Water',
    ]],
    ['.element .el-sense', [
      'Growth · Reaching out',
      'Spreading · Blazing',
      'Gathering · Embracing',
      'Firmness · Sharpness',
      'Flow · Passage',
    ]],
    ['.element .el-meta', [
      'Shaped after the root of the tongue · ㄱ → ㅋ',
      'Shaped after the tongue · ㄴ → ㄷ → ㅌ',
      'Shaped after the mouth · ㅁ → ㅂ → ㅍ',
      'Shaped after the teeth · ㅅ → ㅈ → ㅊ',
      'Shaped after the throat · ㅇ → ㆆ → ㅎ',
    ]],

    // About project 창: 그림
    ['.fig-organ', ['Molars', 'Tongue', 'Lips', 'Teeth', 'Throat']],
    ['.fig-core-name', 'Yin-Yang 陰陽'],
    ['.fig-core-cap', ['Sky', 'Earth', 'Human']],
    ['.fig-yy-name', ['Yang 陽', 'Yin 陰']],
    ['.fig-yy-cap', ['Dot up · out', 'Dot down · in']],

    // About project 창: 글
    ['.about-title', 'The Philosophy of Hangeul'],
    ['.about-body > p:not(.about-copy)', 'Hangeul\'s consonants are shaped after the organs that make each sound; its vowels, after heaven, earth and humankind. This project is an interactive website where you draw and turn the letters yourself to feel the principles of letter-making set out in the <i>Hunminjeongeum Haerye</i>.'],
    ['.about-list li', [
      '<b>Yin-Yang and the Five Elements</b> A long-held East Asian idea that everything in the world arises from two paired forces, yin (陰) and yang (陽), and from five forces — wood (木), fire (火), earth (土), metal (金) and water (水) — that circulate and combine.',
      '<b>Its link to Hangeul</b> The <i>Hunminjeongeum Haerye</i> says that “the way of heaven and earth is nothing but yin-yang and the five elements,” and, seeing the same principle in human speech, created the letters accordingly.',
      '<b>Consonants · Five Elements</b> The places where sounds are made were divided into five and paired with the elements. The throat (ㅇ) is deep and moist: water. The molars (ㄱ) are uneven and long: wood. The tongue (ㄴ) moves nimbly: fire. The teeth (ㅅ) are hard: metal. The lips (ㅁ) are square and close together: earth.',
      '<b>Vowels · Yin-Yang</b> The vowels are modeled on heaven (·), earth (ㅡ) and humankind (ㅣ). Heaven is yang, earth is yin, and humankind joins the two. ㅗ and ㅏ, with the dot above or outside, are yang; ㅜ and ㅓ, with the dot below or inside, are yin.',
    ]],
    ['.about-copy', '© 2026 The Philosophy of Hangeul. All rights reserved.'],

    // 처음 화면 소개
    ['.intro-title', 'The Philosophy of Hangeul'],
    ['.intro-desc', [
      'Consonants are shaped after the organs that make each sound; vowels, after heaven, earth and humankind.',
      'Draw the strokes yourself and feel the yin-yang and five-element principles beneath them.',
    ]],
    ['.intro-hint', 'Tap the screen to begin'],
  ];
  const TITLE = { ko: document.title, en: 'Consonants · The Philosophy of Hangeul' };

  // 한국어 원문을 저장해 둠
  const slots = [];
  EN.forEach(([sel, en]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      const val = Array.isArray(en) ? en[i] : en;
      if (val != null) slots.push({ el, ko: el.innerHTML, en: val });
    });
  });

  let lang = 'ko';
  function apply(next, announce) {
    lang = next === 'en' ? 'en' : 'ko';
    root.lang = lang;
    root.dataset.lang = lang;
    document.title = TITLE[lang];
    slots.forEach((s) => { s.el.innerHTML = s[lang]; });
    menu.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
    try { localStorage.setItem('lang', lang); } catch (_) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    if (announce && live) live.textContent = lang === 'en' ? 'Language: English' : '언어: 한국어';
  }

  /* ---------- Language 버튼과 작은 창 (Share 창과 같은 동작) ---------- */
  const btn = document.getElementById('lang');
  const menu = document.getElementById('lang-menu');
  if (!btn || !menu) return;
  const items = () => [...menu.querySelectorAll('[role="menuitemradio"]')];
  const setOpen = (on, focusFirst = false) => {
    menu.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    if (on && focusFirst) (items().find((b) => b.dataset.lang === lang) || items()[0]).focus();
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(menu.hidden, e.detail === 0); // 키보드로 열면 지금 말에 초점
  });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-lang]');
    if (!item) return;
    if (item.dataset.lang !== lang) apply(item.dataset.lang, true);
    setOpen(false);
    btn.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus({ preventScroll: true }); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) setOpen(false);
  });
  menu.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
  });

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (_) {}
  apply(saved === 'en' ? 'en' : 'ko', false);
})();
