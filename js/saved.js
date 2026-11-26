/* 저장 버튼 공통 (js/consonant.js 의 ㄱ 나무, js/pond.js 의 ㅇ 연못 이 부름):
   SVG 파일을 내려받고, 저장한 그림을 화면 가운데 창에 띄움. 창에서 바로 공유·PNG 저장.
   (파일 공유가 안 되는 브라우저에서는 공유 버튼이 이미지를 클립보드에 복사함)
   공유는 PNG 로 (SNS·메신저 앱 대부분이 SVG 를 못 받음). PNG 는 창이 열릴 때 미리 만들어 둠 →
   공유 버튼을 누른 그 순간에 공유 창을 열 수 있음 (브라우저는 누른 직후에만 공유 창을 허락함) */
(() => {
  const dlg = document.getElementById('saved');
  const img = document.getElementById('saved-img');
  const live = document.getElementById('live');
  const say = (m) => { if (live) live.textContent = m; };
  const en = () => document.documentElement.lang === 'en';
  const T = {
    share: ['공유하기', 'Share'],
    png: ['PNG 저장', 'Save PNG'],
    close: ['닫기', 'Close'],
    saved: ['SVG 파일로 저장했습니다', 'Saved as an SVG file'],
    copied: ['복사했습니다 — 붙여 넣어 공유하세요', 'Copied — paste it to share'],
    failed: ['복사하지 못했습니다', 'Could not copy'],
  };
  const t = (k) => T[k][en() ? 1 : 0];

  const stampNow = () => {
    const d = new Date();
    const p2 = (v) => String(v).padStart(2, '0');
    return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  };
  const download = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // SVG → PNG (긴 변 최대 3000px, 너무 작으면 키움)
  function toPNG(svgBlob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(svgBlob);
      const im = new Image();
      im.onload = () => {
        const w0 = im.naturalWidth || 1200, h0 = im.naturalHeight || 1200;
        const k = Math.min(3000 / Math.max(w0, h0), Math.max(1, 1200 / Math.max(w0, h0)));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(w0 * k));
        cv.height = Math.max(1, Math.round(h0 * k));
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
      };
      im.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      im.src = url;
    });
  }

  let cur = null; // { name, title, svgUrl, png: Promise<Blob>, pngBlob }

  function setLabels() {
    dlg.querySelectorAll('[data-t]').forEach((el) => {
      if (!el.dataset.busy) el.textContent = t(el.dataset.t);
    });
    dlg.querySelector('.saved-close').setAttribute('aria-label', t('close'));
    dlg.querySelector('.saved-note').textContent = `${t('saved')} · ${cur ? cur.name : ''}.svg`;
  }
  // 버튼 글자를 잠깐 바꿨다가 되돌림
  function flash(btn, msg) {
    btn.dataset.busy = '1';
    btn.textContent = msg;
    say(msg);
    setTimeout(() => { delete btn.dataset.busy; btn.textContent = t(btn.dataset.t); }, 1600);
  }

  // svg: SVG 글, name: 파일 이름 앞부분 (예: 'ㄱ나무'), title: 공유 글에 넣을 이름
  window.saveImage = (svg, name, title) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const file = `${name}-${stampNow()}`;
    download(blob, `${file}.svg`);
    if (!dlg) return;
    if (cur) URL.revokeObjectURL(cur.svgUrl);
    cur = { name: file, title, svgUrl: URL.createObjectURL(blob), pngBlob: null };
    cur.png = toPNG(blob).then((b) => { if (cur && cur.name === file) cur.pngBlob = b; return b; });
    cur.png.catch(() => {});
    img.src = cur.svgUrl;
    img.alt = title;
    setLabels();
    dlg.classList.remove('is-closing');
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    dlg.querySelector('[data-act="share"]').focus({ preventScroll: true });
    say(`${t('saved')}.`);
  };

  if (!dlg) return;

  const pngFile = (b) => new File([b], `${cur.name}.png`, { type: 'image/png' });

  async function copyImage(btn) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('no clipboard');
      // 사파리는 누른 순간에 write 를 불러야 해서 Blob 대신 Promise 를 넘김
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': cur.png })]);
      flash(btn, t('copied'));
    } catch {
      flash(btn, t('failed'));
    }
  }

  async function share(btn) {
    const pageUrl = location.href.split('#')[0];
    const text = en() ? `${cur.title} — The Philosophy of Hangeul` : `${cur.title} — 한글의 철학`;
    // PNG 가 이미 준비돼 있으면 곧바로 (누른 직후여야 공유 창이 열림)
    const b = cur.pngBlob || await cur.png.catch(() => null);
    if (b && navigator.canShare) {
      const files = [pngFile(b)];
      if (navigator.canShare({ files })) {
        try {
          await navigator.share({ files, title: cur.title, text: `${text}\n${pageUrl}` });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return; // 사용자가 닫음
        }
      }
    }
    // 파일 공유가 안 되는 브라우저(PC 파이어폭스 등): 이미지를 복사해 두고 알려 줌
    copyImage(btn);
  }

  const close = () => {
    if (!dlg.open || dlg.classList.contains('is-closing')) return;
    dlg.classList.add('is-closing');
    setTimeout(() => {
      dlg.classList.remove('is-closing');
      if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    }, 220);
  };

  dlg.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (btn && cur) {
      const act = btn.dataset.act;
      if (act === 'share') share(btn);
      else if (act === 'png') cur.png.then((b) => download(b, `${cur.name}.png`), () => flash(btn, t('failed')));
      return;
    }
    // 창 안(그림·버튼 줄) 바깥, 곧 어두운 바탕을 누르면 닫힘
    if (e.target === dlg || e.target.closest('.saved-close')) close();
  });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('close', () => document.getElementById('save-svg')?.focus({ preventScroll: true }));
  document.addEventListener('langchange', () => { if (dlg.open && cur) setLabels(); });
})();
