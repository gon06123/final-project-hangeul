/* 01 자음 — ㅇ 연못 (水 · 흐름 · 통함). 화면 전체가 고요한 수면이고, 떨어진 글자가 그대로 파문이 되어 퍼진다.
   ㅇ 은 목구멍을 본뜬 글자. 획을 더할수록(가획) 소리가 세지듯, 물결도 세지고 멀리 닿는다.
   조작은 하나: 꾹 누르고 있다가 떼기.
   · 누르기: 손끝에 작은 ㅇ 이 맺혀 1.4초 동안 고르게 부풀고(0.6 → 1.5배), 다 부푼 채 0.5초 머문 뒤
     획이 붙으며 단단히 뭉쳤다가(0.7배) 다시 부풂: ㅇ → ㆆ → ㅎ (가획). 어느 글자든 떼는 때에 따라 크기가 다름.
     응축: 획이 붙을 때 물결이 바깥에서 글자로 모여들고, 다 뭉친 순간 새 닿는 거리까지 물결 하나가 탁 퍼짐
   · 크기는 동그라미 기준: 같은 단계면 ㅇ·ㆆ·ㅎ 의 동그라미 크기가 같음 (ㆆ·ㅎ 은 그만큼 글자 전체가 큼).
     큰 글자일수록 파문이 멀리 닿고 소리가 낮음
   · 떼기: 그 순간의 글자가 떨어짐. 파문은 글자마다 닿는 거리가 정해져 있고, 그 끝에서 사그라듦
     (ㅇ 가까이 · ㆆ 중간 · ㅎ 멀리 · ㆅ 가장 멀리). 떨어진 글자는 계속 떠 있음 (30개를 넘으면 오래된 것부터 가라앉음)
   · ㅎ 을 다른 ㅎ 가까이 떨어뜨리면 둘이 끌려가 나란히 붙어 ㆅ (병서) — 두 겹 파문
   · 따라 울림: 파문이 떠 있는 글자에 닿으면 그 글자도 제 세기로 다시 울림 → 징검다리처럼 번짐
     (한 번의 울림 안에서 같은 글자는 한 번만 울림 → 어떤 울림이든 끝이 있음)
   · 떠 있는 글자를 톡 누르면 그 글자가 다시 울림 (떨어뜨린 횟수에 들지 않음)
   · 수련 봉오리: 연못 곳곳(임의 자리)에 일곱 송이가 하나씩 톡 솟음. 파문이 닿으면 꽃이 피고,
     피면서 작은 파문을 냄 (글자만 울림, 봉오리는 못 피움)
     봉오리 크기 = 단단함: 작고 여린 셋은 아무 파문, 중간 둘은 ㆆ 이상, 큰 둘은 ㅎ 이상이라야 핌.
     약한 파문이 닿으면 떨기만 함. 따라 울린 글자의 파문도 그 글자의 세기를 가짐
   · 통함: 봉오리가 모두 피면 꽃들이 함께 울림. 그 뒤 빈 곳을 누르면 물살에 글자와 꽃이 떠내려가고 새 봉오리가 솟음
   · 소리(살짝): ㅇ 은 낮고 둥근 물방울, ㆆ 은 더 또렷하게, ㅎ 은 숨소리가 섞임. 꽃이 필 때마다 한 음씩 올라감
   · 그냥 움직이기: 마우스가 지나간 자리에 옅은 물결 자국 (빠를수록 진하게)
   키보드: Space/Enter 를 누르고 있다가 떼면 같음 (자리는 아직 안 핀 봉오리 가까이).
   음(어두운 화면)이면 밤 연못: 파문이 빛남. */
(() => {
  const canvas = document.getElementById('pond');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const live = document.getElementById('live');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pondOn = () => document.body.dataset.view === 'pond';

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const rand = Math.random;
  const TAU = Math.PI * 2;

  const CONV = reduce ? 200 : 520;   // 획이 붙는 시간(ms)
  const SINK = reduce ? 300 : 1400;  // 가라앉는 시간(ms)
  const MAX_LETTERS = 30;            // 넘치면 가장 오래된 글자부터 가라앉음 (그 밖에는 글자가 사라지지 않음)
  const TAP = 220;                   // 이보다 짧게 누르면 톡 (떠 있는 글자면 다시 울림)
  // 누르고 있는 동안: ㅇ 부풂 → (획이 붙으며) ㆆ 뭉쳤다 부풂 → (꼭지가 붙으며) ㅎ 뭉쳤다 부풂
  // 크기 (보통 글자 크기의 배, 동그라미 기준): 0.6 에서 1.5 까지 부풀고, 획이 붙는 순간 0.7 로 뭉침
  const SWELL_MIN = 0.6, SWELL_MAX = 1.5, CORE = 0.7;
  const GROW = 1400;    // 부푸는 시간(ms) — 고르게, 처음과 끝은 천천히
  const TOP = 500;      // 다 부푼 뒤 다음 획이 붙기 전까지 머무는 시간(ms) — 가장 큰 크기에서 뗄 여유
  const SQUEEZE = 420;  // 획이 붙으며 뭉치는 시간(ms)
  const STAGES = ['ㅇ', 'ㆆ', 'ㅎ'];
  const STAGE_AT = [0, GROW + TOP, GROW + TOP + SQUEEZE + GROW + TOP]; // ㅇ · ㆆ · ㅎ 가 되는 때(ms)
  const smooth = (t) => t * t * (3 - 2 * t);
  const PULL = reduce ? 200 : 560;   // ㅎ 이 옆 ㅎ 으로 끌려가 붙는 시간(ms)
  const PAIR_REACH = 2.4;            // 이만큼(보통 글자 크기의 배) 안에 ㅎ 이 있으면 병서
  // 파문이 닿는 거리 (보통 글자 크기의 배) — 획이 많을수록 멀리
  const REACH = { 'ㅇ': 1.8, 'ㆆ': 2.8, 'ㅎ': 4, 'ㆅ': 5.4 };
  // 파문의 세기 — 단단한 봉오리는 이만큼 센 파문이 닿아야 핌
  const POWER = { 'ㅇ': 1, 'ㆆ': 2, 'ㅎ': 3, 'ㆅ': 3 };
  const BLOOM_REACH = 2;             // 꽃이 피며 내는 파문이 닿는 거리 (글자만 울림, 봉오리는 못 피움)
  const BUDS = 7;                    // 봉오리 수 (화면이 좁으면 들어가는 만큼)
  const NEEDS = [1, 1, 1, 2, 2, 3, 3]; // 봉오리마다 피는 데 필요한 세기
  const BLOOM = reduce ? 200 : 1100; // 꽃이 다 피기까지(ms)

  /* ---------- 글자 모양 — 글자 크기 = 1, 원점 = 글자 가운데 ---------- */
  const T = 0.13;     // 획 굵기
  const TICK = 0.19;  // ㅎ 꼭지 길이
  // cy·r·rx: 동그라미 가운데 높이와 바깥 반지름(세로·가로), barY·barW: 가로획, bar·tick: 가로획·꼭지가 붙은 정도
  // 비율은 페이지 글꼴(Pretendard SemiBold)을 잰 값: ㅇ 은 가로가 1.14배 (measureO 가 브라우저에서 다시 잼),
  // ㅎ 은 가로획이 글자 폭 전체, 동그라미는 가로가 1.35배로 납작. ㆆ·ㆅ 은 글꼴에 없어 ㅎ 비율에서 만듦
  const SHAPE = {
    'ㅇ': { cy: 0, r: 0.5, rx: 0.57, barY: -0.4, barW: 0.5, bar: 0, tick: 0 },
    // ㆆ: ㅎ 에서 꼭지를 뺀 꼴 — 가로획이 맨 위, 동그라미는 ㅇ 과 ㅎ 사이 비율, 가로획은 동그라미 폭쯤
    'ㆆ': { cy: 0.118, r: 0.382, rx: 0.46, barY: -0.5 + T / 2, barW: 0.96, bar: 1, tick: 0 },
    'ㅎ': { cy: 0.214, r: 0.286, rx: 0.385, barY: -0.233, barW: 1.0, bar: 1, tick: 1 },
  };
  SHAPE['ㆅ'] = SHAPE['ㅎ'];
  const KEYS = Object.keys(SHAPE['ㅇ']);
  const mixShape = (a, b, k) => { const o = {}; KEYS.forEach((key) => { o[key] = lerp(a[key], b[key], k); }); return o; };
  const HH_X = 0.27;  // ㆅ: 두 ㅎ 이 가운데에서 떨어진 거리 → 전체 폭이 높이쯤 (두 가로획 사이 틈 0.06)
  // ㆅ 안의 좁은 ㅎ: 높이는 그대로, 동그라미는 작고 덜 납작하게, 가로획은 짧게
  const HH = { cy: 0.24, r: 0.26, rx: 0.22, barY: -0.233, barW: 0.48, bar: 1, tick: 1 };

  // ㅇ 동그라미의 가로/세로 비: 페이지 글꼴의 ㅇ 을 캔버스에 크게 써서 재서 맞춤 → 원판의 ㅇ 처럼 살짝 타원
  // (글꼴을 받기 전에는 SHAPE 의 기본값 1.14)
  function measureO() {
    const px = 240, pad = 40;
    const cv = document.createElement('canvas');
    cv.width = cv.height = px + pad * 2;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.font = `600 ${px}px ${getComputedStyle(document.body).fontFamily}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('ㅇ', cv.width / 2, cv.height / 2);
    const N = cv.width;
    const data = c.getImageData(0, 0, N, N).data;
    let x0 = N, x1 = -1, y0 = N, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (data[(y * N + x) * 4 + 3] <= 127) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return;
    const a = (x1 - x0 + 1) / (y1 - y0 + 1);
    if (a > 0.75 && a < 1.3) SHAPE['ㅇ'].rx = 0.5 * a; // 이상하게 재졌으면 그대로
  }
  measureO();
  if (document.fonts) {
    document.fonts.load('600 100px Pretendard', 'ㅇ').then(measureO, () => {});
    document.fonts.ready.then(measureO);
  }

  // ㅎ 하나(또는 ㅇ·ㆆ)를 그릴 조각들: 타원(e) 또는 사각형 (글자 좌표)
  // 동그라미는 바깥 높이 = 2r, 바깥 너비 = 2rx (획 굵기는 그대로)
  function partsOf(p, ox, sx, sy, out) {
    const rc = Math.max(0.001, p.r - T / 2);
    const rcx = Math.max(0.001, p.rx - T / 2);
    out.push({ e: 1, cx: ox, cy: p.cy * sy, rx: rcx * sx, ry: rc * sy });
    if (p.bar > 0.001) {
      const w = p.barW * p.bar * sx;
      out.push({ x: ox - w / 2, y: p.barY * sy - T / 2, w, h: T });
    }
    if (p.tick > 0.001) {
      const len = TICK * p.tick * sy;
      const y1 = p.barY * sy - T / 2 + 0.01;
      out.push({ x: ox - T / 2, y: y1 - len, w: T, h: len });
    }
    return out;
  }

  // 지금 그 글자의 모양 (바뀌는 중이면 그 사이)
  function letterParts(L, now) {
    const k = L.conv ? easeOut(clamp01((now - L.conv.at) / CONV)) : 1;
    if (L.type !== 'ㆅ') return partsOf(L.conv ? mixShape(L.conv.from, SHAPE[L.type], k) : SHAPE[L.type], 0, 1, 1, []);
    // 병서: 본래 ㅎ 은 한쪽으로 비켜 좁아지고, 끌려온 쪽에 ㅎ 이 하나 더 나란히 섬
    // 끌려온 ㅎ 은 0.6 자리에 온전한 ㅎ 으로 닿았다가, 둘이 함께 좁아지며 붙음
    const out = partsOf(mixShape(SHAPE['ㅎ'], HH, k), -L.side * HH_X * k, 1, 1, []);
    partsOf(mixShape(SHAPE['ㅎ'], HH, k), L.side * lerp(0.6, HH_X, k), 1, 1, out);
    return out;
  }

  // 누르고 있는 동안의 모양: 지난 시간만큼 획이 붙음
  function holdStage(g, now) {
    const el = now - g.t0;
    return el >= STAGE_AT[2] ? 2 : el >= STAGE_AT[1] ? 1 : 0;
  }
  function holdShape(g, now) {
    const st = holdStage(g, now);
    if (st === 0) return SHAPE['ㅇ'];
    const k = easeOut(clamp01((now - g.t0 - STAGE_AT[st]) / CONV));
    return mixShape(SHAPE[STAGES[st - 1]], SHAPE[STAGES[st]], k);
  }
  // 글자마다 동그라미 크기를 ㅇ 에 맞추는 배수: ㆆ·ㅎ 은 글자 안의 동그라미가 작아서 글자 전체를 그만큼 키움
  // → 같은 크기 단계면 ㅇ·ㆆ·ㅎ 의 동그라미가 같음 (ㅎ 은 그 위에 가로획·꼭지가 더해짐)
  const CIRCLE = (type) => SHAPE['ㅇ'].r / SHAPE[type === 'ㆅ' ? 'ㅎ' : type].r;

  // 누르고 있는 동안의 크기 (보통 글자 크기의 배, 글자 전체). 부풂·뭉침은 동그라미 크기 기준
  function holdScale(g, now) {
    const st = holdStage(g, now);
    const t = now - g.t0 - STAGE_AT[st];
    if (st === 0) return lerp(SWELL_MIN, SWELL_MAX, smooth(clamp01(t / GROW)));
    const f = CIRCLE(STAGES[st]), fp = CIRCLE(STAGES[st - 1]);
    // 획이 붙는 순간 단단히 뭉쳤다가(조금 더 작게 조였다 살짝 되튐), 다시 부풂
    if (t < SQUEEZE) return lerp(SWELL_MAX * fp, CORE * f, easeOutBack(t / SQUEEZE));
    return lerp(CORE * f, SWELL_MAX * f, smooth(clamp01((t - SQUEEZE) / GROW)));
  }

  /* ---------- 캔버스 ---------- */
  let W = 0, H = 0, dpr = 1, u = 1, S0 = 80;
  let ink = [14, 14, 14], paper = [255, 255, 255];
  const rgb = (str) => (str.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function readColors() {
    const cs = getComputedStyle(document.body);
    ink = rgb(cs.color);
    paper = rgb(cs.backgroundColor);
  }
  function resize() {
    const oW = W, oH = H;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    u = Math.min(W, H) / 1000;           // 화면 크기 단위
    S0 = Math.max(56, Math.min(120, Math.min(W, H) * 0.1)); // 보통 글자 크기(px)
    // 떠 있는 글자·봉오리는 같은 비율 자리로
    if (oW && oH) [...letters, ...buds].forEach((L) => { L.x *= W / oW; L.y *= H / oH; });
    readColors();
  }
  const letters = [];  // 떠 있는 글자
  const buds = [];     // 수련 봉오리 { x, y, s, need(단단함), born, popped, open(핀 때, 0 이면 봉오리), end, drift, ph, rot, notch, bob, pulse, shake }
  const rings = [];    // 파문
  const drops = [];    // ㅎ 의 물방울
  let chainSeq = 0;    // 울림 번호: 한 번의 울림 안에서 같은 글자는 한 번만 따라 울림
  let done = null;     // 통함 { at, fin, end }
  let dropped = 0;     // 이번 판에 떨어뜨린 글자 수
  let respawnAt = 0;   // 흘려보낸 뒤 새 봉오리가 떠오를 때
  resize();
  window.addEventListener('resize', resize);

  /* ---------- 파문 ---------- */
  // 글자마다 물결의 세기: n 겹, gap 겹 사이(ms), v 퍼지는 빠르기(px/ms, u 배), a 진하기, w 굵기(px, u 배)
  const WAVE = {
    'ㅇ': { n: 2, gap: 420, v: 0.17, a: 0.42, w: 2.2 },
    'ㆆ': { n: 3, gap: 170, v: 0.21, a: 0.52, w: 2.6 },
    'ㅎ': { n: 3, gap: 120, v: 0.26, a: 0.62, w: 3 },
  };
  WAVE['ㆅ'] = WAVE['ㅎ'];
  const REST = 700; // 한 번 울린 글자가 다시 울릴 수 있기까지(ms)

  // hit: { src, chain, power } — 이 파문이 닿은 글자를 울리고 봉오리를 피움 (맨 앞 물결만). power 0 이면 글자만 울림
  // fade: 사그라드는 모양 (작을수록 끝까지 또렷하다가 닿는 거리 끝에서 사라짐)
  // inv: 바깥에서 안으로 모여드는 물결 (응축)
  function ring(x, y, r0, o, at, hit = null) {
    rings.push({
      x, y, r0, at, v: o.v * u, life: o.life, a: o.a, w: Math.max(1, o.w * u), fade: o.fade || 1.6, inv: !!o.inv,
      src: hit ? hit.src : null, chain: hit ? hit.chain : 0, power: hit ? hit.power || 0 : 0,
    });
    if (rings.length > 220) rings.splice(0, rings.length - 220);
  }

  // 글자의 파문: 모든 겹이 정해진 거리(REACH)에서 함께 사그라듦. m: 크기 배수
  // relay: 따라 울린 것이면 겹을 줄이고 옅게 (닿는 거리는 같음)
  function burst(x, y, r0, type, at, m = 1, src = null, chain = 0, relay = false) {
    const base = WAVE[type];
    const sm = Math.sqrt(m);
    const v = base.v * sm;
    const R = REACH[type] * S0 * sm;
    const life = Math.max(400, (R - r0) / (v * u));
    const o = { v, life, a: Math.min(0.85, base.a * (0.85 + 0.15 * m)) * (relay ? 0.7 : 1), w: base.w * sm * (relay ? 0.8 : 1), fade: 0.9 };
    const n = relay ? Math.min(2, base.n) : base.n + Math.floor(m - 1);
    for (let i = 0; i < n; i++) ring(x, y, r0, { ...o, a: o.a * (1 - i * 0.15) }, at + i * base.gap, i === 0 ? { src, chain, power: POWER[type] } : null);
  }

  // 그 글자가 울림: 물결 (ㆅ 은 두 자리에서 동시에), 손으로 떨어뜨린 ㅎ·ㆅ 은 물방울도, 그리고 그 글자의 소리
  // chain 을 주지 않으면 새 울림의 시작. 한 울림(chain) 안에서 같은 글자는 한 번만 울림
  function sound(L, at, chain = ++chainSeq, relay = false) {
    L.heard.add(chain);
    if (L.heard.size > 24) L.heard.delete(L.heard.values().next().value);
    L.rest = at + REST;
    const r0 = L.s * 0.45;
    if (L.type === 'ㆅ') {
      [-1, 1].forEach((sd) => burst(L.x + sd * HH_X * L.s, L.y, r0 * 0.7, 'ㆅ', at, L.m, L, chain, relay));
      if (!relay) splash(L, at, 6);
    } else {
      burst(L.x, L.y, r0, L.type, at, L.m, L, chain, relay);
      if (L.type === 'ㅎ' && !relay) splash(L, at, 4);
    }
    voice(L, (at - performance.now()) / 1000);
  }

  /* ---------- 소리 (살짝) — 첫 누르기 때 켜짐 (브라우저는 손이 닿기 전엔 소리를 막음) ---------- */
  let actx = null, master = null, noiseBuf = null;
  function wakeAudio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { actx = new AC(); } catch { return; }
      master = actx.createGain();
      master.gain.value = 0.6;
      // 물 위의 소리: 높은 쪽을 깎고, 짧은 메아리
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 3200;
      const dl = actx.createDelay(1);
      dl.delayTime.value = 0.23;
      const fb = actx.createGain();
      fb.gain.value = 0.26;
      master.connect(lp);
      lp.connect(actx.destination);
      lp.connect(dl); dl.connect(fb); fb.connect(dl); fb.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
  }
  document.addEventListener('pointerdown', wakeAudio, { capture: true });
  document.addEventListener('keydown', wakeAudio, { capture: true });

  const audioOn = () => actx && actx.state === 'running' && pondOn() && !document.hidden;

  // 맑은 음 하나. glide: 처음 잠깐 음이 올라가는 정도 (물방울 '퐁')
  function tone(f, delay, o) {
    if (!audioOn()) return;
    const t = actx.currentTime + Math.max(0, delay);
    const osc = actx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(f * o.glide, t + 0.07);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }

  // 숨소리 (ㅎ): 걸러 낸 잡음
  function breath(delay, dur, gain) {
    if (!audioOn()) return;
    const t = actx.currentTime + Math.max(0, delay);
    if (!noiseBuf) {
      noiseBuf = actx.createBuffer(1, Math.round(actx.sampleRate * 0.6), actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1;
    }
    const src = actx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = actx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // 글자마다의 소리: 획이 많을수록 높고 또렷하게, 큰 글자는 낮게
  const VOICE = {
    'ㅇ': { f: 262, glide: 1.45, dur: 0.75, gain: 0.07 },
    'ㆆ': { f: 330, glide: 1.6, dur: 0.5, gain: 0.075, type: 'triangle' },
    'ㅎ': { f: 392, glide: 1.8, dur: 0.38, gain: 0.07, type: 'triangle', breath: 0.035 },
  };
  function voice(L, delay) {
    const v = VOICE[L.type === 'ㆅ' ? 'ㅎ' : L.type];
    const f = v.f / Math.sqrt(Math.max(0.5, L.m));
    tone(f, delay, v);
    if (v.breath) breath(delay, 0.3, v.breath);
    if (L.type === 'ㆅ') { tone(f * 1.5, delay + 0.07, v); breath(delay + 0.07, 0.3, v.breath); }
  }

  // 꽃이 필 때·통함 때의 음 (오음계)
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  const note = (i, delay, gain = 0.035, dur = 1.4) => tone(PENTA[Math.max(0, Math.min(PENTA.length - 1, i))], delay, { type: 'triangle', dur, gain });

  function splash(L, at, n) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + rand() * 0.6;
      drops.push({
        x: L.x, y: L.y, ang, dist: L.s * (0.9 + rand() * 1.1),
        at: at + rand() * 120, dur: 480 + rand() * 260, size: L.s * (0.06 + rand() * 0.04),
      });
    }
  }

  /* ---------- 글자 ---------- */
  let recent = null; // 가장 최근에 떨어지거나 바뀐 글자 (안내가 이 글자에)

  function addLetter(x, y, s, now, type = 'ㅇ') {
    const L = {
      // m: 동그라미 크기 기준의 크기 배수 (닿는 거리·소리 높이에 씀)
      x, y, s, m: s / S0 / CIRCLE(type), type, conv: null, side: 1,
      born: now, end: Infinity,
      ph: rand() * TAU, shake: -Infinity, bob: 0, pull: null, heard: new Set(), rest: 0,
    };
    letters.push(L);
    recent = L;
    sound(L, now);
    // 너무 많으면 오래된 것부터 가라앉음
    const alive = letters.filter((q) => q.end === Infinity);
    for (let i = 0; i < alive.length - MAX_LETTERS; i++) alive[i].end = now;
    return L;
  }

  const ready = (L, now) => L.end === Infinity && !L.pull && now - L.born > 300 && (!L.conv || now - L.conv.at > CONV);

  function convert(L, type, now, side = 1) {
    L.conv = { at: now, from: mixShape(SHAPE[L.type], SHAPE[L.type], 0) };
    L.type = type;
    L.side = side;
    recent = L;
    sound(L, now + CONV * 0.5);
  }

  // 그 글자(type) 가운데 (x, y) 에서 가장 가까운 것 (끌려가는 중인 글자는 빼고)
  function nearest(type, x, y, now) {
    let best = null, bd = Infinity;
    for (const L of letters) {
      if (L.type !== type || !ready(L, now)) continue;
      const d = Math.hypot(L.x - x, L.y - y);
      if (d < bd) { bd = d; best = L; }
    }
    return best;
  }

  function letterAt(x, y) {
    let best = null, bd = Infinity;
    for (const L of letters) {
      if (L.end !== Infinity || L.pull) continue;
      const d = Math.hypot(L.x - x, L.y - y);
      const reach = L.s * (L.type === 'ㆅ' ? 0.75 : 0.55);
      if (d < reach && d < bd) { bd = d; best = L; }
    }
    return best;
  }

  // ㅎ 이 다른 ㅎ 옆으로 끌려가 붙음 → 끝나면 ㆅ (frame 에서 매번)
  function updatePulls(now) {
    for (let i = letters.length - 1; i >= 0; i--) {
      const L = letters[i];
      const p = L.pull;
      if (!p) continue;
      const to = p.to;
      if (to.end !== Infinity || to.type !== 'ㅎ') { L.pull = null; continue; } // 짝이 사라졌으면 그냥 남음
      const t = clamp01((now - p.at) / PULL);
      const k = easeInOut(t);
      L.x = lerp(p.x0, to.x + p.side * to.s * 0.6, k);
      L.y = lerp(p.y0, to.y, k);
      if (t >= 1) {
        letters.splice(i, 1);
        convert(to, 'ㆅ', now, p.side);
        ruleHold = { name: '병서', until: now + 2500 };
        live.textContent = 'ㅎ 을 나란히 써서 ㆅ 이 되었습니다. 두 겹 파문이 가장 멀리 닿습니다.';
      }
    }
  }

  /* ---------- 수련 봉오리 ---------- */
  // 자리는 임의로: 왼쪽 설명 칸과 화면 가장자리를 피하고, 서로 떨어지게.
  // demo 가 있으면(처음 들어올 때) 한 송이는 첫 파문이 닿는 자리에 → 파문이 닿으면 핀다는 걸 저절로 보여 줌
  function budBounds() {
    let left = 0;
    if (rulesEl && W > 700) { const r = rulesEl.getBoundingClientRect(); if (r.width) left = r.right + 16; }
    return { x0: left + S0 * 0.9, x1: W - S0 * 0.9, y0: S0 * 1.5, y1: H - S0 * 1.4 };
  }
  // 단단함마다 크기 (보통 글자 크기의 배): 여린 것은 작게, 단단한 것은 크게
  const BUD_SIZE = { 1: [0.55, 0.75], 2: [0.9, 1.1], 3: [1.3, 1.5] };

  function spawnBuds(now, demo = null) {
    buds.length = 0;
    const { x0, x1, y0, y1 } = budBounds();
    const pts = [];
    const ok = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
      && pts.every((p) => Math.hypot(p.x - x, p.y - y) > S0 * 2.6)
      && (!demo || !pts.length || Math.hypot(x - demo.x, y - demo.y) > S0 * 3.2);
    if (demo) {
      for (let k = 0; k < 60; k++) {
        const a = rand() * TAU, d = S0 * (1.6 + rand() * 0.4);
        const x = demo.x + Math.cos(a) * d, y = demo.y + Math.sin(a) * d;
        if (ok(x, y)) { pts.push({ x, y }); break; }
      }
    }
    for (let k = 0; k < 600 && pts.length < BUDS; k++) {
      const x = lerp(x0, x1, rand()), y = lerp(y0, y1, rand());
      if (ok(x, y)) pts.push({ x, y });
    }
    // 단단함은 섞어서 나눠 줌 (처음 보여 주는 송이는 늘 여린 봉오리). 들어간 수가 적으면 여린 것부터 뺌
    const needs = NEEDS.slice(NEEDS.length - pts.length);
    const rest = needs.slice(demo && pts.length ? 1 : 0).sort(() => rand() - 0.5);
    if (demo && pts.length) rest.unshift(1);
    pts.forEach((p, i) => {
      const need = rest[i];
      // 하나씩 뽕뽕 떠오름: 처음 들어올 때는 첫 송이(첫 파문이 닿을 것)가 먼저, 나머지는 그 꽃이 핀 뒤에 차례로
      const born = demo ? (i === 0 ? now + 80 : now + 1500 + (i - 1) * 280) : now + 300 + i * 280;
      buds.push({
        x: p.x, y: p.y, s: S0 * lerp(BUD_SIZE[need][0], BUD_SIZE[need][1], rand()), need, born, popped: false, open: 0, end: Infinity,
        ph: rand() * TAU, rot: rand() * TAU, notch: rand() * TAU, bob: 0, pulse: -Infinity, shake: -Infinity,
      });
    });
  }

  const openCount = () => buds.filter((b) => b.open).length;
  function bloom(b, now, chain) {
    b.open = now;
    // 피면서 작은 파문 → 가까운 글자를 울림 (봉오리는 피우지 못함: power 0)
    const R = BLOOM_REACH * S0, v = 0.15, r0 = b.s * 0.4;
    ring(b.x, b.y, r0, { v, life: (R - r0) / (v * u), a: 0.42, w: 2, fade: 0.9 }, now + 80, { src: b, chain, power: 0 });
    ring(b.x, b.y, r0, { v, life: (R - r0) / (v * u), a: 0.22, w: 1.4, fade: 0.9 }, now + 320);
    const n = openCount();
    note(n - 1, 0.08, 0.045, 1.8);
    ruleHold = { name: '통함', until: now + 2500 };
    if (n >= buds.length) finish(now);
    else live.textContent = `파문이 닿아 꽃이 피었습니다. ${n} / ${buds.length}`;
  }

  // 파문의 맨 앞 물결이 글자·봉오리를 지나가는 그 순간에만: 글자는 따라 울리고, 봉오리는 핌.
  // 물결 하나는 같은 글자를 한 번만 지나가고(passed), 글자는 한 울림 안에서 한 번만 울리며(heard),
  // 울린 뒤 잠깐 쉼(rest) → 어떤 울림이든 반드시 끝남
  function checkHits(now) {
    for (const q of rings) {
      if (!q.chain) continue;
      const age = now - q.at;
      if (age < 0 || age > q.life) continue;
      const r = q.r0 + q.v * age;
      if (!q.passed) q.passed = new Set();
      for (const L of letters) {
        if (L === q.src || L.end !== Infinity || L.pull || q.passed.has(L)) continue;
        if (r < Math.hypot(L.x - q.x, L.y - q.y) - L.s * 0.4) continue;
        q.passed.add(L);
        if (L.heard.has(q.chain) || now < L.rest) continue;
        L.shake = now;
        sound(L, now + 60, q.chain, true);
      }
      if (done || !q.power) continue;
      for (const b of buds) {
        if (b.open || b.end !== Infinity || now < b.born || q.passed.has(b)) continue;
        if (r < Math.hypot(b.x - q.x, b.y - q.y) - b.s * 0.35) continue;
        q.passed.add(b);
        if (q.power < b.need) {
          // 파문이 약함: 봉오리가 떨기만 함
          b.shake = now;
          live.textContent = b.need === 3 ? '단단한 봉오리입니다. ㅎ 처럼 센 파문이 닿아야 핍니다.' : '조금 단단한 봉오리입니다. ㆆ 보다 센 파문이 닿아야 핍니다.';
          continue;
        }
        bloom(b, now, q.chain);
        if (done) break;
      }
    }
  }

  // 통함: 마지막 꽃이 피고 잠깐 뒤, 모든 꽃이 함께 울림
  function finish(now) {
    const fin = now + 1100;
    done = { at: now, fin, end: fin + 2600 };
    buds.forEach((b, i) => {
      ring(b.x, b.y, b.s * 0.45, { v: 0.2, life: 3600, a: 0.4, w: 2.4 }, fin);
      ring(b.x, b.y, b.s * 0.45, { v: 0.2, life: 3600, a: 0.22, w: 1.6 }, fin + 260);
      b.pulse = fin + i * 40;
    });
    letters.forEach((L) => { if (L.end === Infinity) L.shake = fin; });
    [0, 2, 4].forEach((k, i) => tone(PENTA[k] / 2, (fin - now) / 1000 + i * 0.06, { dur: 3.6, gain: 0.04 }));
    ruleHold = { name: '통함', until: done.end + 4000 };
    live.textContent = `봉오리 ${buds.length} 송이가 모두 피어 연못이 하나로 통했습니다. 떨어뜨린 글자 ${dropped} 개. 빈 곳을 누르면 흘려보냅니다.`;
  }

  // 통함 뒤 빈 곳을 누름: 물살이 일어 글자와 꽃이 한쪽으로 떠내려감.
  // 처음엔 천천히 끌려가다 점점 빨라지고, 좌우로 일렁이며, 지나간 자리에 잔물결을 남기고 화면 밖으로 나감.
  // 물이 빠져나가는 쪽(하류)에 가까운 것부터 먼저 움직임. 다 빠지면 새 봉오리가 떠오름
  const FLOW_DIR = (() => { const l = Math.hypot(1, 0.22); return { x: 1 / l, y: 0.22 / l }; })();
  function flush(now) {
    const items = [...letters, ...buds].filter((o) => o.end === Infinity);
    const proj = (o) => o.x * FLOW_DIR.x + o.y * FLOW_DIR.y;
    let lo = Infinity, hi = -Infinity;
    items.forEach((o) => { lo = Math.min(lo, proj(o)); hi = Math.max(hi, proj(o)); });
    let last = now;
    items.forEach((o) => {
      const at = now + (reduce ? 0 : (hi - proj(o)) / Math.max(1, hi - lo) * 700 + rand() * 120);
      o.end = at;
      if (reduce) return; // 움직임 줄이기: 제자리에서 가라앉음
      o.drift = { at, x0: o.x, y0: o.y, wake: 0, spin: (rand() < 0.5 ? -1 : 1) * (0.4 + rand() * 0.5) };
      // 화면 밖까지 가는 데 걸리는 때 (s = ½·a·t²)
      const dist = Math.max(0, W + S0 * 2 - o.x) / FLOW_DIR.x;
      last = Math.max(last, at + Math.sqrt((2 * dist) / flowAcc()));
    });
    breath(0, 1.6, 0.025); // 물살 소리
    [4, 3, 2, 0].forEach((k, i) => note(k, 0.2 + i * 0.22, 0.03, 1.2));
    done = null;
    dropped = 0;
    recent = null;
    respawnAt = (reduce ? now + SINK : last) + 500;
    ruleHold = { name: '', until: 0 };
    live.textContent = '물살에 글자와 꽃이 흘러갔습니다. 새 봉오리가 떠오릅니다.';
  }

  // 물살의 가속도(px/ms²): 화면 너비를 2.4초쯤에 건너감
  const flowAcc = () => (2 * W) / (2400 * 2400);

  // 떠내려가는 중인 자리: { x, y, rot, out } — out 이면 화면을 벗어남 (frame 에서 뺌)
  function driftPos(o, now) {
    const d = o.drift;
    const t = Math.max(0, now - d.at);
    const s = 0.5 * flowAcc() * t * t;
    // 좌우로 일렁임 (끌려가기 시작하면서 점점)
    const lat = Math.sin(t * 0.0035 + o.ph) * S0 * 0.14 * clamp01(t / 700);
    const x = d.x0 + FLOW_DIR.x * s - FLOW_DIR.y * lat;
    const y = d.y0 + FLOW_DIR.y * s + FLOW_DIR.x * lat;
    // 지나간 자리에 잔물결 (빨라질수록 촘촘하고 진하게)
    if (!reduce && t > 0 && s - d.wake > S0 * 0.45) {
      d.wake = s;
      const k = clamp01(s / (W * 0.5));
      ring(x, y, o.s * 0.3, { v: 0.05, life: 1100, a: 0.12 + 0.14 * k, w: 1.2 }, now);
    }
    const out = x - o.s > W + S0 || y - o.s > H + S0;
    return { x, y, rot: d.spin * t * 0.0012, out };
  }

  /* ---------- 왼쪽 설명: 가획·병서·통함 (지금 안내하거나 방금 한 쪽 하나만) ---------- */
  const rulesEl = document.getElementById('pond-rules');
  const ruleEls = rulesEl ? [...rulesEl.querySelectorAll('.rule')] : [];
  let ruleHold = { name: '', until: 0 };
  let guidePhase = '';
  let shownRule = null;
  const progressEl = document.getElementById('pond-progress');
  let shownProgress = '';
  function updateRules(now) {
    // 통함 칸: 핀 꽃 ● / 봉오리 ○, 다 피면 떨어뜨린 글자 수
    const n = openCount();
    let p = '●'.repeat(n) + '○'.repeat(Math.max(0, buds.length - n));
    if (done) p += ` · 글자 ${dropped}`;
    if (progressEl && p !== shownProgress) { shownProgress = p; progressEl.textContent = p; }
    const name = (now < ruleHold.until ? ruleHold.name : guidePhase) || shownRule || '';
    if (name === shownRule) return;
    shownRule = name;
    ruleEls.forEach((r) => r.classList.toggle('is-active', r.dataset.rule === name));
  }

  /* ---------- 손동작: 누르고 있다가 떼기 ---------- */
  let gesture = null;   // { id, x, y, x0, y0, lift, t0, stage }
  let lastInput = performance.now();
  let touched = false;
  let wake = null;      // 그냥 움직일 때 { x, y, t, acc }

  function startHold(id, x, y, lift) {
    const now = performance.now();
    lastInput = now;
    gesture = { id, x0: x, y0: y, x, y: y - lift, lift, t0: now, stage: 0 };
  }

  // 손을 뗌: 짧게 톡 누른 게 떠 있는 글자면 다시 울리고, 아니면 지금 모양의 글자가 떨어짐
  function release(cancelled) {
    const g = gesture;
    gesture = null;
    if (!g || cancelled) return;
    const now = performance.now();
    lastInput = now;
    touched = true;
    if (now - g.t0 < TAP) {
      const hit = letterAt(g.x0, g.y0);
      if (hit) { hit.shake = now; sound(hit, now); return; }
    }
    if (done) {
      // 통함: 꽃들이 울리는 동안은 가만히, 그 뒤 빈 곳을 누르면 흘려보냄
      if (now >= done.end) flush(now);
      return;
    }
    if (respawnAt) return; // 새 봉오리가 떠오르는 중
    const type = STAGES[holdStage(g, now)];
    dropped++;
    if (type === 'ㅎ') {
      // 큰 ㅎ 일수록 옆자리가 넓으니 그만큼 멀리서도 짝이 됨
      const near = nearest('ㅎ', g.x, g.y, now);
      const to = near && Math.hypot(near.x - g.x, near.y - g.y) <= Math.max(S0 * PAIR_REACH, near.s * 1.6) ? near : null;
      if (to) {
        const L = addLetter(g.x, g.y, to.s, now, type);
        L.pull = { to, at: now + 160, x0: g.x, y0: g.y, side: g.x >= to.x ? 1 : -1 };
        recent = to;
        return;
      }
    }
    addLetter(g.x, g.y, S0 * holdScale(g, now), now, type);
    live.textContent = type === 'ㅇ' ? 'ㅇ 이 떨어져 잔잔한 파문이 퍼집니다. 떠 있는 글자는 파문을 맞을 때마다 따라 울립니다.'
      : type === 'ㆆ' ? 'ㆆ 이 떨어져 촘촘한 파문이 멀리 퍼집니다.'
      : 'ㅎ 이 떨어져 센 파문이 멀리 퍼집니다. ㅎ 옆에 ㅎ 을 하나 더 떨어뜨리면 ㆅ 이 됩니다.';
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!pondOn() || gesture) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 포인터가 이미 사라진 경우 */ }
    // 손가락이면 글자가 손끝에 가리지 않게 조금 위에
    startHold(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? S0 * 0.9 : 0);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pondOn()) return;
    const now = performance.now();
    if (gesture) {
      // 누른 채 움직이면 맺힌 글자가 따라옴
      if (e.pointerId !== gesture.id) return;
      gesture.x = e.clientX;
      gesture.y = e.clientY - gesture.lift;
      return;
    }
    // 그냥 움직이기: 지나간 자리에 옅은 물결 자국 (빠를수록 진하게)
    if (e.pointerType !== 'mouse' || reduce) return;
    if (!wake) { wake = { x: e.clientX, y: e.clientY, t: now, acc: 0 }; return; }
    const d = Math.hypot(e.clientX - wake.x, e.clientY - wake.y);
    const speed = d / Math.max(1, now - wake.t);
    wake.acc += d;
    wake.x = e.clientX; wake.y = e.clientY; wake.t = now;
    const step = 34 * Math.max(0.6, u);
    if (wake.acc >= step) {
      wake.acc = 0;
      const k = clamp01(speed / 2.2);
      ring(e.clientX, e.clientY, 2, { v: 0.05 + 0.05 * k, life: 900 + 500 * k, a: 0.07 + 0.2 * k, w: 1.1 + 0.8 * k }, now);
    }
  });

  canvas.addEventListener('pointerleave', () => { wake = null; });
  canvas.addEventListener('pointerup', (e) => { if (gesture && e.pointerId === gesture.id) release(false); });
  canvas.addEventListener('pointercancel', (e) => { if (gesture && e.pointerId === gesture.id) release(true); });

  // 키보드: Space/Enter 를 누르고 있다가 떼면 같음 (자리는 아직 안 핀 봉오리 가까이)
  const isKey = (e) => e.key === ' ' || e.key === 'Enter';
  window.addEventListener('keydown', (e) => {
    if (!pondOn() || !isKey(e)) return;
    if (e.target.closest?.('button, a, [role="button"]')) return;
    e.preventDefault();
    if (e.repeat || gesture) return;
    const p = pressSpot(performance.now()) || home();
    startHold('key', p.x + (rand() - 0.5) * S0, p.y + (rand() - 0.5) * S0, 0);
  });
  window.addEventListener('keyup', (e) => {
    if (gesture && gesture.id === 'key' && isKey(e)) release(false);
  });

  /* ---------- 그리기 ---------- */
  const isDark = () => document.documentElement.dataset.theme === 'dark';

  function drawRings(now, dark) {
    // 밤 연못의 빛: 블러(shadowBlur)는 큰 원마다 매 프레임 너무 무거워서,
    // 같은 원을 넓고 옅은 선으로 한 번 더 그려 번진 빛처럼 보이게 함
    const GLOW_W = 4, GLOW_A = 0.16;
    ctx.save();
    for (let i = rings.length - 1; i >= 0; i--) {
      const q = rings[i];
      const age = now - q.at;
      if (age < 0) continue;
      const t = age / q.life;
      if (t >= 1) { rings.splice(i, 1); continue; }
      const r = q.r0 + q.v * age;
      if (r <= 0.5) continue;
      // inv: 바깥에서 안으로 모여드는 물결 (응축) — 옅게 나타나 모일수록 진해지고, 다 모이면 사라짐
      const a = q.inv
        ? q.a * smooth(clamp01(t * 1.4)) * (1 - Math.pow(t, 5))
        : q.a * Math.pow(1 - t, q.fade) * clamp01(age / 120);
      if (a < 0.004) continue;
      const lw = q.inv ? q.w * (0.6 + 0.7 * t) : q.w * (1 - 0.55 * t);
      // 화면에 안 걸리는 원은 건너뜀 (화면 밖에 있거나, 화면을 통째로 감쌀 만큼 커짐)
      const pad = lw * GLOW_W;
      const nx = Math.max(0, Math.min(W, q.x)), ny = Math.max(0, Math.min(H, q.y));
      if (Math.hypot(nx - q.x, ny - q.y) > r + pad) continue;
      const fx = Math.max(q.x, W - q.x), fy = Math.max(q.y, H - q.y);
      if (r - pad > Math.hypot(fx, fy)) continue;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, TAU);
      if (dark) {
        ctx.strokeStyle = rgba(ink, a * GLOW_A);
        ctx.lineWidth = lw * GLOW_W;
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(ink, a);
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ㅎ 의 물방울: 바깥으로 튀어 올랐다가(커졌다가) 떨어지며 작은 파문
  function drawDrops(now) {
    ctx.save();
    for (let i = drops.length - 1; i >= 0; i--) {
      const q = drops[i];
      const t = (now - q.at) / q.dur;
      if (t < 0) continue;
      const x = q.x + Math.cos(q.ang) * q.dist * easeOut(Math.min(1, t));
      const y = q.y + Math.sin(q.ang) * q.dist * easeOut(Math.min(1, t));
      if (t >= 1) {
        ring(x, y, q.size, { v: 0.07, life: 700, a: 0.2, w: 1.1 }, now);
        drops.splice(i, 1);
        continue;
      }
      const r = q.size * (1 + 1.3 * Math.sin(Math.PI * t));
      ctx.strokeStyle = rgba(ink, 0.6);
      ctx.lineWidth = Math.max(1, r * 0.28);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParts(parts) {
    for (const p of parts) {
      if (p.e) {
        ctx.beginPath();
        ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, TAU);
        ctx.lineWidth = T;
        ctx.stroke();
      } else ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  }

  // 글자 하나를 (x, y) 에 s 크기로
  function drawGlyph(parts, x, y, s, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = ctx.strokeStyle = rgba(ink, 1);
    drawParts(parts);
    ctx.restore();
  }

  // 지나가는 물결에 글자·잎이 살짝 들썩임
  function bobOf(L, now) {
    let b = 0;
    const wdt = L.s * 0.35;
    for (const q of rings) {
      const age = now - q.at;
      if (age < 0 || age > q.life) continue;
      const r = q.r0 + q.v * age;
      const d = Math.hypot(L.x - q.x, L.y - q.y);
      if (d < L.s * 0.6) continue; // 제 물결은 빼고
      const z = (d - r) / wdt;
      if (z > -3 && z < 3) b += q.a * (1 - age / q.life) * Math.exp(-z * z);
    }
    return Math.min(1, b);
  }

  function drawLetter(L, now) {
    let alpha = 1, sc = 1;
    // 손에서 놓인 글자: 수면에 닿으며 살짝 눌렸다가 제 크기로
    sc *= lerp(0.9, 1, easeOutBack(clamp01((now - L.born) / (reduce ? 1 : 320))));
    if (L.drift) {
      // 물살에 떠내려감
      const p = driftPos(L, now);
      if (p.out) return false;
      L.x = p.x; L.y = p.y;
    } else if (L.end !== Infinity) {
      // 가라앉음 (글자가 넘쳐 밀려났거나, 움직임 줄이기에서 흘려보낼 때)
      const t = clamp01((now - L.end) / SINK);
      if (t >= 1) return false;
      sc *= lerp(1, 0.72, easeOut(t));
      alpha *= 1 - easeInOut(t);
    }
    L.bob += (bobOf(L, now) - L.bob) * 0.25;
    sc *= 1 + 0.07 * L.bob;
    const st = (now - L.shake) / 360; // 울릴 때 살짝 떨림
    const jig = st >= 0 && st < 1 && !reduce ? Math.sin(st * 22) * 0.025 * L.s * (1 - st) : 0;
    const drift = reduce || L.pull ? 0 : Math.sin(now * 0.00045 + L.ph) * 0.03 * L.s;
    const dy = L.pull ? 0 : Math.cos(now * 0.0004 + L.ph) * 0.02 * L.s;
    drawGlyph(letterParts(L, now), L.x + jig + drift, L.y + dy, L.s * sc, alpha);
    return true;
  }

  // 수련 모양 (봉오리 크기 = 1, 원점 = 가운데): 잎(한쪽이 갈라진 원) + 꽃잎. k: 핀 정도 0..1
  const PAD_R = 0.62, NOTCH = 0.22;
  // 단단한 봉오리일수록 꽃잎을 더 크게 꼭 오므림
  function budShape(b, k) {
    const petals = [];
    const c = 0.17 + 0.035 * (b.need - 1), cw = 0.07 - 0.008 * (b.need - 1);
    for (let i = 0; i < 8; i++) petals.push({ ang: (i / 8) * TAU, len: lerp(c, 0.44, k), w: lerp(cw, 0.16, k) });
    if (k > 0.04) for (let i = 0; i < 6; i++) petals.push({ ang: ((i + 0.5) / 6) * TAU, len: lerp(0.1, 0.27, k), w: lerp(0.05, 0.12, k) });
    return { petals, dot: 0.05 * k };
  }

  function drawBud(b, now) {
    if (now < b.born) return true;
    // 뽕: 떠오르는 순간 작은 물결
    if (!b.popped) {
      b.popped = true;
      ring(b.x, b.y, b.s * 0.3, { v: 0.09, life: 900, a: 0.28, w: 1.5 }, now);
    }
    // 아무것도 없다가 톡 솟아 살짝 넘치게 커졌다 제 크기로
    const pt = clamp01((now - b.born) / (reduce ? 1 : 520));
    const pop = reduce ? 1 : Math.max(0, 1 + 2.7 * Math.pow(pt - 1, 3) + 1.7 * Math.pow(pt - 1, 2));
    let alpha = clamp01(pt * 3), sc = pop, spin = 0;
    if (b.drift) {
      // 물살에 떠내려가며 잎이 천천히 돎
      const p = driftPos(b, now);
      if (p.out) return false;
      b.x = p.x; b.y = p.y; spin = p.rot;
    } else if (b.end !== Infinity) {
      const t = clamp01((now - b.end) / SINK);
      if (t >= 1) return false;
      sc *= lerp(1, 0.75, easeOut(t));
      alpha *= 1 - t;
    }
    b.bob += (bobOf(b, now) - b.bob) * 0.2;
    sc *= 1 + 0.06 * b.bob;
    const ut = (now - b.pulse) / 700; // 통함 때 함께 울림
    if (ut > 0 && ut < 1) sc *= 1 + 0.1 * Math.sin(Math.PI * ut);
    const k = b.open ? clamp01(easeOutBack(clamp01((now - b.open) / BLOOM))) : 0;
    // 약한 파문을 맞으면 떨기만 함
    const st = (now - b.shake) / 450;
    const shiver = st >= 0 && st < 1 && !reduce ? Math.sin(st * 26) * 0.12 * (1 - st) : 0;
    const sway = (reduce ? 0 : Math.sin(now * 0.0005 + b.ph) * 0.06) + shiver;
    const dx = reduce ? 0 : Math.sin(now * 0.0004 + b.ph) * 0.025 * b.s;
    const lw = 0.035;
    ctx.save();
    ctx.translate(b.x + dx, b.y);
    ctx.scale(b.s * sc, b.s * sc);
    ctx.rotate(b.rot + sway + spin);
    ctx.lineJoin = 'round';
    // 잎: 물결을 가리며 떠 있음
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(paper, 1);
    ctx.strokeStyle = rgba(ink, 0.32);
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(b.notch + NOTCH) * PAD_R, Math.sin(b.notch + NOTCH) * PAD_R);
    ctx.arc(0, 0, PAD_R, b.notch + NOTCH, b.notch - NOTCH + TAU);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 꽃잎: 봉오리일 때는 작게 오므리고 옅게, 피면 크게 벌어짐
    const sh = budShape(b, k);
    ctx.globalAlpha = alpha * lerp(0.7, 1, Math.min(1, k * 2));
    ctx.strokeStyle = rgba(ink, 1);
    ctx.lineWidth = lw;
    for (const p of sh.petals) {
      ctx.save();
      ctx.rotate(p.ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(p.w, -p.len * 0.55, 0, -p.len);
      ctx.quadraticCurveTo(-p.w, -p.len * 0.55, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (sh.dot > 0.005) {
      ctx.fillStyle = rgba(ink, 1);
      ctx.beginPath();
      ctx.arc(0, 0, sh.dot, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  // 누르고 있는 동안 손끝에 맺힌 글자 + 아래에 몇 획째인지 점 셋
  function drawHold(now) {
    const g = gesture;
    if (!g || done || respawnAt) return; // 통함 뒤에는 글자가 맺히지 않음 (누르면 흘려보내기)
    const el = now - g.t0;
    if (el < 90) return; // 톡 누르기는 글자를 보이지 않음
    const st = holdStage(g, now);
    if (st > g.stage) {
      // 응축: 획이 붙는 동안 물이 바깥에서 글자로 빨려 들듯 모여들고,
      // 다 뭉친 순간 작아진 글자에서 새 닿는 거리까지 탁 퍼지는 물결 하나 → 작아졌는데 더 멀리
      g.stage = st;
      const big = S0 * SWELL_MAX * SHAPE['ㅇ'].r;   // 다 부푼 글자의 동그라미 반지름
      const core = S0 * CORE * SHAPE['ㅇ'].r;       // 뭉친 글자의 동그라미 반지름
      for (let i = 0; i < 3; i++) {
        const r0 = big * (1.5 + i * 0.5), life = SQUEEZE + i * 70;
        ring(g.x, g.y, r0, { v: -(r0 - core) / (life * u), life, a: 0.32 - i * 0.07, w: 1.7, inv: true }, now + i * 40);
      }
      const reach = S0 * Math.sqrt(CORE) * REACH[STAGES[st]];
      ring(g.x, g.y, core, { v: (reach - core) / (520 * u), life: 520, a: 0.38, w: 2.2, fade: 0.9 }, now + SQUEEZE);
      // 소리: 숨을 들이쉬듯 모였다가 낮게 '톡'
      breath(0, SQUEEZE / 1000, 0.018);
      tone(st === 1 ? 165 : 196, SQUEEZE / 1000, { type: 'triangle', dur: 0.2, gain: 0.07, glide: 0.6 });
      ruleHold = { name: '가획', until: now + 2500 };
      live.textContent = st === 1 ? 'ㅇ 에 획이 더해져 단단히 뭉친 ㆆ. 파문이 더 멀리, 세게 닿습니다. 더 누르고 있으면 ㅎ.' : 'ㆆ 에 꼭지가 더해져 ㅎ. 파문이 가장 셉니다. 떼면 떨어집니다.';
    }
    const appear = easeOutBack(clamp01((el - 90) / 200));
    const breathe = reduce ? 0 : 0.03 * Math.sin(now * 0.012);
    // ㅎ 까지 다 붙은 뒤에도 계속 누르면 터질 듯 조금씩 떨림
    const over = clamp01((el - STAGE_AT[2] - SQUEEZE - GROW - TOP) / 1500);
    const jx = reduce ? 0 : (rand() - 0.5) * over * S0 * 0.04;
    const scale = holdScale(g, now);
    drawGlyph(partsOf(holdShape(g, now), 0, 1, 1, []), g.x + jx, g.y, S0 * scale * lerp(0.8, 1, appear) * (1 + breathe), 0.9);

    // 이 글자의 파문이 닿을 거리: 아주 옅은 점선 동그라미 (부풀거나 획이 붙으면 넓어짐)
    const sh = holdShape(g, now);
    const reachNow = S0 * Math.sqrt(scale / CIRCLE(STAGES[st])) * (sh.tick > 0.001 ? lerp(REACH['ㆆ'], REACH['ㅎ'], sh.tick) : lerp(REACH['ㅇ'], REACH['ㆆ'], sh.bar));
    ctx.save();
    ctx.globalAlpha = 0.22 * appear;
    ctx.strokeStyle = rgba(ink, 1);
    ctx.lineWidth = Math.max(1, 1.2 * u);
    ctx.setLineDash([Math.max(2, 3 * u), Math.max(5, 9 * u)]);
    ctx.beginPath();
    ctx.arc(g.x, g.y, reachNow, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // 점 셋: ㅇ · ㆆ · ㅎ 가운데 지금 어디까지
    ctx.save();
    ctx.fillStyle = rgba(ink, 1);
    const r = Math.max(2.5, S0 * 0.04), gap = r * 4, y = g.y + S0 * (scale * 0.5 + 0.28);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = (i <= st ? 0.75 : 0.18) * appear;
      ctx.beginPath();
      ctx.arc(g.x + (i - 1) * gap, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 조작 안내: 가만히 있으면 옅은 글자로 해 볼 것을 보여 줌 ---------- */
  // 최근 글자가 ㅎ 이면: 그 옆에 ㅎ 이 하나 더 다가가는 모습 (병서)
  // 그 밖에는: 아직 안 핀 봉오리 가까이에서 ㅇ 이 맺혀 ㆆ · ㅎ 으로 자라는 모습 + "꾹 누르기" (가획)
  const FIRST_WAIT = 2600;
  const IDLE_WAIT = 9000;
  const PHASE = 3000;
  const GAP = 400;
  const guide = { a: 0, key: '', t0: 0, told: false, at: null };
  let labelFont = '';

  function label(text, x, y, altX, alpha) {
    if (!labelFont) labelFont = getComputedStyle(document.body).fontFamily;
    const px = Math.round(Math.max(15, 20 * Math.min(W / 600, H / 960)));
    ctx.font = `600 ${px}px ${labelFont}`;
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    let tx = x;
    if (tx + w > W - 16) tx = altX - w;
    tx = Math.max(16, tx);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(ink, 1);
    ctx.fillText(text, tx, y);
  }

  // 아직 안 핀 봉오리 가운데 (최근 글자나 처음 자리에서) 가장 가까운 것의 옆, ㅇ 파문이 닿는 자리
  function pressSpot(now) {
    const from = recent && recent.end === Infinity ? recent : home();
    let best = null, bd = Infinity;
    for (const b of buds) {
      if (b.open || b.end !== Infinity || now < b.born) continue;
      const d = Math.hypot(b.x - from.x, b.y - from.y);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return null;
    const cx = W / 2, cy = H / 2;
    let dx = cx - best.x, dy = cy - best.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const d = best.s * 0.6 + S0 * (best.need === 1 ? 1.1 : 2.0);
    return { x: best.x + dx * d, y: best.y + dy * d, key: 'press-' + buds.indexOf(best), need: best.need };
  }

  // 안내할 것: { key, kind: 'press' | 'pair' | 'flush', x, y, s, side }
  function guideTarget(now) {
    if (done) return now >= done.end ? { key: 'flush', kind: 'flush', x: W / 2, y: H - Math.max(48, H * 0.09), s: S0 } : null;
    if (respawnAt) return null;
    const R = recent && recent.end === Infinity && ready(recent, now) ? recent : null;
    if (R && R.type === 'ㅎ') {
      const side = R.x + R.s * 1.6 < W - 16 ? 1 : -1;
      return { key: 'pair', kind: 'pair', x: R.x, y: R.y, s: R.s, side };
    }
    const p = pressSpot(now);
    return p ? { key: p.key, kind: 'press', x: p.x, y: p.y, s: S0, need: p.need } : null;
  }

  function drawGuide(now, dt) {
    guidePhase = '';
    const idle = now - lastInput;
    const target = guideTarget(now);
    const wait = target && target.kind === 'flush' ? 1600 : touched ? IDLE_WAIT : FIRST_WAIT;
    let want = pondOn() && !gesture && idle > wait && !!target;
    if (want && guide.key !== target.key) {
      if (guide.a < 0.02) { guide.key = target.key; guide.at = target; guide.t0 = now; }
      else want = false;
    }
    guide.a += ((want ? 1 : 0) - guide.a) * (1 - Math.exp(-dt / (want ? 250 : 90)));
    if (!want && guide.a < 0.02) { guide.a = 0; guide.key = ''; guide.at = null; return; }
    const G = guide.at;
    if (!G) return;
    if (want && !guide.told) {
      guide.told = true;
      live.textContent = '파문이 닿으면 봉오리가 핍니다. 꾹 누르고 있으면 ㅇ 에 획이 붙어 ㆆ, ㅎ 이 되고 파문이 더 멀리 닿습니다. 떠 있는 글자도 파문을 맞으면 따라 울립니다.';
    }
    const tp = (now - guide.t0) % (PHASE + GAP);
    if (tp > PHASE) return;
    const fade = guide.a * easeOut(clamp01(tp / 250)) * (1 - clamp01((tp - (PHASE - 400)) / 400));
    const show = clamp01((tp - 500) / 400);
    const gap = Math.max(12, 0.15 * G.s);

    ctx.save();
    if (G.kind === 'flush') {
      if (fade > 0.3) guidePhase = '통함';
      if (!labelFont) labelFont = getComputedStyle(document.body).fontFamily;
      const px = Math.round(Math.max(15, 20 * Math.min(W / 600, H / 960)));
      ctx.font = `600 ${px}px ${labelFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.6 * guide.a;
      ctx.fillStyle = rgba(ink, 1);
      ctx.fillText('빈 곳을 눌러 흘려보내기', G.x, G.y);
      ctx.restore();
      return;
    }
    if (G.kind === 'press') {
      if (fade > 0.3) guidePhase = '가획';
      // 손끝이 누르면 작은 원이 퍼지고, 그 자리에 ㅇ 이 맺혀 ㆆ → ㅎ 으로 자람
      const t = clamp01(tp / 700);
      ctx.globalAlpha = 0.4 * fade * (1 - t);
      ctx.strokeStyle = rgba(ink, 1);
      ctx.lineWidth = Math.max(2, 3 * u);
      ctx.beginPath();
      ctx.arc(G.x, G.y, G.s * (0.1 + 0.5 * t), 0, TAU);
      ctx.stroke();
      // 누르고 있는 것처럼: ㅇ 이 부풀다가 (단단한 봉오리 앞이면) 획이 붙으며 뭉침
      const fake = { t0: now - Math.max(0, tp - 300) * (G.need === 1 ? 0.6 : G.need === 2 ? 1 : 1.7) };
      drawGlyph(partsOf(holdShape(fake, now), 0, 1, 1, []), G.x, G.y, G.s * holdScale(fake, now), 0.32 * fade * clamp01((tp - 250) / 250));
      label('꾹 누르기', G.x + G.s * 0.65 + gap, G.y, G.x - G.s * 0.65 - gap, 0.7 * fade * show);
    } else {
      if (fade > 0.3) guidePhase = '병서';
      // 옅은 ㅎ 이 옆에서 다가옴
      const k = reduce ? 1 : easeInOut(clamp01((tp - 300) / 1400));
      const x = G.x + G.side * G.s * lerp(1.5, 0.75, k);
      drawGlyph(partsOf(SHAPE['ㅎ'], 0, 1, 1, []), x, G.y, G.s, 0.32 * fade);
      label('옆에 ㅎ 하나 더', G.x + G.side * G.s * 1.5 + G.side * (G.s * 0.5 + gap), G.y,
        G.x - G.side * (G.s * 0.6 + gap), 0.7 * fade * show);
    }
    ctx.restore();
  }

  /* ---------- 저장: 떠 있는 글자·수련과 글자의 물결 무늬를 SVG 로 ---------- */
  function pondSVG(now) {
    const f = (v) => +v.toFixed(2);
    const g4 = (v) => +v.toFixed(4);
    const col = `rgb(${ink.join(',')})`;
    const bg = `rgb(${paper.join(',')})`;
    const out = [];
    const alive = letters.filter((L) => L.end === Infinity && !L.pull);
    for (const L of alive) {
      // 글자마다 제 세기만큼의 물결을 멈춘 모양으로: 닿는 거리 안에 (ㅇ 은 성기고 가깝게, ㅎ 은 촘촘하고 멀리)
      const o = WAVE[L.type];
      const R = REACH[L.type] * S0 * Math.sqrt(L.m);
      const n = o.n + 2 + Math.floor(L.m - 1);
      const step = (R - L.s * 0.62) / n;
      const centers = L.type === 'ㆅ' ? [-1, 1].map((sd) => L.x + sd * HH_X * L.s) : [L.x];
      for (const cx of centers) {
        for (let i = 0; i < n; i++) {
          const r = L.s * 0.62 + (i + 1) * step;
          const a = o.a * Math.pow(1 - i / n, 1.2);
          out.push(`  <circle cx="${f(cx)}" cy="${f(L.y)}" r="${f(r)}" fill="none" stroke="${col}" stroke-opacity="${a.toFixed(3)}" stroke-width="${f(Math.max(1, o.w * u) * (1 - 0.5 * i / n))}"/>`);
        }
      }
    }
    for (const b of buds) {
      if (b.end !== Infinity || now < b.born) continue;
      const k = b.open ? 1 : 0;
      const a1 = b.notch + NOTCH, a2 = b.notch - NOTCH;
      const pad = `<path d="M0 0L${g4(Math.cos(a1) * PAD_R)} ${g4(Math.sin(a1) * PAD_R)}A${PAD_R} ${PAD_R} 0 1 1 ${g4(Math.cos(a2) * PAD_R)} ${g4(Math.sin(a2) * PAD_R)}Z" fill="${bg}" stroke="${col}" stroke-opacity="0.32" stroke-width="0.028" stroke-linejoin="round"/>`;
      const sh = budShape(b, k);
      const petals = sh.petals.map((p) => `<path transform="rotate(${f((p.ang * 180) / Math.PI)})" d="M0 0Q${g4(p.w)} ${g4(-p.len * 0.55)} 0 ${g4(-p.len)}Q${g4(-p.w)} ${g4(-p.len * 0.55)} 0 0Z" fill="${bg}" stroke="${col}" stroke-opacity="${k ? 1 : 0.7}" stroke-width="0.035" stroke-linejoin="round"/>`).join('');
      const dot = sh.dot > 0.005 ? `<circle r="${g4(sh.dot)}" fill="${col}"/>` : '';
      out.push(`  <g transform="translate(${f(b.x)} ${f(b.y)}) scale(${f(b.s)}) rotate(${f((b.rot * 180) / Math.PI)})">${pad}${petals}${dot}</g>`);
    }
    for (const L of alive) {
      const parts = letterParts(L, now + CONV).map((p) => (p.e
        ? `<ellipse cx="${+p.cx.toFixed(4)}" cy="${+p.cy.toFixed(4)}" rx="${+p.rx.toFixed(4)}" ry="${+p.ry.toFixed(4)}" fill="none" stroke="${col}" stroke-width="${T}"/>`
        : `<rect x="${+p.x.toFixed(4)}" y="${+p.y.toFixed(4)}" width="${+p.w.toFixed(4)}" height="${+p.h.toFixed(4)}" fill="${col}"/>`)).join('');
      out.push(`  <g transform="translate(${f(L.x)} ${f(L.y)}) scale(${f(L.s)})">${parts}</g>`);
    }
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(W)} ${Math.round(H)}" width="${Math.round(W * 2)}" height="${Math.round(H * 2)}">`,
      `  <title>ㅇ 연못</title>`,
      `  <rect width="${Math.round(W)}" height="${Math.round(H)}" fill="${bg}"/>`,
      ...out,
      `</svg>`,
    ].join('\n');
  }

  document.getElementById('save-svg')?.addEventListener('click', () => {
    if (!pondOn()) return;
    // 내려받고 + 저장한 그림을 창에 띄워 바로 공유 (js/saved.js)
    window.saveImage(pondSVG(performance.now()), 'ㅇ연못', document.documentElement.lang === 'en' ? 'Pond of ㅇ' : 'ㅇ 연못');
  });

  /* ---------- 원판(js/penta.js)과 주고받는 것 ---------- */
  // 첫 파문이 퍼질 자리: 왼쪽 설명 칸을 피한 빈 곳의 가운데
  function home() {
    let left = 0;
    if (rulesEl && W > 700) { const r = rulesEl.getBoundingClientRect(); if (r.width) left = r.right + 24; }
    return { x: (left + W) / 2, y: H * 0.55, s: S0 * 1.6 };
  }

  window.hangulPond = {
    // 연못이 열림 → 가운데에 보이지 않는 ㅇ 하나가 떨어져 첫 파문 (가까운 봉오리 하나가 피어남)
    land() {
      const h = home();
      const now = performance.now();
      if (!buds.length) spawnBuds(now, h);
      // 이 ㅇ 은 그리지 않고 파문만 남김 (이미 가라앉은 것으로 둬서 다음 프레임에 빠짐)
      const L = addLetter(h.x, h.y, h.s, now);
      L.end = now - SINK * 2;
      recent = null;
      lastInput = now;
    },
    // 처음 상태로 (들어갈 때, 그리고 나온 뒤 연못이 다 사라지고 나서)
    reset() {
      letters.length = 0;
      buds.length = 0;
      rings.length = 0;
      drops.length = 0;
      done = null;
      dropped = 0;
      respawnAt = 0;
      gesture = null;
      recent = null;
      touched = false;
      wake = null;
      guide.a = 0; guide.key = ''; guide.at = null; guide.told = false;
      lastInput = performance.now() + 900;
      ruleHold = { name: '', until: 0 };
      shownRule = null;
      ruleEls.forEach((r) => r.classList.remove('is-active'));
    },
  };

  /* ---------- 매 프레임 ---------- */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.max(0, now - lastT);
    lastT = now;
    readColors();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (respawnAt && now >= respawnAt) {
      respawnAt = 0;
      spawnBuds(now);
      live.textContent = `새 봉오리 ${buds.length} 송이가 떠올랐습니다.`;
    }
    updatePulls(now);
    checkHits(now);

    const dark = isDark();
    drawRings(now, dark);
    drawDrops(now);
    // 잎은 물결 위, 글자는 잎 위
    for (let i = buds.length - 1; i >= 0; i--) if (!drawBud(buds[i], now)) buds.splice(i, 1);
    // 먼저 떨어진 글자부터 그려서 새 글자가 위에 오게, 다 가라앉은 글자는 뺌
    const gone = letters.filter((L) => !drawLetter(L, now));
    gone.forEach((L) => letters.splice(letters.indexOf(L), 1));
    drawHold(now);
    drawGuide(now, dt);
    updateRules(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
