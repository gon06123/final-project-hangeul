/* 01 자음 첫 화면 — 화면 아래로 잘린 커다란 오각형 원판. 다섯 칸에 ㄱ ㄴ ㅁ ㅅ ㅇ.
   시계 방향으로 ㄱ(木) ㄴ(火) ㅁ(土) ㅅ(金) ㅇ(水) — 상생 순서.
   원판을 돌려 맨 위로 온 칸이 고른 칸: 끌어서 돌리기, 마우스 휠, 좌우 방향키, 옆 칸을 누르면 그 칸이 위로.
   ㄱ 이 맨 위에 있을 때 누르면(또는 Enter) 그 ㄱ 이 화면 아래로 날아가 나무의 뿌리가 되고 ㄱ 나무가 시작된다.
   ㅇ 이 맨 위에 있을 때 누르면 원판이 스르르 사라지고 ㅇ 연못이 나타나 수면에 첫 파문이 퍼진다 (js/pond.js).
   나머지 칸은 아직 비워 둠(글자만 옅게). 왼쪽 위 돌아가기(←) 버튼이나 Esc 로 돌아온다. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tree = window.hangulTree;
  const pond = window.hangulPond;

  const body = document.body;
  const penta = document.getElementById('penta');
  const svg = penta.querySelector('svg');
  const back = document.getElementById('to-penta');
  const live = document.getElementById('live');

  // 나무의 ㄱ 과 같은 모양 (js/consonant.js 가 글꼴 ㄱ 을 재서 정함): 글자 크기 1, 원점 = 세로획 아래 가운데
  const gPath = ({ T, TH, ARM }) => `M${-ARM} -1 H${T / 2} V0 H${-T / 2} V${-1 + TH} H${-ARM} Z`;
  const gCenter = ({ T, ARM }) => [-(ARM - T / 2) / 2, -0.5]; // 원점에서 본 잉크 가운데

  const R = 90;         // 원 반지름 (viewBox 단위, viewBox 는 -100~100)
  const STEP = 72;      // 한 칸 = 72°
  const CELLS = [
    { ch: 'ㄱ', open: true, scene: 'tree', name: 'ㄱ 나무' },
    { ch: 'ㄴ' },
    { ch: 'ㅁ' },
    { ch: 'ㅅ' },
    { ch: 'ㅇ', open: true, scene: 'pond', name: 'ㅇ 연못' },
  ];
  const POND = 4; // ㅇ 칸

  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const at = (deg, r) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];

  // 원이 커서 실제 72° 옆 칸은 화면 밖에 있음 → 원 크기는 그대로 두고, 글자 자리만 맨 위 쪽으로 당김.
  // 실제 각 a(맨 위 = 0°) → 보이는 각 warp(a): 0→0, ±72→±SIDE, ±180→±180 을 매끄럽게 잇는 곡선
  let SIDE = STEP; // 바로 옆 칸 글자가 보이는 각 (layout() 이 화면에 맞춰 정함)
  function warpCore(x) { // 0 ≤ x ≤ 180, 단조 증가하는 3차 Hermite (Fritsch–Carlson 으로 넘침 방지)
    const s1 = SIDE / STEP;
    const s2 = (180 - SIDE) / (180 - STEP);
    const m1 = Math.min((s1 + s2) / 2, 3 * s1, 3 * s2);
    const [x0, x1, y0, y1, ma, mb] = x <= STEP ? [0, STEP, 0, SIDE, s1, m1] : [STEP, 180, SIDE, 180, m1, s2];
    const h = x1 - x0;
    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * ma + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * mb;
  }
  const warp = (a) => { // 아무 각이나 (360° 마다 반복)
    const base = 360 * Math.round(a / 360);
    const x = a - base; // -180 ~ 180
    return base + Math.sign(x) * warpCore(Math.abs(x));
  };
  // 칸 k 의 부채꼴: 실제 각 a 를 가운데로 ±36° → 보이는 각으로
  const wedge = (a) => {
    const p0 = warp(a - STEP / 2);
    const p1 = warp(a + STEP / 2);
    const [x0, y0] = at(-90 + p0, R);
    const [x1, y1] = at(-90 + p1, R);
    return `M0 0 L${x0} ${y0} A${R} ${R} 0 ${p1 - p0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
  };

  // 글자는 페이지 글꼴(Pretendard) SemiBold 로 씀. 잉크(실제 그려지는 부분) 가운데가 (0,0),
  // 다섯 글자 가운데 가장 큰 것의 높이가 1 이 되게 fitLetters() 가 크기·자리를 맞춤
  const FONT_PX = 100;
  const glyphs = []; // { node: <text>, ch }

  function glyph(ch) {
    const t = el('text', { class: 'glyph', 'font-size': FONT_PX, 'font-weight': 600 });
    t.textContent = ch;
    glyphs.push({ node: t, ch });
    return t;
  }

  function letter(ch) {
    const g = el('g', { class: 'letter' });
    g.append(glyph(ch));
    if (ch === 'ㄱ') {
      // 날아갈 자리를 재는 보이지 않는 ㄱ (나무의 ㄱ 과 같은 모양, 세로획 아래 가운데가 원점).
      // 자리·크기는 fitLetters() 가 글꼴 ㄱ 에 겹치게 맞춤
      const inner = el('g', { class: 'glyph-ref-frame' });
      inner.append(el('path', { class: 'glyph-ref' }));
      g.append(inner);
    }
    return g;
  }

  // 캔버스로 글꼴의 실제 잉크 범위를 재서 글자마다 가운데·크기를 맞춤 (글꼴을 다 받은 뒤 다시)
  let fitK = 0.01;
  function fitLetters() {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `600 ${FONT_PX}px ${getComputedStyle(body).fontFamily}`;
    const box = {};
    let hMax = 0;
    for (const { ch } of glyphs) {
      if (box[ch]) continue;
      const m = c.measureText(ch);
      box[ch] = {
        cx: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
        cy: (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2,
        h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      };
      hMax = Math.max(hMax, box[ch].h);
    }
    if (!hMax) return;
    fitK = 1 / hMax;
    for (const { node, ch } of glyphs) {
      node.setAttribute('transform', `scale(${fitK}) translate(${-box[ch].cx} ${-box[ch].cy})`);
    }

    // 나무 ㄱ 모양을 글꼴 ㄱ 에 겹치게: ㄱ 잉크 높이(gh) 가 나무 ㄱ 의 크기 1
    const shape = tree.measure();
    const gh = box['ㄱ'].h * fitK;
    const [mx, my] = gCenter(shape);
    const d = gPath(shape);
    // 칸 안: 글자 가운데에서 나무 ㄱ 원점으로
    document.querySelectorAll('.glyph-ref-frame').forEach((f) => f.setAttribute('transform', `scale(${gh}) translate(${-mx} ${-my})`));
    document.querySelectorAll('.glyph-ref').forEach((p) => p.setAttribute('d', d));
    // 나는 ㄱ: 나무 ㄱ 원점에서 글자 가운데로 (크기 1 = ㄱ 잉크 높이)
    flyerText.setAttribute('transform', `translate(${mx} ${my}) scale(${1 / gh})`);
    flyerPath.setAttribute('d', d);
  }

  /* ---------- 원판 그리기 ---------- */
  const art = el('g', { class: 'penta-art' });   // 나무로 넘어갈 때 사라지는 층
  const cells = [];
  const marks = []; // 칸마다 글자 + 글자 뒤 바탕

  // 테두리 원을 먼저 그려서, 선 위에 얹힌 글자가 선을 가리게 함
  art.append(el('circle', { class: 'edge', cx: 0, cy: 0, r: R }));

  CELLS.forEach((c, k) => {
    const cell = el('g', {
      class: `cell ${c.open ? 'is-open' : 'is-locked'}`,
      'data-k': k,
      'aria-hidden': 'true',
    });
    cell.append(el('path', { class: 'cell-bg' })); // 모양은 draw() 가 돌 때마다 정함

    // 글자는 원 둘레 선 위에, 바깥을 향해 세움 → 맨 위로 왔을 때 똑바로 섬
    const mark = el('g', { class: 'mark' }); // 자리·크기는 layout() 이 화면에 맞춰 정함
    marks.push(mark);
    mark.append(el('circle', { class: 'cell-dot', cx: 0, cy: 0, r: 0.75 })); // 글자 뒤 바탕: 선을 끊고 누르는 자리
    mark.append(letter(c.ch));
    cell.append(mark);
    cells.push(cell);
    art.append(cell);
  });
  svg.append(art);

  svg.setAttribute('tabindex', '0');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-roledescription', '원판');
  svg.setAttribute('aria-label', '자음 원판. 좌우 방향키로 돌리고, ㄱ 이 맨 위에 오면 Enter 로 ㄱ 나무를, ㅇ 이 맨 위에 오면 ㅇ 연못을 엽니다.');

  const openCell = cells[0];
  const openGlyph = openCell.querySelector('.glyph-ref'); // 날아갈 ㄱ 의 자리 (세로획 아래 가운데가 원점)

  /* ---------- 크기·자리: 화면 양옆으로 넘칠 만큼 크게, 원 꼭대기는 화면 40% 높이 ---------- */
  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rPx = Math.max(W * 0.6, H * 0.7);    // 원 반지름(px). 지름이 화면 폭보다 큼
    const size = (rPx * 200) / R;              // viewBox 200 단위 전체
    const cy = H * 0.4 + rPx;                  // 원 중심 (꼭대기 글자가 H*0.4 에 옴)
    svg.style.width = `${size}px`;
    svg.style.height = `${size}px`;
    svg.style.left = `${W / 2 - size / 2}px`;
    svg.style.top = `${cy - size / 2}px`;

    // 글자 크기(px)는 원 크기와 따로, 화면 높이 기준 (울트라와이드에서도 너무 커지지 않게)
    const letterPx = Math.min(H * 0.2, W * 0.3);
    letterUnits = (letterPx * R) / rPx; // px → viewBox 단위

    // 옆 칸 글자: 가운데가 화면 옆(또는 아래) 가장자리 조금 바깥 → 글자의 40% 쯤만 살짝 보임
    const peek = letterPx * 0.1;
    const clamp1 = (v) => Math.max(-1, Math.min(1, v));
    const byX = Math.asin(clamp1((W / 2 + peek) / rPx));
    const byY = Math.acos(clamp1(1 - (H * 0.6 + peek) / rPx));
    SIDE = Math.max(5, Math.min(STEP, (Math.min(byX, byY) * 180) / Math.PI));
    draw();

    // 오행 설명은 맨 위 글자(뒤 바탕 원 포함) 바로 아래에서 시작
    penta.style.setProperty('--info-top', `${H * 0.4 + letterPx * 0.75 + Math.max(12, H * 0.02)}px`);

    // 원 선 두께도 화면이 클수록 굵게 (1.5px ~ 4px)
    svg.style.setProperty('--edge-w', `${Math.min(4, Math.max(1.5, H / 600))}px`);
  }
  /* ---------- 돌리기 ---------- */
  let rot = 0;   // 원판 각도(연속값, 목표). 칸 k 가 맨 위 ⇔ rot ≡ -72k
  let shown = 0; // 지금 그려진 각도 (rot 를 부드럽게 따라감)
  let letterUnits = 1;
  let shownTop = 0;
  const norm = (a) => ((a % 360) + 360) % 360;
  const shortest = (d) => { d = norm(d); return d > 180 ? d - 360 : d; };
  const topIndex = () => norm(Math.round(-rot / STEP) * STEP) / STEP;

  // 칸마다 실제 각(k·72° + shown)을 보이는 각으로 바꿔 글자·부채꼴을 놓음
  function draw() {
    marks.forEach((m, k) => {
      const a = shortest(k * STEP + shown);
      const p = warp(a);
      const [x, y] = at(-90 + p, R);
      m.setAttribute('transform', `translate(${x} ${y}) rotate(${p}) scale(${letterUnits})`);
      cells[k].firstChild.setAttribute('d', wedge(a));
    });
  }

  // 놓으면 가장 가까운 칸이 위로 오며 부드럽게 감속 (예전 CSS cubic-bezier(.22,1,.36,1) 과 비슷하게)
  const SPIN_MS = reduce ? 1 : 900;
  let tween = null;
  function spin(now) {
    const t = Math.min(1, (now - tween.t0) / SPIN_MS);
    shown = tween.from + (rot - tween.from) * (1 - Math.pow(1 - t, 4));
    draw();
    if (t < 1) tween.raf = requestAnimationFrame(spin);
    else tween = null;
  }
  function moveTo(instant) {
    if (tween) cancelAnimationFrame(tween.raf);
    tween = null;
    if (instant) { shown = rot; draw(); return; }
    tween = { from: shown, t0: performance.now() };
    tween.raf = requestAnimationFrame(spin);
  }

  layout();
  window.addEventListener('resize', layout);

  // 맨 위 칸 글자의 오행 설명 (index.html 의 .element)
  const elementEls = [...document.querySelectorAll('.element')];

  function render(instant) {
    moveTo(instant);
    const k = topIndex();
    cells.forEach((c, i) => c.classList.toggle('is-top', i === k));
    elementEls.forEach((e) => {
      const on = Number(e.dataset.k) === k;
      e.classList.toggle('is-active', on);
      e.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    if (k !== shownTop) {
      shownTop = k;
      const c = CELLS[k];
      const name = elementEls[k] ? elementEls[k].querySelector('.el-name').textContent : '';
      live.textContent = c.open ? `${c.ch}, ${name}. Enter 로 ${c.name} 열기` : `${c.ch}, ${name} (비어 있음)`;
    }
  }
  const settle = () => { rot = Math.round(rot / STEP) * STEP; render(); };
  const turnTo = (k, instant) => { rot += shortest(-k * STEP - rot); render(instant); };
  const stepBy = (dir) => { rot = Math.round(rot / STEP) * STEP - dir * STEP; render(); }; // +1: 오른쪽 칸이 위로
  render(true);

  const center = () => {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // 끌어서 돌리기 (원판 중심을 축으로 손가락을 따라감). 거의 안 움직이고 떼면 '누름'
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (busy || view !== 'penta') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { svg.setPointerCapture(e.pointerId); } catch { /* 포인터가 이미 사라진 경우 */ }
    const c = center();
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, target: e.target,
      last: Math.atan2(e.clientY - c.y, e.clientX - c.x),
    };
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.moved = true;
      penta.classList.add('is-dragging');
    }
    const c = center();
    const a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    rot += shortest(((a - drag.last) * 180) / Math.PI);
    drag.last = a;
    render(true);
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, target } = drag;
    drag = null;
    penta.classList.remove('is-dragging');
    if (moved || cancelled) { settle(); return; }
    // 누름: 맨 위 칸이면 열고, 옆 칸이면 그 칸을 위로 돌려 옴.
    // 글자(와 글자 뒤 동그란 바탕)를 눌렀을 때만 — 부채꼴의 빈 곳이나 그 위의 설명 글을 누르면 아무 일 없음
    const cell = target.closest && target.closest('.mark') && target.closest('.cell');
    if (!cell) return;
    const k = Number(cell.dataset.k);
    if (k === topIndex()) { if (CELLS[k].open) enter(CELLS[k].scene, true); }
    else turnTo(k);
  }
  svg.addEventListener('pointerup', (e) => endDrag(e, false));
  svg.addEventListener('pointercancel', (e) => endDrag(e, true));

  // 마우스 휠: 한 번 굴리면 한 칸
  let wheelAt = 0;
  penta.addEventListener('wheel', (e) => {
    if (busy || view !== 'penta') return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const now = performance.now();
    if (Math.abs(d) < 4 || now - wheelAt < 320) return;
    wheelAt = now;
    stepBy(d > 0 ? 1 : -1);
  }, { passive: false });

  svg.addEventListener('keydown', (e) => {
    if (busy || view !== 'penta') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stepBy(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stepBy(-1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      const c = CELLS[topIndex()];
      if (c.open) enter(c.scene, true);
    }
  });

  /* ---------- 위 칸의 ㄱ ↔ 나무 뿌리 ㄱ 사이를 나는 글자 ---------- */
  const flight = el('svg', { class: 'flight', 'aria-hidden': 'true' });
  const flyer = el('g');
  const flyerPath = el('path', { fill: 'currentColor' }); // 나무 ㄱ (모양은 fitLetters 가 채움)
  // 칸의 글꼴 ㄱ: 칸 안에서와 같은 자리·크기 (fitLetters 가 맞춤). 나는 동안 나무 ㄱ 과 서로 스르르 바뀜
  const flyerText = el('g', { class: 'flyer-text' });
  flyerText.append(glyph('ㄱ'));
  flyer.append(flyerText, flyerPath);
  flight.append(flyer);
  flight.style.display = 'none';
  body.append(flight);

  // 글꼴을 받기 전에도 대강 맞춰 두고, 받은 뒤 다시 맞춤
  fitLetters();
  if (document.fonts) {
    document.fonts.load(`600 ${FONT_PX}px Pretendard`, 'ㄱㄴㅁㅅㅇ').then(fitLetters, () => {});
    document.fonts.ready.then(fitLetters);
  }

  // 칸 안 ㄱ 의 화면 위치: 세로획 아래 가운데 (x, y), 글자 크기 s(px)
  function cellGlyph() {
    const m = openGlyph.getScreenCTM();
    return { x: m.e, y: m.f, s: Math.hypot(m.a, m.b), shade: 0 };
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // 칸의 ㄱ ↔ 나무 뿌리 ㄱ 사이를 낢. toScene: 칸 → 나무면 글꼴 ㄱ 이 나무 ㄱ 으로, 돌아올 때는 그 반대로 바뀌며 남
  function fly(from, to, done, toScene) {
    const DUR = reduce ? 1 : 850;
    const t0 = performance.now();
    flight.style.display = '';
    const frame = (now) => {
      const k = easeInOut(Math.min(1, (now - t0) / DUR));
      flyer.setAttribute('transform',
        `translate(${lerp(from.x, to.x, k)} ${lerp(from.y, to.y, k)}) scale(${lerp(from.s, to.s, k)})`);
      const c = tree.color(lerp(from.shade || 0, to.shade || 0, k)); // 옅어진 뿌리 ㄱ 도 자연스럽게
      flyerPath.style.fill = c;
      flyerText.style.fill = c;
      const shape = toScene ? k : 1 - k; // 나무 ㄱ 이 보이는 정도
      flyerPath.style.opacity = shape;
      flyerText.style.opacity = 1 - shape;
      if (k < 1) requestAnimationFrame(frame);
      else { flight.style.display = 'none'; done(); }
    };
    frame(t0);
    requestAnimationFrame(frame);
  }

  /* ---------- 화면 바꾸기 ---------- */
  const SCENES = ['tree', 'pond'];
  let view = SCENES.includes(body.dataset.view) ? body.dataset.view : 'penta';
  let busy = false;
  let pushed = false;

  // 화면마다: 칸 번호, 되돌리기. 나무만 ㄱ 이 칸 ↔ 뿌리 사이를 날고(cellAt·at), 연못은 화면만 스르르 바뀜
  const SCENE = {
    tree: { k: 0, cellAt: cellGlyph, at: () => tree.rootGlyph(), reset: () => tree.reset() },
    pond: { k: POND, reset: () => pond.reset(), landed: () => pond.land() },
  };

  function enter(scene, push) {
    if (busy || view !== 'penta' || !SCENE[scene]) return;
    const S = SCENE[scene];
    busy = true;
    if (push) { history.pushState({ view: scene }, '', `#${scene}`); pushed = true; }
    turnTo(S.k, true); // 바로 그 칸을 위로 (앞으로 가기로 들어올 때 다른 칸이 위여도 그 칸에서 시작하게)
    S.reset();
    penta.classList.add('is-dim'); // 원판은 사라짐 (나무: 바탕만 남은 채 ㄱ 이 날아감)
    // 연못: 날아가는 글자 없이 바로 연못 화면으로 (연못이 스르르 나타나며 수면에 첫 파문)
    if (!S.cellAt) {
      view = scene;
      body.dataset.view = scene;
      busy = false;
      S.landed();
      return;
    }
    const cell = cells[S.k];
    cell.classList.add('is-flying');
    fly(S.cellAt(), S.at(), () => {
      view = scene;
      body.dataset.view = scene;
      cell.classList.remove('is-flying');
      busy = false;
    }, true);
  }

  function leave() {
    if (busy || view === 'penta') return;
    const scene = view;
    const S = SCENE[scene];
    busy = true;
    const from = S.cellAt ? tree.rootGlyph() : null; // 나무: 지금 그려진 뿌리 ㄱ 에서 출발
    view = 'penta';
    body.dataset.view = 'penta';
    penta.classList.remove('is-dim'); // 원판이 다시 나타남
    // 연못: 바로 원판으로. 연못은 글자·꽃이 남은 채 스르르 사라진 뒤에 비움 (css 의 #pond 사라지는 시간 0.9초)
    if (!S.cellAt) {
      setTimeout(() => { if (view === 'penta') S.reset(); }, 1000);
      busy = false;
      svg.focus({ preventScroll: true });
      return;
    }
    S.reset();
    const cell = cells[S.k];
    cell.classList.add('is-flying');
    fly(from, S.cellAt(), () => {
      cell.classList.remove('is-flying');
      busy = false;
      svg.focus({ preventScroll: true });
    }, false);
  }

  function goBack() {
    if (pushed && history.state && history.state.view === view) {
      history.back(); // popstate 에서 돌아감
    } else {
      history.replaceState(null, '', location.pathname + location.search);
      leave();
    }
  }

  back.addEventListener('click', (e) => {
    e.stopPropagation(); // 나무·연못이 이 클릭에 반응하지 않게
    goBack();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view !== 'penta') goBack();
  });
  const hashScene = () => SCENES.find((s) => location.hash === `#${s}`);
  window.addEventListener('popstate', () => {
    const s = hashScene();
    if (s && s === view) return;
    if (view !== 'penta') leave();
    else if (s) enter(s, false);
  });

  // 주소가 #tree·#pond 로 열리면 바로 그 화면
  if (hashScene()) {
    view = hashScene();
    body.dataset.view = view;
    penta.classList.add('is-dim');
    if (view === 'pond') requestAnimationFrame(() => pond.land());
  }

  /* ---------- 처음 들어오면: 프로젝트 소개 ----------
     천·지·인(· ㅡ ㅣ)이 그어지고 다섯 기본 자음이 써진 뒤 짧은 설명이 뜸.
     화면을 누르면(Enter·Space·Esc) 다섯 자음이 원판의 제자리로 내려가 원판이 되고,
     하늘(·)과 사람(ㅣ)은 오른쪽 위로 날아가 만나 음양 버튼의 ㅏ(어두운 화면이면 ㅓ)가 됨 */
  const intro = document.getElementById('intro');
  if (intro && view === 'penta') startIntro();
  else if (intro) intro.remove();

  function startIntro() {
    busy = true;
    penta.classList.add('is-intro', 'is-intro-frame');
    const isvg = intro.querySelector('.intro-svg');
    const text = intro.querySelector('.intro-text');

    // 천·지·인 (점·가로·세로 차례로) + 아래 작은 이름
    const T0 = 300;
    const trio = el('g', { class: 'intro-trio' });
    const dot = el('circle');
    const earth = el('line', { pathLength: 1 });
    const man = el('line', { pathLength: 1 });
    [dot, earth, man].forEach((n, i) => n.style.setProperty('--d', `${T0 + i * 350}ms`));
    const caps = ['하늘', '땅', '사람'].map((s, i) => {
      const t = el('text', { class: 'intro-cap' });
      t.textContent = s;
      t.style.setProperty('--d', `${T0 + i * 350 + 250}ms`);
      return t;
    });
    trio.append(dot, earth, man, ...caps);

    // 다섯 기본 자음: 원판 글자와 같은 글꼴·크기 맞춤(fitLetters)을 써서, 날아가 그대로 원판 글자가 됨
    const letters = CELLS.map((c, k) => {
      const outer = el('g');
      const inner = el('g', { class: 'intro-letter-in' });
      inner.style.setProperty('--d', `${1500 + k * 150}ms`);
      inner.append(glyph(c.ch));
      outer.append(inner);
      return { outer, k, from: null };
    });
    isvg.append(trio, ...letters.map((l) => l.outer));
    fitLetters();

    let leaving = false;
    let trioAt = null; // 천·지·인 자리 (날아갈 때 출발점)
    function introLayout() {
      if (leaving) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      isvg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const L1 = Math.min(H * 0.065, W * 0.1); // 천·지·인 크기
      const ty = H * 0.17;
      const sw = L1 * 0.16;
      const xs = [-1, 0, 1].map((i) => W / 2 + i * L1 * 1.9);
      trioAt = { xs, ty, sw, L1 };
      Object.entries({ cx: xs[0], cy: ty, r: sw * 0.95 }).forEach(([k, v]) => dot.setAttribute(k, v));
      Object.entries({ x1: xs[1] - L1 / 2, y1: ty, x2: xs[1] + L1 / 2, y2: ty, 'stroke-width': sw }).forEach(([k, v]) => earth.setAttribute(k, v));
      Object.entries({ x1: xs[2], y1: ty - L1 / 2, x2: xs[2], y2: ty + L1 / 2, 'stroke-width': sw }).forEach(([k, v]) => man.setAttribute(k, v));
      caps.forEach((t, i) => {
        t.setAttribute('x', xs[i]);
        t.setAttribute('y', ty + L1 / 2 + Math.max(14, H * 0.022));
        t.setAttribute('font-size', Math.max(13, H * 0.0139));
      });

      const L = Math.min(H * 0.1, (W - 32) / 7.6); // 자음 크기
      const cy = H * 0.37;
      letters.forEach((l) => {
        l.from = { x: W / 2 + (l.k - 2) * 1.6 * L, y: cy, s: L };
        l.outer.setAttribute('transform', `translate(${l.from.x} ${l.from.y}) scale(${L})`);
      });
      text.style.setProperty('--intro-text-top', `${cy + L * 0.5 + Math.max(28, H * 0.045)}px`);
    }
    introLayout();
    window.addEventListener('resize', introLayout);

    function leave() {
      if (leaving) return;
      leaving = true;
      window.removeEventListener('keydown', onKey, true);
      intro.classList.add('is-leaving');
      penta.classList.remove('is-intro-frame'); // 원 테두리가 나타나기 시작

      // 원판 위 각 글자의 화면 자리·기울기·크기 (화면 밖 칸은 화면 밖으로 날아감)
      const targets = letters.map((l) => {
        const m = marks[l.k].getScreenCTM();
        return {
          x: m.e, y: m.f, s: Math.hypot(m.a, m.b),
          r: (Math.atan2(m.b, m.a) * 180) / Math.PI,
          o: CELLS[l.k].open ? 1 : 0.25, // 아직 비어 있는 칸은 옅게
        };
      });
      // 하늘(·)과 사람(ㅣ)이 음양 버튼 자리로: ㅣ 는 기둥, · 는 그 옆 짧은 획이 됨.
      // 둥근 끝 선 하나로 그려서, 길이 0 이면 점 · 길이가 생기면 획 (버튼 글자와 같은 모양)
      const yy = document.querySelector('.yy-glyph svg');
      const yr = yy.getBoundingClientRect();
      const u = yr.width / 24; // 버튼 글자 viewBox(24) 한 칸
      const bx = yr.left + yr.width / 2;
      const by = yr.top + yr.height / 2;
      const side = document.documentElement.dataset.theme === 'dark' ? -1 : 1; // ㅏ 면 오른쪽, ㅓ 면 왼쪽
      const { xs, ty, sw, L1 } = trioAt;
      const flyers = [
        { // 사람 ㅣ → 기둥 (버튼 글자: (0,-8.5)~(0,8.5), 굵기 2.6)
          a: [xs[2], ty - L1 / 2, xs[2], ty + L1 / 2, sw],
          b: [bx, by - 8.5 * u, bx, by + 8.5 * u, 2.6 * u],
        },
        { // 하늘 · → 켜진 점의 획 (버튼 글자: (2,0)~(7,0))
          a: [xs[0], ty, xs[0], ty, sw * 1.9],
          b: [bx + 2 * u * side, by, bx + 7 * u * side, by, 2.6 * u],
        },
      ].map((f) => {
        f.node = el('line', { class: 'intro-vowel', 'stroke-linecap': 'round' });
        isvg.append(f.node);
        return f;
      });
      dot.style.visibility = 'hidden';
      man.style.visibility = 'hidden';
      const drawFlyers = (q) => flyers.forEach(({ a, b, node }) => {
        const v = a.map((s, i) => lerp(s, b[i], q));
        ['x1', 'y1', 'x2', 'y2', 'stroke-width'].forEach((k, i) => node.setAttribute(k, v[i]));
        node.style.opacity = lerp(1, 0.8, q); // 버튼은 평소 .8 진하기
      });
      drawFlyers(0);

      const DUR = reduce ? 1 : 1100;
      const t0 = performance.now();
      const step = (now) => {
        const q = easeInOut(Math.min(1, (now - t0) / DUR));
        drawFlyers(q);
        letters.forEach((l, i) => {
          const a = l.from;
          const b = targets[i];
          l.outer.setAttribute('transform',
            `translate(${lerp(a.x, b.x, q)} ${lerp(a.y, b.y, q)}) rotate(${lerp(0, b.r, q)}) scale(${lerp(a.s, b.s, q)})`);
          l.outer.style.opacity = lerp(1, b.o, q);
        });
        if (q < 1) { requestAnimationFrame(step); return; }
        // 내려앉음: 원판 글자·음양 버튼으로 바꿔치기 (소개가 없어지면 음양 버튼이 보임, css)
        penta.classList.remove('is-intro');
        window.removeEventListener('resize', introLayout);
        intro.remove();
        busy = false;
        svg.focus({ preventScroll: true });
      };
      requestAnimationFrame(step);
    }

    function onKey(e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      leave();
    }
    intro.addEventListener('click', leave);
    window.addEventListener('keydown', onKey, true);
  }
})();
