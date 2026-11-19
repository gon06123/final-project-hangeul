/* 음양 버튼 — 밝은 화면은 ㅏ(양 陽), 어두운 화면은 ㅓ(음 陰).
   훈민정음 해례본: 점(·)이 기둥(ㅣ) 바깥에 있으면 양, 안쪽에 있으면 음.
   고른 쪽은 이 브라우저에 기억해 둠. 처음에는 기기 설정(밝게/어둡게)을 따름.
   화면이 번쩍이지 않게 <head> 의 짧은 스크립트가 먼저 data-theme 을 정해 둠. */
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const live = document.getElementById('live');
  const polName = document.getElementById('pol-name');
  if (!btn) return;

  const isDark = () => root.dataset.theme === 'dark';

  function render() {
    const dark = isDark();
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? '밝은 화면으로 (지금 음, ㅓ)' : '어두운 화면으로 (지금 양, ㅏ)');
    btn.title = dark ? 'ㅓ · 음 陰' : 'ㅏ · 양 陽';
    if (polName) polName.textContent = dark ? '음(陰)' : '양(陽)';
  }

  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (_) {}
    render();
    if (live) live.textContent = next === 'dark' ? '어두운 화면, 음(ㅓ)' : '밝은 화면, 양(ㅏ)';
  });

  render();
})();
