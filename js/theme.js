/* 음양 버튼 — 기둥 둘레 네 방향 점 가운데 하나가 켜져 모음이 됨.
   누를 때마다 ㅏ → ㅓ → ㅗ → ㅜ → ㅏ … (좌우 한 쌍, 그다음 상하 한 쌍 번갈아).
   훈민정음 해례본: 점(·)이 위·바깥(ㅗ ㅏ)이면 양 → 밝은 화면, 아래·안쪽(ㅜ ㅓ)이면 음 → 어두운 화면.
   밝은/어두운 화면은 이 브라우저에 기억해 둠. 처음에는 기기 설정(밝게/어둡게)을 따름.
   화면이 번쩍이지 않게 <head> 의 짧은 스크립트가 먼저 data-theme 을 정해 둠. */
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const live = document.getElementById('live');
  const polName = document.getElementById('pol-name');
  if (!btn) return;

  const VOWELS = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ']; // 짝수 번째는 양(밝게), 홀수 번째는 음(어둡게)
  let v = root.dataset.theme === 'dark' ? 1 : 0;

  function render() {
    const dark = v % 2 === 1;
    const ch = VOWELS[v];
    btn.dataset.v = String(v);
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', `${dark ? '밝은' : '어두운'} 화면으로 (지금 ${dark ? '음' : '양'}, ${ch})`);
    btn.title = `${ch} · ${dark ? '음 陰' : '양 陽'}`;
    const en = root.lang === 'en'; // js/lang.js 가 정함
    if (polName) polName.textContent = dark ? (en ? 'Yin(陰)' : '음(陰)') : (en ? 'Yang(陽)' : '양(陽)');
  }
  document.addEventListener('langchange', render);

  btn.addEventListener('click', () => {
    v = (v + 1) % VOWELS.length;
    const next = v % 2 === 1 ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (_) {}
    render();
    if (live) live.textContent = `${next === 'dark' ? '어두운 화면, 음' : '밝은 화면, 양'}(${VOWELS[v]})`;
  });

  render();
})();
