/* 01 자음 첫 화면 — 화면 아래로 잘린 커다란 오각형 원판. 다섯 칸에 ㄱ ㄴ ㅁ ㅅ ㅇ.
   시계 방향으로 ㄱ(木) ㄴ(火) ㅁ(土) ㅅ(金) ㅇ(水) — 상생 순서.
   원판을 돌려 맨 위로 온 칸이 고른 칸: 끌어서 돌리기, 마우스 휠, 좌우 방향키, 옆 칸을 누르면 그 칸이 위로.
   ㄱ 이 맨 위에 있을 때 누르면(또는 Enter) 그 ㄱ 이 화면 아래로 날아가 나무의 뿌리가 되고 ㄱ 나무가 시작된다.
   나머지 칸은 아직 비워 둠(글자만 옅게). 왼쪽 위 오각형 버튼이나 Esc 로 돌아온다. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tree = window.hangulTree;

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
    { ch: 'ㄱ', open: true },
    { ch: 'ㄴ' },
    { ch: 'ㅁ' },
    { ch: 'ㅅ' },
    { ch: 'ㅇ' },
  ];

  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const at = (deg, r) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  const border = (k) => at(-90 + k * STEP + STEP / 2, R); // 칸 k 와 k+1 사이 경계가 원과 만나는 점
  // 칸 k 의 부채꼴 (원 중심에서 72°)
  const wedge = (k) => {
    const [x0, y0] = border(k - 1);
    const [x1, y1] = border(k);
    return `M0 0 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`;
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
  const wheel = el('g', { class: 'wheel' });     // 도는 층
  const cells = [];
  const marks = []; // 칸마다 글자 + 글자 뒤 바탕

  // 테두리 원을 먼저 그려서, 선 위에 얹힌 글자가 선을 가리게 함
  wheel.append(el('circle', { class: 'edge', cx: 0, cy: 0, r: R }));

  CELLS.forEach((c, k) => {
    const cell = el('g', {
      class: `cell ${c.open ? 'is-open' : 'is-locked'}`,
      'data-k': k,
      'aria-hidden': 'true',
    });
    cell.append(el('path', { class: 'cell-bg', d: wedge(k) }));

    // 글자는 원 둘레 선 위에, 바깥을 향해 세움 → 맨 위로 왔을 때 똑바로 섬
    const mark = el('g', { class: 'mark' }); // 자리·크기는 layout() 이 화면에 맞춰 정함
    marks.push(mark);
    mark.append(el('circle', { class: 'cell-dot', cx: 0, cy: 0, r: 0.75 })); // 글자 뒤 바탕: 선을 끊고 누르는 자리
    mark.append(letter(c.ch));
    cell.append(mark);
    cells.push(cell);
    wheel.append(cell);
  });
  art.append(wheel);
  svg.append(art);

  svg.setAttribute('tabindex', '0');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-roledescription', '원판');
  svg.setAttribute('aria-label', '자음 원판. 좌우 방향키로 돌리고, ㄱ 이 맨 위에 오면 Enter 로 ㄱ 나무를 엽니다.');

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
    const letterUnits = (letterPx * R) / rPx; // px → viewBox 단위
    marks.forEach((m, k) => {
      const [x, y] = at(-90 + k * STEP, R);
      m.setAttribute('transform', `translate(${x} ${y}) rotate(${k * STEP}) scale(${letterUnits})`);
    });

    // 오행 설명은 맨 위 글자(뒤 바탕 원 포함) 바로 아래에서 시작
    penta.style.setProperty('--info-top', `${H * 0.4 + letterPx * 0.75 + Math.max(12, H * 0.02)}px`);

    // 원 선 두께도 화면이 클수록 굵게 (1.5px ~ 4px)
    svg.style.setProperty('--edge-w', `${Math.min(4, Math.max(1.5, H / 600))}px`);
  }
  layout();
  window.addEventListener('resize', layout);

  /* ---------- 돌리기 ---------- */
  let rot = 0; // 원판 각도(연속값). 칸 k 가 맨 위 ⇔ rot ≡ -72k
  let shownTop = 0;
  let told = false;
  const norm = (a) => ((a % 360) + 360) % 360;
  const shortest = (d) => { d = norm(d); return d > 180 ? d - 360 : d; };
  const topIndex = () => norm(Math.round(-rot / STEP) * STEP) / STEP;

  // 맨 위 칸 글자의 오행 설명 (index.html 의 .element)
  const elementEls = [...document.querySelectorAll('.element')];

  function render() {
    wheel.style.setProperty('--rot', `${rot}deg`);
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
      live.textContent = c.open ? `${c.ch}, ${name}. Enter 로 열기` : `${c.ch}, ${name} (비어 있음)`;
      told = true;
    }
  }
  const settle = () => { rot = Math.round(rot / STEP) * STEP; render(); };
  const turnTo = (k) => { rot += shortest(-k * STEP - rot); render(); };
  const stepBy = (dir) => { rot = Math.round(rot / STEP) * STEP - dir * STEP; render(); }; // +1: 오른쪽 칸이 위로
  render();

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
    render();
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, target } = drag;
    drag = null;
    penta.classList.remove('is-dragging');
    if (moved || cancelled) { settle(); return; }
    // 누름: 맨 위 칸이면 열고, 옆 칸이면 그 칸을 위로 돌려 옴
    const cell = target.closest && target.closest('.cell');
    if (!cell) return;
    const k = Number(cell.dataset.k);
    if (k === topIndex()) { if (CELLS[k].open) enterTree(true); }
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
      if (CELLS[topIndex()].open) enterTree(true);
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

  // toTree: 칸 → 나무면 글꼴 ㄱ 이 나무 ㄱ 으로, 나무 → 칸이면 그 반대로 바뀌며 남
  function fly(from, to, done, toTree) {
    const DUR = reduce ? 1 : 850;
    const t0 = performance.now();
    flight.style.display = '';
    const frame = (now) => {
      const k = easeInOut(Math.min(1, (now - t0) / DUR));
      flyer.setAttribute('transform',
        `translate(${lerp(from.x, to.x, k)} ${lerp(from.y, to.y, k)}) scale(${lerp(from.s, to.s, k)})`);
      const c = tree.color(lerp(from.shade, to.shade, k)); // 옅어진 뿌리 ㄱ 도 자연스럽게
      flyerPath.style.fill = c;
      flyerText.style.fill = c;
      const shape = toTree ? k : 1 - k; // 나무 ㄱ 이 보이는 정도
      flyerPath.style.opacity = shape;
      flyerText.style.opacity = 1 - shape;
      if (k < 1) requestAnimationFrame(frame);
      else { flight.style.display = 'none'; done(); }
    };
    frame(t0);
    requestAnimationFrame(frame);
  }

  /* ---------- 화면 바꾸기 ---------- */
  let view = body.dataset.view === 'tree' ? 'tree' : 'penta';
  let busy = false;
  let pushed = false;

  function enterTree(push) {
    if (busy || view === 'tree') return;
    busy = true;
    if (push) { history.pushState({ view: 'tree' }, '', '#tree'); pushed = true; }
    turnTo(0); // 뒤로 가기로 다시 들어올 때도 ㄱ 이 위에 있게
    tree.reset();
    const from = cellGlyph();
    const to = tree.rootGlyph();
    openCell.classList.add('is-flying');
    penta.classList.add('is-dim'); // 원판은 사라지고, 흰 바탕만 남은 채 ㄱ 이 날아감
    fly(from, to, () => {
      view = 'tree';
      body.dataset.view = 'tree';
      openCell.classList.remove('is-flying');
      busy = false;
    }, true);
  }

  function leaveTree() {
    if (busy || view === 'penta') return;
    busy = true;
    const from = tree.rootGlyph(); // 지금 그려진 뿌리 ㄱ 에서 출발
    view = 'penta';
    body.dataset.view = 'penta';
    tree.reset();
    openCell.classList.add('is-flying');
    penta.classList.remove('is-dim'); // 원판이 다시 나타남
    fly(from, cellGlyph(), () => {
      openCell.classList.remove('is-flying');
      busy = false;
      svg.focus({ preventScroll: true });
    }, false);
  }

  function goBack() {
    if (pushed && history.state && history.state.view === 'tree') {
      history.back(); // popstate 에서 돌아감
    } else {
      history.replaceState(null, '', location.pathname + location.search);
      leaveTree();
    }
  }

  back.addEventListener('click', (e) => {
    e.stopPropagation(); // 나무가 이 클릭으로 자라지 않게
    goBack();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view === 'tree') goBack();
  });
  window.addEventListener('popstate', () => {
    if (location.hash === '#tree') enterTree(false);
    else leaveTree();
  });

  // 주소가 #tree 로 열리면 바로 나무 화면
  if (location.hash === '#tree') {
    view = 'tree';
    body.dataset.view = 'tree';
    penta.classList.add('is-dim');
  }
  if (!told) live.textContent = '';
})();
