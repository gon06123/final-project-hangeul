/* 02 모음 — 가운데 작대기를 잡아 돌리면(방향키로도), 점이 가리키는 방향에 따라
   모음 자리와 음양이 바뀐다. 처음엔 작대기 하나(ㅣ ↔ ㅡ)이고,
   배경을 클릭할 때마다 점이 나타나 작대기 옆으로 날아가 붙는다: 1번 ㅏ, 2번 ㅑ.
   첫 점은 누른 쪽 화면 절반으로 자리가 정해진다: ㅣ 면 오른쪽(ㅏ)·왼쪽(ㅓ), ㅡ 면 위(ㅗ)·아래(ㅜ).
   붙은 획을 누르면(또는 Backspace) 획이 점으로 줄어들어 떨어져 나가서, 다시 찍을 수 있다.
   점은 해(하늘): 해가 동쪽(ㅏ)이면 아침, 위(ㅗ)면 한낮, 서쪽(ㅓ)이면 별이 뜬 밤, 아래(ㅜ)면 땅속.
   돌리는 각도를 따라 하늘 밝기가 끊김 없이 바뀌고(새벽·노을이 지나감), 해가 있는 쪽 하늘이 밝게 비치며
   반대쪽은 그늘진다. 어두워질수록 별이 뜬다.
   그림자: 작대기(사람)는 해 반대쪽으로 그림자를 드리움 — 아침·밤엔 길고, 한낮(해가 머리 위)과 땅속엔 없음.
   위(ㅗ)로 돌리면 땅이 빠지고 구름 사이로 떠오르며, 아래(ㅜ)로 돌리면 지평선이 올라와 땅속으로 가라앉는다.
   단, 이 모든 것은 점(해)이 붙어야 시작된다. 점이 없는 ㅣ 는 중성이라 방향이 없어서
   하늘은 회색 새벽에 멈춰 있고 그림자도 없다(음양 표시 '중'). 첫 점이 붙으면 그 자리에서 빛이 퍼지며
   해가 뜨고, 둘째 점(ㅑ)이 붙으면 빛이 겹쳐 세져서 밝은 곳은 더 밝고 어두운 곳·그림자는 더 짙어지며
   구름·땅켜가 더 빨리 흐른다. */
(() => {
  // 각도: 0° = 오른쪽, 시계 방향이 + (CSS rotate 기준)
  // ch: 점 1개, ch2: 점 2개
  const VOWELS = {
    0:   { ch: 'ㅏ', ch2: 'ㅑ', pol: 'yang' },
    90:  { ch: 'ㅜ', ch2: 'ㅠ', pol: 'yin' },
    180: { ch: 'ㅓ', ch2: 'ㅕ', pol: 'yin' },
    270: { ch: 'ㅗ', ch2: 'ㅛ', pol: 'yang' },
  };
  const POL_NAME = { yang: '양(陽)', yin: '음(陰)', mid: '중(中)' };
  const KEYS = { ArrowRight: 0, ArrowDown: 90, ArrowLeft: 180, ArrowUp: 270 };
  const MAX_DOTS = 2;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const body = document.body;
  const glyph = $('#glyph');
  const marks = $$('.mark');
  const polName = $('#pol-name');
  const live = $('#live');

  let angle = 0;        // 작대기 각도. 연속값이라 359°→0° 로 넘어갈 때 한 바퀴 돌지 않음
  let currentKey = null;
  let dragging = false;
  let dots = 0;         // 나온 점 수 (날아가는 중 포함)
  let landed = 0;       // 작대기에 붙은 획 수

  const norm = (a) => ((a % 360) + 360) % 360;
  const shortest = (d) => {
    d = norm(d);
    return d > 180 ? d - 360 : d;
  };

  const charOf = (key) => {
    if (landed === 0) return key % 180 === 0 ? 'ㅣ' : 'ㅡ';
    return landed >= 2 ? VOWELS[key].ch2 : VOWELS[key].ch;
  };

  function render() {
    body.style.setProperty('--angle', `${angle}deg`);
    const key = norm(Math.round(angle / 90) * 90);
    if (key !== currentKey) showVowel(key);
  }

  function showVowel(key) {
    const first = currentKey === null;
    currentKey = key;
    const pol = showPolarity();
    if (!first) live.textContent = `${charOf(key)}, ${POL_NAME[pol]}`;
  }

  // 점(해)이 붙기 전의 ㅣ 는 중성: 음도 양도 아님
  function showPolarity() {
    const pol = landed > 0 ? VOWELS[currentKey].pol : 'mid';
    body.dataset.polarity = pol;
    polName.textContent = POL_NAME[pol];
    return pol;
  }

  function aimAt(a) {
    angle += shortest(a - angle);
    render();
  }

  // 손을 떼면 가장 가까운 90° 로 붙음
  function settle() {
    angle = Math.round(angle / 90) * 90;
    render();
  }

  function pointerAngle(e, el) {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < r.width * 0.05) return null; // 중심 근처는 방향이 불안정
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  /* ---- 드래그: 작대기를 잡은 곳에서 돌린 만큼만 회전 ---- */
  let last = null;

  glyph.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { glyph.setPointerCapture(e.pointerId); } catch { /* 포인터가 이미 사라진 경우 */ }
    dragging = true;
    last = pointerAngle(e, glyph);
  });

  glyph.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = pointerAngle(e, glyph);
    if (p === null) return;
    body.dataset.drag = 'glyph';
    if (last !== null) {
      angle += shortest(p - last);
      render();
    }
    last = p;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    delete body.dataset.drag;
    settle();
  };
  glyph.addEventListener('pointerup', endDrag);
  glyph.addEventListener('pointercancel', endDrag);

  /* ---- 배경 클릭 → 점이 나타나 작대기 옆으로 날아가 붙음 (1번 ㅏ, 2번 ㅑ) ----
     붙은 획을 누르면(또는 Backspace) 획이 다시 점으로 줄어들어 떨어져 나감 → 다시 찍을 수 있음 */

  const reserved = new Set(); // 점이 날아오는 중인 자리(mark 번호)
  const order = [];           // 획이 붙은 순서 — Backspace 는 마지막에 붙은 것부터 뗌
  let plucking = false;       // 획을 떼는 동안은 새 점을 받지 않음
  const isFree = (i) => marks[i].dataset.state === 'none' && !reserved.has(i);

  // i 번째 점이 내려앉을 자리의 지금 화면 좌표.
  // 글자 판 기준: 오른쪽 14cqw, 위아래는 점이 2개면 ∓9cqw.
  // 회전 애니메이션 중에도 맞도록 실제 그려진 각도를 읽는다.
  function dotTarget(i) {
    const r = glyph.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const t = getComputedStyle(glyph).transform;
    const m = t === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t);
    const theta = Math.atan2(m.b, m.a);
    const unit = glyph.offsetWidth / 100;
    const lx = 14 * unit;
    const ly = (dots >= 2 ? (i === 0 ? -9 : 9) : 0) * unit;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return { x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos };
  }

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function spawnDot(x, y) {
    if (plucking || dots >= MAX_DOTS) return;
    if (choosing()) faceSide(sideAt(x, y)); // 중성이면 누른 쪽 화면 절반으로 점 자리를 정함
    const i = marks.findIndex((_, k) => isFree(k)); // 빈 자리(위 0, 아래 1) 중 앞의 것
    if (i < 0) return;
    reserved.add(i);
    dots++;
    glyph.dataset.count = String(dots); // 두 번째 점이 오면 첫 획이 미리 비켜 줌

    const flyer = document.createElement('div');
    flyer.className = 'flyer';
    flyer.style.setProperty('--size', `${glyph.offsetWidth * 0.1}px`);
    flyer.style.translate = `${x}px ${y}px`;
    body.appendChild(flyer);

    const HOLD = 380;   // 클릭한 자리에서 톡 나타나 잠깐 머무는 시간
    const GLIDE = 850;  // 작대기 옆까지 날아가는 시간
    let start = null;

    function step(now) {
      if (start === null) start = now;
      const t = Math.min(1, Math.max(0, (now - start - HOLD) / GLIDE));
      const k = easeInOut(t);
      const to = dotTarget(i); // 날아가는 동안 회전해도 따라감
      flyer.style.translate = `${x + (to.x - x) * k}px ${y + (to.y - y) * k}px`;
      if (t < 1) requestAnimationFrame(step);
      else land(flyer, i);
    }
    requestAnimationFrame(step);
  }

  // 점이 작대기 옆에 내려앉은 뒤, 붙으면서 짧은 획으로 늘어남
  function land(flyer, i) {
    const m = marks[i];
    reserved.delete(i);
    m.classList.add('no-anim');
    m.dataset.state = 'dot';
    void m.offsetWidth;
    m.classList.remove('no-anim');
    flyer.remove();
    setTimeout(() => {
      const r = m.getBoundingClientRect(); // 점이 내려앉은 자리 — 여기서 빛이 퍼짐
      m.dataset.state = 'stroke';
      landed++;
      order.push(i);
      const now = performance.now();
      if (landed === 1) tweenTo(sun, 1, now);   // 해가 뜸
      if (landed === 2) tweenTo(power, 1, now); // 빛이 겹쳐 세짐
      burst(r.left + r.width / 2, r.top + r.height / 2, landed === 1 ? 1 : 0.7);
      const pol = showPolarity();
      live.textContent = `${charOf(currentKey)}, ${POL_NAME[pol]}`;
    }, 160);
  }

  // 붙은 획을 뗌: 획이 점으로 줄어든 뒤, 작대기에서 떨어져 바깥으로 떠나며 사라짐.
  // 획이 하나 남으면 빛이 다시 약해지고, 다 떼면 해가 져서 회색 새벽(중)으로 돌아감
  function pluck(i) {
    const m = marks[i];
    if (plucking || dots !== landed || m.dataset.state !== 'stroke') return; // 날아오는 점이 있으면 기다림
    plucking = true;
    order.splice(order.indexOf(i), 1);
    landed--;
    dots--;
    m.dataset.state = 'dot';
    const now = performance.now();
    if (landed === 1) tweenTo(power, 0, now);
    if (landed === 0) tweenTo(sun, 0, now);
    const pol = showPolarity();
    live.textContent = `${charOf(currentKey)}, ${POL_NAME[pol]}`;

    setTimeout(() => {
      const r = m.getBoundingClientRect();
      const g = glyph.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const gx = g.left + g.width / 2;
      const gy = g.top + g.height / 2;
      const len = Math.hypot(x - gx, y - gy) || 1;
      const ux = (x - gx) / len;
      const uy = (y - gy) / len;

      m.classList.add('no-anim');
      m.dataset.state = 'none';
      void m.offsetWidth;
      m.classList.remove('no-anim');
      glyph.dataset.count = String(dots); // 남은 획은 가운데로 돌아감
      plucking = false;

      const flyer = document.createElement('div');
      flyer.className = 'flyer is-leaving';
      flyer.style.setProperty('--size', `${r.width}px`);
      flyer.style.translate = `${x}px ${y}px`;
      body.appendChild(flyer);
      const D = glyph.offsetWidth * 0.45;
      const T = 700;
      let start = null;
      const step = (t) => {
        if (start === null) start = t;
        const k = Math.min(1, (t - start) / T);
        const e = 1 - Math.pow(1 - k, 3);
        flyer.style.translate = `${x + ux * D * e}px ${y + uy * D * e}px`;
        flyer.style.scale = String(1 - k);
        flyer.style.opacity = String(1 - k * k);
        if (k < 1) requestAnimationFrame(step);
        else flyer.remove();
      };
      requestAnimationFrame(step);
    }, 420);
  }

  /* ---- 중성일 때 점 자리 고르기 ----
     점이 하나도 없을 때(ㅣ·ㅡ 뿐일 때) 화면을 반으로 나눠, 누른 쪽에 점이 붙음.
     ㅣ 면 오른쪽(ㅏ)·왼쪽(ㅓ), ㅡ 면 아래(ㅜ)·위(ㅗ) */
  const choosing = () => dots === 0 && landed === 0 && !plucking;

  function sideAt(x, y) {
    const g = glyph.getBoundingClientRect();
    if (currentKey % 180 === 0) return x >= g.left + g.width / 2 ? 0 : 180; // ㅣ: 오른쪽·왼쪽
    return y >= g.top + g.height / 2 ? 90 : 270;                            // ㅡ: 아래·위
  }

  // 작대기는 180° 돌려도 모양이 같으므로, 고른 쪽을 향하도록 그 자리에서 바로 뒤집음 (눈에 보이는 변화 없음)
  function faceSide(key) {
    if (key === currentKey) return;
    glyph.style.transition = 'none';
    angle += shortest(key - angle);
    render();
    void glyph.offsetWidth; // 뒤집힌 상태를 바로 적용
    glyph.style.transition = '';
  }

  /* ---- 해가 뜨고 지는 정도: 목표값을 향해 시간에 따라 부드럽게 바뀜 ---- */
  const RISE = 1800;  // 해가 다 뜨기까지(하늘·그림자·높낮이가 살아나는 시간)
  const BOOST = 1400; // 빛과 어둠이 다 세지기까지
  const tween = (dur) => ({ from: 0, to: 0, at: 0, dur });
  const valueOf = (t, now) => t.from + (t.to - t.from) * smooth(clamp((now - t.at) / t.dur));
  function tweenTo(t, to, now) {
    t.from = valueOf(t, now); // 바뀌는 도중이면 지금 값에서 이어서
    t.to = to;
    t.at = now;
  }
  const sun = tween(RISE);    // 해가 뜬 정도 0~1
  const power = tween(BOOST); // 빛이 세진 정도 0~1

  /* ---- 해가 뜨는 순간: 점이 붙은 자리에서 빛이 화면 끝까지 퍼짐 ---- */
  const glyphArea = $('.glyph-area');

  function burst(x, y, power) {
    const d = Math.hypot(window.innerWidth, window.innerHeight) * 2 * power;
    const el = document.createElement('div');
    el.className = 'burst';
    el.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px;margin:${-d / 2}px 0 0 ${-d / 2}px`;
    body.insertBefore(el, glyphArea); // 글자 뒤, 하늘·땅 위
    el.addEventListener('animationend', () => el.remove());
  }

  // 드래그가 아닌 '클릭'만 본다: 붙은 획을 누르면 떼고, 그 밖을 누르면 점을 찍음
  let downAt = null;
  window.addEventListener('pointerdown', (e) => {
    const mark = e.target.closest?.('.mark');
    downAt = { x: e.clientX, y: e.clientY, mark: mark ? marks.indexOf(mark) : -1 };
  });
  window.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const dist = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const { mark } = downAt;
    downAt = null;
    if (dist >= 6) return;
    if (mark >= 0 && marks[mark].dataset.state === 'stroke') pluck(mark);
    else spawnDot(e.clientX, e.clientY);
  });

  /* ---- 접합부 필터 굵기를 글자 크기에 맞춤 ---- */
  const gooBlur = $('#goo-blur');
  const fitGoo = () => gooBlur.setAttribute('stdDeviation', (glyph.offsetWidth * 0.014).toFixed(2));
  fitGoo();
  window.addEventListener('resize', fitGoo);

  /* ---- 하늘: 점(해)이 가리키는 쪽 = 해의 자리 ----
     돌리는 각도를 따라 하늘 밝기가 이어서 바뀜: ㅏ 아침 → ㅗ 한낮 → ㅓ 밤(별) → ㅜ 땅속.
     해가 있는 쪽 하늘은 밝게 비치고 반대쪽은 그늘지며, 어두워질수록 별이 뜸 */
  // [점이 가리키는 각도, 하늘 밝기 0(검정) ~ 1(흰색)]
  const SKY = [[0, 0.9], [90, 0.05], [180, 0.07], [270, 1], [360, 0.9]];
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  function skyAt(deg) {
    const a = norm(deg);
    for (let i = 0; i < 4; i++) {
      const [a0, l0] = SKY[i];
      const [a1, l1] = SKY[i + 1];
      if (a <= a1) return l0 + (l1 - l0) * smooth((a - a0) / (a1 - a0));
    }
    return SKY[0][1];
  }
  const gray = (l) => {
    const v = Math.round(14 + 241 * clamp(l)); // 검정(#0e0e0e) ~ 흰색
    return `rgb(${v},${v},${v})`;
  };

  // 어두워질수록 보이는 별
  const glow = $('#glow');
  const starsEl = $('#stars');
  for (let i = 0; i < 46; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.style.left = `${(Math.random() * 100).toFixed(2)}%`;
    s.style.top = `${(Math.random() * 100).toFixed(2)}%`;
    s.style.setProperty('--r', `${(1.2 + Math.random() * 2).toFixed(1)}px`);
    s.style.setProperty('--tw', `${(2 + Math.random() * 3).toFixed(2)}s`);
    s.style.setProperty('--td', `${(-Math.random() * 5).toFixed(2)}s`);
    starsEl.appendChild(s);
  }

  // 하늘이 어두워지면 글자를 밝게
  let dark = null;
  function setInk(isDark) {
    if (isDark === dark) return;
    dark = isDark;
    const st = body.style;
    st.setProperty('--fg', isDark ? 'var(--off-white)' : 'var(--black)');
    st.setProperty('--line', isDark ? 'var(--gray-8)' : 'var(--gray-2)');
    st.setProperty('--surface', isDark ? 'var(--gray-9)' : 'var(--gray-1)');
  }

  // 글자가 지금 그려진 각도(회전 애니메이션 중이면 그 중간값)
  function drawnAngle() {
    const t = getComputedStyle(glyph).transform;
    const m = t === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t);
    return Math.atan2(m.b, m.a);
  }

  // 지금 그려진 각도로 하늘을 칠함 (손으로 돌리는 중에도, 놓은 뒤 튕기는 동안에도 그대로 따라감)
  // lit: 해가 뜬 정도 0(점 없음, 회색 새벽) ~ 1(해가 다 뜸)
  const DAWN = 0.6;
  let skyKey = '';
  let skyL = DAWN; // 지금 하늘 밝기 (땅·구름 색을 정할 때 씀)
  // boost: 둘째 점으로 빛이 세진 정도 — 밝은 하늘은 더 밝게, 어두운 하늘은 더 어둡게
  function paintSky(theta, lit, boost) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const key = `${theta.toFixed(4)}|${lit.toFixed(4)}|${boost.toFixed(4)}|${W}|${H}`;
    if (key === skyKey) return; // 바뀐 게 없으면 다시 칠하지 않음
    skyKey = key;

    const L0 = DAWN + (skyAt((theta * 180) / Math.PI) - DAWN) * lit;
    const L = clamp(0.5 + (L0 - 0.5) * (1 + 0.5 * boost)); // 가운데(0.5)에서 멀어지게 = 대비가 커짐
    skyL = L;
    body.style.setProperty('--bg', gray(L));
    setInk(L < 0.5);
    starsEl.style.opacity = clamp((0.32 - L) / 0.24).toFixed(3);

    // 해는 화면 밖 먼 곳, 점이 가리키는 쪽에 있다고 보고 그쪽 하늘을 밝히고 반대쪽엔 그늘을 드리움
    const r = glyph.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const far = Math.max(W, H) * 0.65;
    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    const reach = Math.max(W, H) * 1.1;
    // 해가 없으면 빛도 그늘도 없음. 빛이 세지면 해 쪽은 더 환하고 반대쪽 그늘은 더 짙음
    const light = Math.min(0.9, (0.1 + 0.55 * Math.sqrt(L)) * lit * (1 + 0.8 * boost)).toFixed(3); // 밤엔 달빛처럼 희미하게
    const dim = ((0.22 * smooth(clamp((L - 0.1) / 0.9)) * (1 + 1.6 * boost)) * lit).toFixed(3);   // 밤엔 그늘이 따로 없음
    glow.style.background =
      `radial-gradient(circle at ${cx + ux * far}px ${cy + uy * far}px, rgba(255,255,255,${light}) 0, rgba(255,255,255,0) ${reach}px),` +
      `radial-gradient(circle at ${cx - ux * far}px ${cy - uy * far}px, rgba(0,0,0,${dim}) 0, rgba(0,0,0,0) ${reach}px)`;
  }

  /* ---- 그림자: 작대기(사람)가 점(해·달) 반대쪽으로 그림자를 드리움 ----
     해가 낮은 아침(ㅏ)엔 옅고 길게, 밤(ㅓ)엔 달빛에 길게 드리우며, 해가 머리 위인 한낮(ㅗ)과 땅속(ㅜ)엔 없음 */
  // [점이 가리키는 각도, 그림자 길이(글자 판 너비 대비), 진하기] — 밤하늘은 어두워서 더 진하게
  const SHADOW = [[0, 0.42, 0.11], [90, 0, 0], [180, 0.5, 0.6], [270, 0, 0], [360, 0.42, 0.11]];
  function shadowAt(deg) {
    const a = norm(deg);
    for (let i = 0; i < 4; i++) {
      const [a0, l0, k0] = SHADOW[i];
      const [a1, l1, k1] = SHADOW[i + 1];
      if (a <= a1) {
        let t = (a - a0) / (a1 - a0);
        t = t * t * (3 - 2 * t);
        return [l0 + (l1 - l0) * t, k0 + (k1 - k0) * t];
      }
    }
    return [SHADOW[0][1], SHADOW[0][2]];
  }

  const shade = $('#shade');
  const sctx = shade.getContext('2d');
  const world = $('#world');
  const wctx = world.getContext('2d');
  const longEl = glyph.querySelector('.long');
  let sdpr = 1;
  function fitCanvases() {
    sdpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [shade, world]) {
      c.width = Math.round(window.innerWidth * sdpr);
      c.height = Math.round(window.innerHeight * sdpr);
    }
  }
  fitCanvases();
  window.addEventListener('resize', fitCanvases);

  // lit: 해가 뜬 정도(0이면 그림자 없음), boost: 빛이 세진 정도(그림자가 더 짙고 길어짐)
  function paintShade(theta, lit, boost) {
    const r = glyph.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const Wg = glyph.offsetWidth;
    sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    sctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // 그림자: 글자 판 안에서는 점이 +x 쪽이므로, 작대기와 획을 -x 쪽으로 길게 늘여 옅어지게 칠함
    const [len, a0] = shadowAt((theta * 180) / Math.PI);
    const k = Math.min(0.88, a0 * lit * (1 + 0.7 * boost));
    if (len < 0.005 || k < 0.005) return;
    const alpha = k.toFixed(3);
    const L = len * Wg * (1 + 0.3 * boost);
    const parts = [longEl, ...marks].filter((el) => el.dataset.state !== 'none');

    sctx.save();
    sctx.translate(cx, cy);
    sctx.rotate(theta);
    let left = Infinity;
    let right = -Infinity;
    const path = new Path2D();
    for (const el of parts) {
      const x0 = el.offsetLeft - Wg / 2;
      const y0 = el.offsetTop - Wg / 2;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      left = Math.min(left, x0);
      right = Math.max(right, x0 + w);
      // 멀어질수록 조금 좁아지는 사다리꼴 (드리운 그림자처럼)
      const taper = h * 0.14;
      path.moveTo(x0 + w, y0);
      path.lineTo(x0 - L, y0 + taper);
      path.lineTo(x0 - L, y0 + h - taper);
      path.lineTo(x0 + w, y0 + h);
      path.closePath();
    }
    const g = sctx.createLinearGradient(right, 0, left - L, 0);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop((right - left) / (right - left + L), `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = g;
    sctx.filter = `blur(${(Wg * 0.012).toFixed(1)}px)`; // 그림자 가장자리를 부드럽게
    sctx.fill(path);
    sctx.restore();
  }

  /* ---- 하늘 위 · 땅 아래 ----
     점(해)이 가리키는 세로 방향 s = sin(각도): -1 위(ㅗ), 0 옆(ㅏ·ㅓ, 땅 위), +1 아래(ㅜ).
     보는 높이(카메라)를 s 에 맞춰 옮긴다.
     위로 돌리면 땅이 아래로 빠지고, 획 모양 구름이 위에서 내려와 지나가며 글자가 떠오른다.
     아래로 돌리면 지평선이 아래에서 올라와 화면을 덮고, 글자가 땅의 켜와 돌 사이로 가라앉는다.
     위·아래에 머물면 구름·땅켜가 천천히 계속 흘러 계속 오르는/가라앉는 느낌을 줌 */
  let seed = 11; // 매번 같은 모양이 나오도록 정해 둔 난수
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // 구름: 글자 획 같은 가로 막대 2~3개. p 는 가까운 정도(클수록 크고 빨리 지나감)
  const CLOUDS = Array.from({ length: 8 }, (_, i) => {
    const n = 2 + Math.round(rand());
    const bars = [];
    for (let k = 0; k < n; k++) {
      bars.push({ x: (rand() - 0.5) * 0.5, y: k, len: k === 0 ? 0.45 + rand() * 0.2 : 0.75 + rand() * 0.35 });
    }
    return { x: rand(), y: (i + rand() * 0.8) / 8, p: 0.7 + rand() * 0.6, bars };
  });
  // 땅켜(물결진 가로선)와 돌 — 한 주기 안의 깊이(0~1)
  const STRATA = [0.08, 0.27, 0.5, 0.64, 0.85].map((d) => ({
    d, amp: 0.004 + rand() * 0.01, f: 1.5 + rand() * 2.5, ph: rand() * 6.283,
  }));
  // 땅속에 박힌 글자 조각: 이응(ㅇ)과 모음의 점(·)을 번갈아
  const PEBBLES = Array.from({ length: 16 }, (_, i) => ({
    x: rand(), d: rand(), ring: i % 2 === 0, k: rand(),
  }));

  const mod = (v, n) => ((v % n) + n) % n;
  const FONT = getComputedStyle(body).fontFamily; // 페이지 글꼴(Pretendard)
  let cloudDrift = 0; // 위에 머무는 동안 구름이 내려온 거리
  let soilDrift = 0;  // 아래에 머무는 동안 땅켜가 올라간 거리
  let windX = 0;      // 구름이 옆으로 흐른 거리

  function paintWorld(s, W, H, U) {
    wctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    wctx.clearRect(0, 0, W, H);
    if (U < 4 || W < 1 || H < 1) return; // 화면이 너무 작으면(글자 크기 0) 그리지 않음 — 땅켜 반복이 끝나지 않는 것을 막음

    const Y0 = H - Math.max(28, H * 0.08); // 옆(ㅏ·ㅓ)일 때 지평선: 화면 맨 아래
    const UP = H * 1.4;                    // 맨 위(ㅗ)까지 오르는 높이
    const DOWN = Y0 + H * 0.12;            // 맨 아래(ㅜ)까지 내려가는 깊이: 지평선이 화면 위로 넘어감
    const A = s < 0 ? -s * UP : -s * DOWN; // 카메라 높이
    const horizon = Y0 + A;

    // 구름 — 위로 반쯤 돌았을 때부터 보임
    const ca = smooth(clamp(-s / 0.5));
    if (ca > 0.003) {
      const band = H * 1.5;
      wctx.fillStyle = gray(skyL - 0.09);
      wctx.globalAlpha = ca;
      for (const c of CLOUDS) {
        const k = 0.55 + ((c.p - 0.7) / 0.6) * 0.5; // 멀수록 작게
        const len = U * 0.62 * k;
        const t = U * 0.05 * k;
        const span = W + len * 2;
        const x = mod(c.x * span + windX * c.p, span) - len;
        const y = mod(c.y * band + cloudDrift * c.p, band) - H * 0.25 + c.p * (A - UP);
        if (y < -t * 6 || y > H + t) continue;
        for (const b of c.bars) {
          const l = len * b.len;
          wctx.beginPath();
          wctx.roundRect(x + b.x * len - l / 2, y + b.y * t * 1.7 - t / 2, l, t, t / 2);
          wctx.fill();
        }
      }
      wctx.globalAlpha = 1;
    }

    // 땅
    if (horizon >= H) return;
    // 땅은 늘 하늘보다 어둡고, 깊이 들어갈수록 땅속 빛깔로 어두워짐
    const Lg = skyL * 0.7 + (0.076 - skyL * 0.7) * smooth(clamp(s));
    const top = Math.max(horizon, -10);
    wctx.fillStyle = gray(Lg);
    wctx.fillRect(0, top, W, H - top);

    // 선은 새긴 듯이: 어두운 선 + 바로 아래 밝은 선. 땅이 어떤 회색이어도 보임
    const lw = Math.max(1, U * 0.003);
    const engrave = (path, a) => {
      wctx.lineWidth = lw;
      wctx.strokeStyle = `rgba(0,0,0,${(a * 0.9).toFixed(3)})`;
      wctx.stroke(path);
      wctx.translate(0, lw);
      wctx.strokeStyle = `rgba(255,255,255,${(a * 0.7).toFixed(3)})`;
      wctx.stroke(path);
      wctx.translate(0, -lw);
    };
    const P = U * 1.3;   // 땅켜 한 주기
    const m = U * 0.06;  // 지평선 바로 아래 여백

    // 같은 무늬를 주기마다 되풀이. 지평선 쪽으로 올라오는 것은 흐려지며 사라짐
    const each = (d, draw) => {
      const dd = mod(d * P - soilDrift, P);
      for (let k = 0; ; k++) {
        const y = horizon + m + dd + k * P;
        if (y > H + 20) break;
        if (y < -20) continue;
        draw(y, k === 0 ? smooth(clamp(dd / (0.12 * P))) : 1);
      }
    };
    for (const st of STRATA) {
      each(st.d, (y, fade) => {
        const path = new Path2D();
        for (let x = 0; x <= W + 24; x += 24) {
          const yy = y + Math.sin((x / W) * st.f * 6.283 + st.ph) * st.amp * U;
          if (x === 0) path.moveTo(x, yy);
          else path.lineTo(x, yy);
        }
        engrave(path, 0.3 * fade);
      });
    }
    // ㅇ·점은 땅보다 한 톤 밝게(땅이 밝으면 어둡게) 납작하게 칠함
    const mv = Math.round(14 + 241 * clamp(Lg + 0.24 * (1 - 2 * smooth(clamp((Lg - 0.35) / 0.2)))));
    wctx.textAlign = 'center';
    wctx.textBaseline = 'middle';
    for (const pb of PEBBLES) {
      each(pb.d, (y, fade) => {
        wctx.fillStyle = `rgba(${mv},${mv},${mv},${fade.toFixed(3)})`;
        const x = pb.x * W;
        if (pb.ring) {
          wctx.font = `700 ${(U * (0.04 + pb.k * 0.05)).toFixed(1)}px ${FONT}`;
          wctx.fillText('ㅇ', x, y);
        } else {
          wctx.beginPath();
          wctx.arc(x, y, U * (0.007 + pb.k * 0.011), 0, Math.PI * 2);
          wctx.fill();
        }
      });
    }
  }

  // 매 프레임: 지금 그려진 각도로 글자 높이 → 하늘 → 땅·구름 → 그림자 순서로 칠함
  let lastNow = null;
  function frame(now) {
    const dt = lastNow === null ? 0 : Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    const theta = drawnAngle();
    const W = window.innerWidth;
    const H = window.innerHeight;

    // 해가 뜬 정도와 빛이 세진 정도 (점이 붙은 뒤 시간으로 정함)
    const lit = valueOf(sun, now);
    const boost = valueOf(power, now);
    // 세로 방향(-1 위 ~ +1 아래). 해가 없으면 방향도 없어서 오르지도 가라앉지도 않음
    const s = Math.sin(theta) * lit;

    const flow = dt * H * 0.035 * (1 + boost); // 빛이 세지면 두 배로 흐름
    cloudDrift += flow * smooth(clamp((-s - 0.5) / 0.5));
    soilDrift += flow * smooth(clamp((s - 0.5) / 0.5));
    windX += dt * 7 * (1 + boost);

    // 글자도 가는 쪽으로 조금 앞서 감. 하늘에선 둥실 떠 있음
    const bob = Math.sin(now / 520) * H * 0.012 * smooth(clamp((-s - 0.6) / 0.4));
    glyphArea.style.translate = `0 ${(s * 0.05 * H + bob).toFixed(2)}px`;

    paintSky(theta, lit, boost);
    paintWorld(s, W, H, glyph.offsetWidth);
    paintShade(theta, lit, boost);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---- 키보드: 방향키로 그쪽을 가리키게 돌림 ---- */
  // Backspace·Delete: 마지막에 붙은 획부터 뗌
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (order.length) pluck(order[order.length - 1]);
      return;
    }
    if (!(e.key in KEYS)) return;
    e.preventDefault();
    aimAt(KEYS[e.key]);
  });

  render();
})();
