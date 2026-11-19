/* 01 자음 — ㄱ 나무. 화면 아래 가운데의 ㄱ 에서 글자만으로 된 나무가 자란다.
   가지 끝에는 늘 기본자 ㄱ 이 돋고, 사람이 손으로 바꿔 줘야 나무가 자란다.
   · 가획: 가로로 한 획 그으면 그 획이 붙어 ㅋ → 그은 쪽으로 새 ㄱ 하나가 돋음 (한 갈래)
   · 병서: ㄱ 을 하나 더 쓰면(가로로 가다 꺾어 아래로) 같은 ㄱ 이 나란히 붙어 ㄲ → 새 ㄱ 둘이 돋음 (두 갈래)
   조작은 획 긋기 둘뿐이고, 글자를 맞힐 필요 없이 빈 곳 어디서 해도 됨: 지금 바꿀 층에서 그은 자리에 가장 가까운 ㄱ 이 바뀜.
   새 ㄱ 은 앞 글자의 70% 크기. 맨 끝 세대는 획 긋기(ㅋ)만 되고, 자리가 없으면 그 가지는 멈춘다.
   세대 물결: ㄱ 하나를 손으로 바꾸면, 같은 높이(세대)의 다른 ㄱ 들도 그 자리에서부터 옆으로 번지며 저절로 바뀐다.
   손으로 고른 글자를 70% 정도 따르고 30% 는 다른 글자가 된다(ㄲ 자리가 없으면 ㅋ). 그래서 한 층에 한 번씩,
   맨 아래부터 꼭대기까지 일곱 번이면 나무가 다 찬다. 위층에 새로 돋은 ㄱ 은 다시 손으로 바꿔 줘야 한다.
   더 바꿀 ㄱ 이 없으면 빈 곳을 눌러 끝의 ㅋ 들을 낙엽처럼 떨어뜨리고 다시 ㄱ 으로 돌아간다.
   키보드: 다 자란 뒤 Space/Enter 는 낙엽. */
(() => {
  const canvas = document.getElementById('tree');
  const ctx = canvas.getContext('2d');
  const live = document.getElementById('live');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAX_GEN = 6;
  const ROOT = 220;                    // 맨 아래 ㄱ 크기 (설계 단위, 화면 높이 960 기준)
  const RATIO = 0.7;                   // 새 글자는 앞 글자의 70%
  const GROW = reduce ? 300 : 1100;    // 새 ㄱ 이 다 자라기까지(ms)
  const SHRINK = reduce ? 300 : 600;   // 시들어 들어가는 시간(ms)
  const CONV = reduce ? 200 : 520;     // ㄱ 이 ㅋ·ㄲ 으로 바뀌는 시간(ms)

  // 글자 모양 — 글자 크기 = 1, 원점 = 세로획 아래 가운데, 위쪽이 -y, +u 가 가로획이 뻗는 쪽
  // T·TH·ARM 은 measureShape() 가 페이지 글꼴(Pretendard SemiBold)의 ㄱ 을 재서 맞춤 → 원판의 ㄱ 과 같은 모양
  let T = 0.17;          // 세로획 굵기
  let TH = 0.17;         // 가로획 굵기
  let ARM = 0.86;        // ㄱ·ㅋ 가로획 끝
  const MID = -0.47;     // ㅋ 가운데 획 높이
  const MID_END = 0.96;  // ㅋ 가운데 획 끝 (위 가로획 끝 ARM 에 대한 비율 — 거의 같은 길이로)
  const KK_ARM1 = 0.62;  // ㄲ 이 된 본래 ㄱ 의 가로획 끝
  const KK_LEN2 = 0.62;  // 떨어져 나온 ㄱ 의 가로획 길이
  const KK_GAP = 0.075;  // 나란히 선 두 ㄱ 사이 틈
  // 떨어져 나온 ㄱ 의 세로획 자리: 본래 ㄱ 가로획 끝(+쪽) 또는 세로획(-쪽)에서 틈만큼 띄움
  const kkCopyAt = (side) => (side > 0 ? KK_ARM1 + KK_GAP + T / 2 : -T / 2 - KK_GAP - KK_LEN2);

  // 세대 물결
  const FOLLOW = 0.7;                    // 물결로 바뀌는 ㄱ 이 손으로 고른 글자를 따를 확률
  const WAVE_MS = reduce ? 0.3 : 1.3;    // 물결이 옆으로 번지는 빠르기 (설계 단위 1 만큼에 ms)
  const AUTO_WAIT = reduce ? 60 : 160;   // 물결이 닿은 ㄱ 이 바뀌기 시작하기까지 최소(ms), 여기에 조금씩 흩어짐

  // 글꼴 ㄱ 을 캔버스에 크게 써서 픽셀로 잼: 잉크 높이를 1 로 두고 세로획·가로획 굵기와 전체 폭
  function measureShape() {
    const px = 240, pad = 40;
    const cv = document.createElement('canvas');
    cv.width = cv.height = px + pad * 2;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.font = `600 ${px}px ${getComputedStyle(document.body).fontFamily}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('ㄱ', cv.width / 2, cv.height / 2);
    const N = cv.width;
    const data = c.getImageData(0, 0, N, N).data;
    const ink = (x, y) => data[(y * N + x) * 4 + 3] > 127;
    let x0 = N, x1 = -1, y0 = N, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!ink(x, y)) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return;
    const h = y1 - y0 + 1, w = x1 - x0 + 1;
    let th = 0, tv = 0;
    const cx = Math.round(x0 + w * 0.3); // 가로획만 지나는 세로줄
    for (let y = y0; y <= y1; y++) if (ink(cx, y)) th++;
    const cy = Math.round(y0 + h * 0.6); // 세로획만 지나는 가로줄
    for (let x = x0; x <= x1; x++) if (ink(x, cy)) tv++;
    const t = tv / h, tH = th / h, arm = w / h - t / 2;
    if (t < 0.05 || t > 0.35 || tH < 0.05 || tH > 0.35 || arm < 0.4 || arm > 1.4) return; // 이상하게 재졌으면 그대로
    T = t; TH = tH; ARM = arm;
  }
  measureShape();
  if (document.fonts) {
    document.fonts.load('600 100px Pretendard', 'ㄱ').then(measureShape, () => {});
    document.fonts.ready.then(measureShape);
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); // 살짝 튕기며 붙음
  const rand = Math.random;

  // 글자가 차지하는 가로 범위 [u0, u1]
  function extent(type, side) {
    if (type !== 'ㄲ') return [-T / 2, ARM];
    return side > 0 ? [-T / 2, kkCopyAt(1) + KK_LEN2] : [kkCopyAt(-1) - T / 2, KK_ARM1];
  }

  /* ---------- 캔버스 ---------- */
  let W = 0, H = 0, dpr = 1, base = 1;
  let ink = [14, 14, 14], paper = [255, 255, 255];
  const rgb = (str) => (str.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    base = Math.min(W / 600, H / 960);
    readColors();
  }
  // 글자색·바탕색: 음양 버튼으로 화면이 바뀌는 동안에도 따라가도록 매 프레임 읽음
  function readColors() {
    const cs = getComputedStyle(document.body);
    ink = rgb(cs.color);
    paper = rgb(cs.backgroundColor);
  }
  resize();
  window.addEventListener('resize', resize);

  // 새로 돋은 글자일수록 진하고, 오래된 글자는 조금씩 옅어짐
  const color = (k) => `rgb(${ink.map((c, i) => Math.round(lerp(c, paper[i], k))).join(',')})`;

  /* ---------- 나무 ---------- */
  // x, y: 세로획 아래 가운데 (맨 아래 ㄱ 기준 설계 단위), d: 가로획이 뻗는 쪽 (-1 왼쪽 = 보통 ㄱ, +1 오른쪽)
  // conv: ㄱ 이 바뀐 기록 { at: 시작 시각, side: ㄲ 의 떨어져 나온 쪽, from: 놓은 자리, until: 되돌리기 시작 }
  // auto: 0 이면 손으로 바꿀 ㄱ, 1 이면 물결이 닿아 곧 저절로 바뀔 ㄱ (autoAt: 바뀌는 시각)
  function makeNode(parent, d, x, y, s, start) {
    return {
      parent, gen: parent ? parent.gen + 1 : 0, type: 'ㄱ', d, x, y, s,
      start, end: Infinity, children: [], shade: 0, dropped: false, conv: null, shake: -Infinity,
      auto: 0, autoAt: Infinity,
    };
  }

  const root = makeNode(null, -1, 0, 0, ROOT, performance.now() + 250);
  let gen = 0;            // 지금 가장 높은 세대
  let stage = 'grow';     // 'grow' | 'falling'
  let growEnd = 0;        // 자라거나 바뀌는 중인 것이 끝나는 시각
  let touched = false;
  let breathFrom = 0;     // 이 시각부터 맨 아래 ㄱ 이 서서히 숨 쉬기 시작
  let fallTimer = 0;
  let wasDone = false;

  // 오각형 첫 화면이 떠 있는 동안에는 나무가 반응하지 않음
  const treeOn = () => document.body.dataset.view !== 'penta';

  const each = (n, fn) => { fn(n); n.children.forEach((c) => each(c, fn)); };

  function life(n, now) {
    const g = clamp01((now - n.start) / GROW);
    return n.end === Infinity ? g : Math.min(g, 1 - clamp01((now - n.end) / SHRINK));
  }

  // 0 → 1: 더한 획이 붙는 정도 / 떨어져 나온 ㄱ 이 자리 잡는 정도
  function convK(n, now) {
    if (!n.conv) return 0;
    const t = clamp01((now - n.conv.at) / CONV);
    const k = n.type === 'ㄲ' ? easeOutBack(t) : easeOut(t);
    return n.conv.until === Infinity ? k : Math.min(k, 1 - clamp01((now - n.conv.until) / CONV));
  }

  // 손으로 바꿀 수 있는 가지 끝 ㄱ (저절로 바뀔 ㄱ 은 빼고)
  const pending = (n, now) => n.type === 'ㄱ' && n.auto === 0 && !n.dropped && n.end === Infinity && life(n, now) >= 0.7;

  function boxOf(type, d, x, y, s, side = 1) {
    const [u0, u1] = extent(type, side);
    return d > 0
      ? { x0: x + u0 * s, x1: x + u1 * s, y0: y - s, y1: y }
      : { x0: x - u1 * s, x1: x - u0 * s, y0: y - s, y1: y };
  }
  const box = (n) => boxOf(n.type, n.d, n.x, n.y, n.s, n.conv ? n.conv.side : 1);

  // 다른 글자와 겹치지 않는 자리인지 (skip 에 든 글자는 빼고)
  function free(b, skip, margin) {
    let ok = true;
    each(root, (n) => {
      if (!ok || n.dropped || skip.includes(n)) return;
      const o = box(n);
      if (b.x0 - margin < o.x1 && b.x1 + margin > o.x0 && b.y0 - margin < o.y1 && b.y1 + margin > o.y0) ok = false;
    });
    return ok;
  }

  /* ---------- 바뀐 글자 위에 새 ㄱ 돋우기 (ㅋ 한 갈래, ㄲ 두 갈래) ---------- */
  function sprout(p, at, prefer) {
    if (p.gen >= MAX_GEN) return 0;
    const s = p.s * RATIO;
    const half = (T * RATIO) / 2; // 새 글자 세로획의 반 굵기 (부모 글자 단위)
    // 새 ㄱ 하나마다 [가로획 위 자리 u, 향하는 쪽 f] 후보를 순서대로 시도
    let slots;
    if (p.type === 'ㄲ') {
      const outerEnd = extent('ㄲ', p.conv.side)[1];
      const innerMid = p.conv.side > 0 ? KK_ARM1 / 2 : kkCopyAt(-1) + KK_LEN2 / 2;
      slots = [
        [{ u: outerEnd - half, f: p.d }, { u: outerEnd - half, f: -p.d }], // 바깥 가로획 끝: 바깥쪽으로
        [{ u: innerMid, f: -p.d }, { u: innerMid, f: p.d }],               // 안쪽 가로획: 반대쪽으로
      ];
    } else {
      const f = prefer || (rand() < 0.5 ? 1 : -1);
      slots = [[
        { u: ARM - half, f }, { u: ARM - half, f: -f },
        { u: ARM / 2, f }, { u: ARM / 2, f: -f },
      ]];
    }
    let made = 0;
    for (const options of slots) {
      for (const o of options) {
        const x = p.x + p.d * o.u * p.s;
        const y = p.y - p.s;
        if (!free(boxOf('ㄱ', o.f, x, y, s), [p], s * 0.1)) continue;
        const start = at + CONV * 0.8 + made * 120;
        p.children.push(makeNode(p, o.f, x, y, s, start));
        growEnd = Math.max(growEnd, start + GROW);
        made++;
        break;
      }
    }
    if (made) gen = Math.max(gen, p.gen + 1);
    return made;
  }

  /* ---------- 세대 물결: 손으로 바꾼 ㄱ 과 같은 높이의 ㄱ 들이 그 자리에서부터 옆으로 번지며 바뀜 ---------- */
  const waves = new Map(); // 세대 → { kind: 손으로 고른 글자, x: 시작한 자리, at: 시작한 때 }

  function startWave(n, kind, at) {
    if (waves.has(n.gen)) return; // 이미 번지고 있는 층
    waves.set(n.gen, { kind, x: n.x, at });
    live.textContent += ' 같은 높이의 ㄱ 들도 물결처럼 바뀝니다.';
  }

  // 가획: ㄱ → ㅋ (auto: 물결로 저절로 바뀌는 것)
  function makeK(n, at, dir, auto = false) {
    n.type = 'ㅋ';
    n.conv = { at, side: 1, from: 0, until: Infinity };
    growEnd = Math.max(growEnd, at + CONV);
    sprout(n, at, dir);
    if (!auto) {
      touched = true;
      ruleHold = { name: '가획', until: at + 2500 }; // 왼쪽 설명의 가획이 잠깐 진해짐
      live.textContent = 'ㄱ 에 획을 더해 ㅋ 이 되었습니다.';
      startWave(n, 'ㅋ', at);
    }
  }

  // 병서: ㄱ → ㄲ (side: 떨어져 나온 ㄱ 이 놓이는 쪽, from: 손을 놓은 자리)
  function makeKK(n, side, from, now, auto = false) {
    if (n.gen >= MAX_GEN) return false;
    const s = n.s;
    if (!free(boxOf('ㄲ', n.d, n.x, n.y, s, side), [n, n.parent].filter(Boolean), s * 0.06)) {
      if (!auto) n.shake = now; // 옆에 자리가 없음
      return false;
    }
    n.type = 'ㄲ';
    n.conv = { at: now, side, from, until: Infinity };
    growEnd = Math.max(growEnd, now + CONV);
    sprout(n, now);
    if (!auto) {
      touched = true;
      ruleHold = { name: '병서', until: now + 2500 };
      live.textContent = 'ㄱ 을 나란히 써서 ㄲ 이 되었습니다.';
      startWave(n, 'ㄲ', now);
    }
    return true;
  }

  // 물결이 지나는 층의 ㄱ: 다 자라면 시작한 자리에서 먼 것일수록 늦게 차례가 오고, 차례가 되면 바뀜.
  // 손으로 고른 글자를 FOLLOW 만큼 따르고 나머지는 다른 글자 (맨 끝 세대·자리 없음은 ㅋ)
  function autoStep(now) {
    if (stage !== 'grow' || !waves.size) return;
    const due = [];
    each(root, (n) => {
      if (n.type !== 'ㄱ' || n.dropped || n.end !== Infinity) return;
      const w = waves.get(n.gen);
      if (!w) return;
      if (n.auto === 0) {
        if (life(n, now) < 0.7) return; // 아직 자라는 중 — 다 자라면 물결을 받음
        n.auto = 1;
        n.autoAt = Math.max(now + AUTO_WAIT, w.at + Math.abs(n.x - w.x) * WAVE_MS) + rand() * 90;
      }
      if (now >= n.autoAt) due.push(n);
    });
    for (const n of due) {
      const w = waves.get(n.gen);
      const kind = rand() < FOLLOW ? w.kind : w.kind === 'ㅋ' ? 'ㄲ' : 'ㅋ';
      if (kind === 'ㄲ' && n.gen < MAX_GEN) {
        const side = rand() < 0.5 ? 1 : -1;
        if (makeKK(n, side, 0, now, true) || makeKK(n, -side, 0, now, true)) continue;
      }
      makeK(n, now, rand() < 0.5 ? 1 : -1, true);
    }
  }

  function isComplete(now) {
    if (stage !== 'grow' || now < growEnd) return false;
    let left = false;
    each(root, (n) => { if (n.type === 'ㄱ' && !n.dropped) left = true; });
    return !left;
  }

  /* ---------- 다 자란 뒤: 끝의 ㅋ 은 낙엽처럼 떨어지고, 나머지는 끝에서부터 시들어 ㄱ 으로 ---------- */
  const leaves = [];

  function fall(now) {
    stage = 'falling';
    // 낙엽은 ㅋ 만. 중간에 멈춘 ㄲ 끝가지는 떨어지지 않고 나머지와 함께 시들어 들어감
    each(root, (n) => {
      if (!n.parent || n.children.length || n.type !== 'ㅋ') return;
      const size = n.s * V.U;
      const [u0, u1] = extent('ㅋ');
      const cu = (u0 + u1) / 2; // 글자 가운데 (회전 축)
      const ax = V.ox + n.x * V.U;
      const ay = V.oy + n.y * V.U;
      leaves.push({
        type: 'ㅋ', d: n.d, size, cu, color: color(n.shade),
        x: ax + n.d * cu * size,
        y: ay - 0.5 * size,
        vx: (rand() - 0.5) * 0.03 * base,
        vt: (0.08 + rand() * 0.07) * base,
        amp: (0.03 + rand() * 0.05) * base,
        fq: 0.0012 + rand() * 0.0014,
        ph: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.0012,
        born: now + rand() * 400,
      });
      n.dropped = true;
    });

    const DELAY = 500;
    each(root, (n) => {
      if (!n.parent || n.dropped) return;
      n.end = now + DELAY + (gen - n.gen) * 110 + rand() * 80;
      if (n.conv) n.conv.from = 0; // 떨어져 나왔던 ㄱ 은 다시 겹쳐 들어감
    });
    // 맨 아래 글자도 마지막에 ㄱ 으로 되돌아감
    const rootBack = now + DELAY + gen * 110 + 80 + SHRINK * 0.6;
    if (root.conv) { root.conv.from = 0; root.conv.until = rootBack; }
    fallTimer = setTimeout(() => {
      waves.clear();
      root.children = [];
      root.type = 'ㄱ';
      root.conv = null;
      gen = 0;
      stage = 'grow';
      growEnd = 0;
      wasDone = false;
    }, rootBack - now + CONV + 60);
    live.textContent = '끝의 ㅋ 들이 낙엽처럼 떨어지고 다시 ㄱ 으로 돌아갑니다.';
  }

  /* ---------- 손동작 ---------- */
  // 화면 좌표 → 그 글자의 좌표 (u: 가로획 쪽이 +, y: 위가 -)
  function toLocal(n, x, y) {
    const sPx = n.s * V.U;
    const bx = V.ox + n.x * V.U;
    const by = V.oy + n.y * V.U;
    return { u: ((x - bx) / sPx) * n.d, y: (y - by) / sPx, sPx };
  }

  // 그은 선이 어느 가지 끝 ㄱ 의 가운데를 가로질렀는지 (한 번에 여러 개도 됨)
  function strokeHits(pts, now) {
    const dense = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
      for (let j = 1; j <= steps; j++) dense.push({ x: lerp(a.x, b.x, j / steps), y: lerp(a.y, b.y, j / steps) });
    }
    const hits = [];
    each(root, (n) => {
      if (!pending(n, now)) return;
      let uMin = Infinity, uMax = -Infinity, count = 0;
      for (const q of dense) {
        const l = toLocal(n, q.x, q.y);
        if (l.y >= -0.68 && l.y <= -0.2 && l.u >= -0.25 && l.u <= ARM + 0.05) {
          count++;
          uMin = Math.min(uMin, l.u);
          uMax = Math.max(uMax, l.u);
        }
      }
      if (count >= 2 && uMax - uMin >= 0.35 && uMin <= 0.4) hits.push(n);
    });
    return hits;
  }

  // 빈 곳에서 한 손짓이 바꿀 ㄱ: 지금 손으로 바꿀 층(가장 낮은 세대) 가운데 손짓 자리에서 가장 가까운 것.
  // 글자가 작아져도 맞힐 필요 없이, 그 층 어디서든 시작하면 물결이 거기서부터 번짐
  function nearestPending(x, y, now) {
    let best = null, bestGen = Infinity, bestD = Infinity;
    each(root, (n) => {
      if (!pending(n, now)) return;
      const sPx = n.s * V.U;
      const cx = V.ox + n.x * V.U + n.d * (ARM / 2) * sPx; // 글자 가운데
      const cy = V.oy + n.y * V.U - 0.5 * sPx;
      const d = Math.hypot(cx - x, cy - y);
      if (n.gen < bestGen || (n.gen === bestGen && d < bestD)) {
        best = n;
        bestGen = n.gen;
        bestD = d;
      }
    });
    return best;
  }

  // 그은 선이 ㄱ 모양인지: 가로로 가다가 꺾여 아래로 (왼쪽·오른쪽 어느 쪽으로 가로획을 그어도 됨).
  // 처음과 끝을 잇는 선에서 가장 멀리 떨어진 점을 꺾인 곳으로 보고, 앞은 가로로·뒤는 아래로 곧은지 봄
  function cornerOf(pts) {
    if (pts.length < 4) return null;
    const a = pts[0];
    const b = pts[pts.length - 1];
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    let ci = -1, far = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const dist = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L;
      if (dist > far) { far = dist; ci = i; }
    }
    if (ci < 0) return null;
    const c = pts[ci];
    const ax = c.x - a.x, ay = c.y - a.y; // 가로획
    const bx = b.x - c.x, by = b.y - c.y; // 세로획 (아래로)
    const MIN = 26;
    const arm = Math.abs(ax) >= MIN && Math.abs(ax) >= 1.6 * Math.abs(ay);
    const leg = by >= MIN && by >= 1.6 * Math.abs(bx);
    return arm && leg ? { x: c.x, y: c.y } : null;
  }

  let gesture = null;     // 긋고 있는 선 { id, pts, dist }
  const trails = [];      // 그은 선 (잠깐 남았다 사라짐)

  // 다 자랐으면 누를 수 있다는 표시, 아니면 긋는 곳
  function setCursor(now) {
    if (gesture) return;
    canvas.style.cursor = isComplete(now) ? 'pointer' : 'crosshair';
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!treeOn()) return;
    lastInput = performance.now(); // 안내는 바로 사라짐
    if (stage === 'falling' || gesture) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 포인터가 이미 사라진 경우 */ }
    gesture = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY }], dist: 0 };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!gesture) { setCursor(performance.now()); return; }
    if (e.pointerId !== gesture.id) return;
    const last = gesture.pts[gesture.pts.length - 1];
    const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    if (d >= 2) {
      gesture.pts.push({ x: e.clientX, y: e.clientY });
      gesture.dist += d;
    }
  });

  function finish(e, cancelled) {
    if (!gesture || e.pointerId !== gesture.id) return;
    const g = gesture;
    gesture = null;
    const now = performance.now();

    if (g.dist < 6) {
      // 그냥 누름: 다 자랐으면 낙엽
      if (!cancelled && isComplete(now)) fall(now);
    } else {
      const first = g.pts[0];
      const last = g.pts[g.pts.length - 1];
      let ok = false;
      const corner = cancelled ? null : cornerOf(g.pts);
      if (corner) {
        // ㄱ 을 하나 더 씀 → 병서 ㄲ. 그린 쪽에 떨어져 나온 ㄱ 이 놓임 (자리가 없으면 반대쪽)
        const n = nearestPending(corner.x, corner.y, now);
        if (n && n.gen >= MAX_GEN) {
          n.shake = now; // 맨 끝 세대는 ㅋ 만 됨
        } else if (n) {
          const bx = V.ox + n.x * V.U;
          const side = (corner.x >= bx ? 1 : -1) * n.d;
          ok = makeKK(n, side, 0, now) || makeKK(n, -side, 0, now);
        }
      } else if (!cancelled && Math.abs(last.x - first.x) >= 1.4 * Math.abs(last.y - first.y)) {
        // 가로로 한 획 → 가획 ㅋ. 글자 가운데를 지나면 그 글자, 빈 곳이면 가장 가까운 ㄱ
        let hits = strokeHits(g.pts, now);
        if (!hits.length && g.dist >= 36) {
          const n = nearestPending((first.x + last.x) / 2, (first.y + last.y) / 2, now);
          if (n) hits = [n];
        }
        const dir = last.x >= first.x ? 1 : -1; // 그은 쪽으로 새 가지가 향함
        hits.forEach((n, i) => makeK(n, now + i * 60, dir));
        ok = hits.length > 0;
      }
      trails.push({ pts: g.pts, at: now, ok });
    }
    setCursor(now);
  }
  canvas.addEventListener('pointerup', (e) => finish(e, false));
  canvas.addEventListener('pointercancel', (e) => finish(e, true));

  // 키보드: 다 자란 뒤 Space/Enter 는 낙엽 (ㅋ·ㄲ 은 획을 그어서만 만듦)
  window.addEventListener('keydown', (e) => {
    if (!treeOn()) return;
    lastInput = performance.now();
    if (stage === 'falling') return;
    if (e.target.closest?.('button, a, [role="button"]')) return; // 버튼 누르기는 그대로 둠
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    const now = performance.now();
    if (isComplete(now)) fall(now);
  });

  /* ---------- 글자 그리기 (현재 좌표계: 글자 크기 1, +x 가 가로획 쪽) ---------- */
  // p: 0 → 1 자람, ov: 부모 가로획 속으로 살짝 내려 이음새가 안 보이게
  // k: ㅋ·ㄲ 으로 바뀐 정도, side·from: ㄲ 의 떨어져 나온 ㄱ 이 놓이는 쪽과 손을 놓은 자리
  function drawLetter(type, p, ov, k = 0, side = 1, from = 0) {
    const vT = easeOut(seg(p, 0, 0.42));
    if (vT <= 0) return;
    const aT = easeOut(seg(p, 0.4, 0.7));

    // 세로획: 아래에서 위로 솟음
    ctx.fillRect(-T / 2, -vT, T, vT + ov);
    // 가로획: 꺾이는 곳에서 바깥으로 뻗음 (ㄲ 이 되면 나란히 서도록 짧아짐)
    if (aT > 0) {
      const end = type === 'ㄲ' ? lerp(ARM, KK_ARM1, k) : ARM;
      ctx.fillRect(-T / 2, -1, (end + T / 2) * aT, TH);
    }
    // ㅋ: 세로획에 가운데 획이 더해짐 (가획)
    if (type === 'ㅋ' && k > 0) ctx.fillRect(0, MID - TH / 2, ARM * MID_END * k, TH);
    // ㄲ: 떨어져 나온 ㄱ 이 옆에 나란히 붙음 (병서)
    if (type === 'ㄲ' && (k > 0 || from !== 0)) {
      const vx = lerp(from, kkCopyAt(side), k);
      const len = lerp(ARM, KK_LEN2, k);
      ctx.fillRect(vx - T / 2, -1, T, 1 + ov);
      ctx.fillRect(vx - T / 2, -1, len + T / 2, TH);
    }
  }

  /* ---------- 화면 맞추기: 나무가 커지면 부드럽게 물러나고 가운데로 ---------- */
  const rootCenter = () => { const b = boxOf('ㄱ', root.d, 0, 0, ROOT); return (b.x0 + b.x1) / 2; };
  const groundY = () => H - Math.max(40, H * 0.08);
  // 왼쪽(넓은 화면) 또는 위쪽(좁은 화면) 설명 칸을 피한 빈 자리
  const rulesEl = document.getElementById('rules');
  function room() {
    const r = rulesEl.getBoundingClientRect();
    if (!r.width) return { left: 0, top: 32 };
    return W > 700 ? { left: r.right + 24, top: 32 } : { left: 0, top: r.bottom + 16 };
  }
  const midX = () => (room().left + W) / 2;
  let zoom = 1;
  let panX = rootCenter();
  let V = { U: base, ox: midX() - panX * base, oy: groundY() };

  function view(dt) {
    let x0 = Infinity, x1 = -Infinity, top = 0;
    each(root, (n) => {
      const b = box(n);
      if (b.x0 < x0) x0 = b.x0;
      if (b.x1 > x1) x1 = b.x1;
      if (b.y0 < top) top = b.y0;
    });
    const oy = groundY();
    const space = room();
    const target = Math.max(0.25, Math.min(1, (oy - space.top) / (-top * base), (W - space.left - 48) / ((x1 - x0) * base)));
    const k = reduce ? 1 : 1 - Math.exp(-dt / 350); // 프레임 간격이 들쭉날쭉해도 같은 빠르기로 따라감
    zoom += (target - zoom) * k;
    panX += ((x0 + x1) / 2 - panX) * k;
    const U = base * zoom;
    V = { U, ox: (space.left + W) / 2 - panX * U, oy };
  }

  // 글자 하나의 좌표계로 옮겨서 그리기
  function inLetter(n, size, fn) {
    ctx.save();
    ctx.translate(V.ox + n.x * V.U, V.oy + n.y * V.U);
    ctx.scale(n.d * size, size);
    fn();
    ctx.restore();
  }

  function drawNode(n, now) {
    if (n.dropped) return;
    const p = life(n, now);
    if (p <= 0) return;
    let size = n.s * V.U;
    if (!n.parent && !touched && !reduce) {
      size *= 1 + 0.02 * clamp01((now - breathFrom) / 1000) * Math.sin(now * 0.004); // 처음엔 숨 쉬듯
    }
    let k = convK(n, now);
    if (n.end !== Infinity) k = Math.min(k, seg(p, 0.7, 1)); // 시들 때는 더한 획부터 거둠
    ctx.save();
    const st = (now - n.shake) / 360; // 자리가 없어 ㄲ 이 안 될 때 도리질
    if (st < 1) ctx.translate(Math.sin(st * 22) * 0.05 * size * (1 - st), 0);
    // 다 자라면 바로 끝의 ㅋ 들이 이따금 살랑임 → 눌러 볼 수 있다는 표시
    if (leafCue >= 0 && n.type === 'ㅋ' && n.parent && !n.children.length) {
      const ph = ((leafCue + n.x * 3) % 2800) / 1200;
      if (ph > 0 && ph < 1) {
        // 가지에 붙은 아래쪽을 축으로 바람에 흔들리듯 기울어짐 (작은 글자도 눈에 띄게 각도로)
        const sway = Math.sin(ph * Math.PI * 4) * (1 - ph);
        const bx = V.ox + n.x * V.U, by = V.oy + n.y * V.U;
        ctx.translate(bx, by);
        ctx.rotate(sway * 0.22);
        ctx.translate(-bx, -by);
      }
    }
    ctx.fillStyle = color(n.shade);
    inLetter(n, size, () => drawLetter(n.type, p, n.parent ? 0.06 : 0, k, n.conv ? n.conv.side : 1, n.conv ? n.conv.from : 0));
    ctx.restore();
  }

  // 그은 선
  function drawTrails(now) {
    const strokeLine = (pts, alpha) => {
      if (pts.length < 2) return;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color(0);
      ctx.lineWidth = Math.max(3, 7 * base);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    };
    if (gesture) strokeLine(gesture.pts, 0.45);
    for (let i = trails.length - 1; i >= 0; i--) {
      const q = trails[i];
      const t = clamp01((now - q.at) / (q.ok ? 260 : 420));
      if (t >= 1) { trails.splice(i, 1); continue; }
      strokeLine(q.pts, 0.45 * (1 - t));
    }
    ctx.globalAlpha = 1;
  }

  // 떨어진 뒤 흐른 시간만으로 자리를 계산 (프레임이 끊겨도 같은 궤적)
  const LEAF_TAU = 500; // 이 시간쯤 지나면 거의 최고 속도
  function drawLeaves(now) {
    for (let i = leaves.length - 1; i >= 0; i--) {
      const q = leaves[i];
      const age = Math.max(0, now - q.born);
      const x = q.x + q.vx * age + (q.amp / q.fq) * (Math.cos(q.ph) - Math.cos(age * q.fq + q.ph));
      const y = q.y + q.vt * (age - LEAF_TAU * (1 - Math.exp(-age / LEAF_TAU)));
      const rot = (Math.sin(age * q.fq + q.ph) - Math.sin(q.ph)) * 0.45 + age * q.spin;
      const fade = 1 - clamp01((y - (V.oy - 30)) / 70);
      if (fade <= 0) { leaves.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(q.d * q.size, q.size);
      ctx.translate(-q.cu, 0.5);
      ctx.fillStyle = q.color;
      drawLetter(q.type, 1, 0, 1);
      ctx.restore();
    }
  }

  /* ---------- 조작 안내: 가만히 있으면 옅은 손 획이 가획·병서를 그어 보임 ---------- */
  // 처음 들어와서 잠깐, 또는 한 번 해 본 뒤 오래 멈추면, 지금 바꿀 ㄱ 에
  //   ① 가로로 한 획 + '가획'
  //   ② 옆에 ㄱ 모양(가로로 가다 꺾어 아래로) + '병서'
  // 를 번갈아 보여 줌. 화면을 누르거나 획을 그으면 바로 사라짐.
  const FIRST_WAIT = 1200;  // 처음 들어와서 안내가 나오기까지(ms)
  const IDLE_WAIT = 10000;  // 한 번 해 본 뒤 오래 멈췄을 때(ms)
  const PHASE = 2600;       // 가획·병서 한 장면 길이(ms)
  const GAP = 300;          // 장면 사이 쉼(ms)
  let lastInput = performance.now();
  let leafCue = -1;         // 다 자란 뒤 가만히 있은 시간(ms), 아니면 -1
  let doneAt = 0;
  const guide = { a: 0, n: null, t0: 0, told: false };
  let labelFont = '';

  // 왼쪽 설명 칸: 지금 안내하거나 방금 손으로 한 쪽 하나만 보임 (다른 쪽이 올 때까지 그대로 둠)
  let ruleHold = { name: '', until: 0 }; // 손으로 바꾼 직후 잠깐
  let guidePhase = '';                    // 안내 획이 보여 주는 중인 쪽
  let shownRule = null;
  const ruleEls = [...document.querySelectorAll('.rule')];
  function updateRules(now) {
    const name = (now < ruleHold.until ? ruleHold.name : guidePhase) || shownRule || '';
    if (name === shownRule) return;
    shownRule = name;
    ruleEls.forEach((r) => r.classList.toggle('is-active', r.dataset.rule === name));
  }

  // 안내할 ㄱ: 지금 손으로 바꿀 층(가장 낮은 세대)에서 화면 가운데에 가장 가까운 것
  function pickTarget(now) {
    let best = null, bestD = Infinity;
    each(root, (n) => {
      if (!pending(n, now)) return;
      const d = Math.abs(V.ox + n.x * V.U - W / 2);
      if (!best || n.gen < best.gen || (n.gen === best.gen && d < bestD)) { best = n; bestD = d; }
    });
    return best;
  }

  // 점들을 이은 선을 앞에서부터 frac 만큼만, 끝에 손끝 점
  function ghostLine(pts, frac, alpha, lw) {
    const lens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); lens.push(l); total += l; }
    let left = total * frac;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ctx.fillStyle = color(0);
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    let head = pts[0];
    for (let i = 1; i < pts.length && left > 0; i++) {
      const k = Math.min(1, left / (lens[i - 1] || 1));
      head = { x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k) };
      ctx.lineTo(head.x, head.y);
      left -= lens[i - 1];
    }
    ctx.stroke();
    if (frac < 1) { // 긋고 있는 손끝
      ctx.beginPath();
      ctx.arc(head.x, head.y, lw * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 획 옆 작은 글씨 (화면 밖으로 나가면 반대쪽에)
  function label(text, x, y, altX, alpha) {
    if (!labelFont) labelFont = getComputedStyle(document.body).fontFamily;
    const px = Math.round(Math.max(15, 20 * base));
    ctx.font = `600 ${px}px ${labelFont}`;
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    let tx = x;
    if (tx + w > W - 16) tx = altX - w;
    tx = Math.max(16, tx);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color(0);
    ctx.fillText(text, tx, y);
  }

  function drawGuide(now, dt) {
    guidePhase = '';
    const idle = now - lastInput;
    let want = treeOn() && stage === 'grow' && !gesture && idle > (touched ? IDLE_WAIT : FIRST_WAIT);
    if (want && (!guide.n || !pending(guide.n, now))) {
      if (guide.a < 0.02) { guide.n = pickTarget(now); guide.t0 = now; } // 다 사라진 뒤에 새 ㄱ 으로
      else want = false;
    }
    if (!guide.n) want = false;
    guide.a += ((want ? 1 : 0) - guide.a) * (1 - Math.exp(-dt / (want ? 250 : 90)));
    if (!want && guide.a < 0.02) { guide.a = 0; guide.n = null; return; }
    if (want && !guide.told) {
      guide.told = true;
      live.textContent = '화면 어디든 가로로 한 획 그으면 가획으로 ㅋ, ㄱ 모양을 그리면 병서로 ㄲ 이 됩니다.';
    }

    const n = guide.n;
    const kk = n.gen < MAX_GEN;               // 맨 끝 세대는 가획만
    const cycle = kk ? 2 * (PHASE + GAP) : PHASE + GAP;
    const t = (now - guide.t0) % cycle;
    const second = t >= PHASE + GAP;
    const tp = second ? t - PHASE - GAP : t;
    if (tp > PHASE) return;

    const sPx = n.s * V.U;
    const P = (u, y) => ({ x: V.ox + n.x * V.U + n.d * u * sPx, y: V.oy + n.y * V.U + y * sPx });
    const lw = Math.max(3, 7 * base);
    const fade = guide.a * easeOut(seg(tp, 0, 200)) * (1 - seg(tp, 2100, PHASE));
    const draw = reduce ? 1 : easeOut(seg(tp, 300, 1100)); // 손 획이 그어지는 정도
    const show = seg(tp, 1000, 1500);                      // 결과·글씨가 드러나는 정도
    const gap = Math.max(12, 0.12 * sPx);
    if (fade > 0.3) guidePhase = second ? '병서' : '가획';

    ctx.save();
    if (!second) {
      // ① 가획: 글자 가운데를 가로지르는 한 획 (화면에서 늘 왼쪽 → 오른쪽)
      const a = P(-0.35, MID).x, b = P(ARM + 0.3, MID).x;
      const y = P(0, MID).y;
      const x0 = Math.min(a, b), x1 = Math.max(a, b);
      ghostLine([{ x: x0, y }, { x: x1, y }], draw, 0.4 * fade, lw);
      label('가획', x1 + gap, y, x0 - gap, 0.7 * fade * show);
    } else {
      // ② 병서: 세로획 바깥 옆에 ㄱ 을 하나 더 씀 (화면에서 늘 바른 ㄱ: 오른쪽으로 가다 아래로)
      const a = P(-0.3, 0).x, b = P(-0.3 - (ARM - T), 0).x; // 가로획: 원래 ㄱ 가로획보다 획 굵기만큼 살짝 짧게 (둥근 끝이 더해지는 만큼)
      const x0 = Math.min(a, b), x1 = Math.max(a, b);
      const top = P(0, -1 + TH / 2).y, bottom = P(0, 0).y;
      ghostLine([{ x: x0, y: top }, { x: x1, y: top }, { x: x1, y: bottom }], draw, (0.4 + 0.15 * show) * fade, lw);
      // 획이 끝나는 곳(세로획 아래 끝) 옆. 글씨 아래 끝이 획 끝에 맞도록 글씨 높이 반만큼 올림
      const px = Math.round(Math.max(15, 20 * base));
      label('병서', x1 + gap, bottom - px / 2, x0 - gap, 0.7 * fade * show);
    }
    ctx.restore();
  }

  /* ---------- 오각형 첫 화면(js/penta.js)과 주고받는 것 ---------- */
  window.hangulTree = {
    // 지금 그려진 맨 아래 글자: 세로획 아래 가운데 (x, y), 글자 크기 s(px), 옅어진 정도 shade
    rootGlyph: () => ({ x: V.ox, y: V.oy, s: ROOT * V.U, shade: root.shade }),
    // 글꼴 ㄱ 을 다시 재고, 나무 ㄱ 모양을 돌려줌 (원판 쪽이 글꼴을 받은 뒤 부름)
    measure() { measureShape(); return { T, TH, ARM }; },
    color,
    // 나무를 ㄱ 하나로 되돌리고 화면도 처음 자리로 (그리는 애니메이션 없이 바로)
    reset() {
      clearTimeout(fallTimer);
      waves.clear();
      root.children = [];
      root.type = 'ㄱ';
      root.conv = null;
      root.end = Infinity;
      root.start = Math.min(root.start, performance.now() - GROW);
      root.shade = 0;
      root.shake = -Infinity;
      gen = 0;
      stage = 'grow';
      growEnd = 0;
      wasDone = false;
      leaves.length = 0;
      trails.length = 0;
      gesture = null;
      touched = false;
      breathFrom = performance.now() + 900; // 날아온 ㄱ 이 내려앉은 뒤부터 숨 쉬기
      lastInput = performance.now() + 900;  // 조작 안내도 내려앉은 뒤부터 셈
      guide.a = 0;
      guide.n = null;
      guide.told = false;
      zoom = 1;
      panX = rootCenter();
      V = { U: base, ox: midX() - panX * base, oy: groundY() };
      ruleHold = { name: '', until: 0 };
      shownRule = null; // 처음 들어오면 아무 설명도 없이 시작
      ruleEls.forEach((r) => r.classList.remove('is-active'));
      live.textContent = '';
    },
  };

  /* ---------- 매 프레임 ---------- */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.max(0, now - lastT);
    lastT = now;
    autoStep(now);
    view(dt);

    readColors();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const done = treeOn() && isComplete(now);
    if (done && !wasDone) doneAt = now;
    leafCue = done && !reduce ? now - doneAt : -1; // 다 자라자마자 끝의 ㅋ 들이 살랑이기 시작 (손을 움직여도 계속)

    // 끝 가지부터 그려서, 부모 가로획이 이음새를 덮게
    const all = [];
    const ks = 1 - Math.exp(-dt / 500);
    each(root, (n) => {
      const target = Math.min(0.6, (gen - n.gen) * 0.1);
      n.shade += (target - n.shade) * ks;
      all.push(n);
    });
    all.sort((a, b) => b.gen - a.gen).forEach((n) => drawNode(n, now));
    drawTrails(now);
    drawLeaves(now);
    drawGuide(now, dt);
    updateRules(now);

    if (done && !wasDone) live.textContent = '나무가 다 자랐습니다. 빈 곳을 누르면 끝의 ㅋ 들이 낙엽처럼 떨어집니다.';
    wasDone = done;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
