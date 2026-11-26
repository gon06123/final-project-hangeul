/* 원판 화면 아래 가운데: About project · Share (Language 는 js/lang.js) */
(() => {
  const live = document.getElementById('live');
  const say = (m) => { if (live) live.textContent = m; };

  /* ---------- About project: 소개 창 ---------- */
  const about = document.getElementById('about');
  const openBtn = document.getElementById('open-about');
  if (about && openBtn) {
    // 나타나는 순서: 왼쪽 그림이 그려지고, 제목은 획 긋기, 나머지 글은 한 덩이씩 왼쪽부터 드러남 (css/consonant.css)
    // 제목: 획 긋기 — 글자 윤곽선이 붓으로 쓰듯 그어진 뒤 안쪽이 먹처럼 차오름.
    // 글자마다 SVG <text> 로 옮겨 그 윤곽선(stroke)에 선 긋기 애니메이션을 줌 (css/consonant.css 의 .title-ch)
    const title = about.querySelector('.about-title');
    const STEP_MS = 110; // 글자 사이 시차
    let titleBuilt = false;
    // 창이 열린 뒤(보이는 상태에서) 부름: 한 줄 <text> 로 먼저 써서 브라우저가 놓은 글자 자리를 그대로 읽고,
    // 그 자리에 글자마다 따로 <text> 를 놓음 (자간·글꼴이 HTML 제목과 똑같음)
    function buildTitle() {
      if (!title || titleBuilt) return;
      titleBuilt = true;
      const text = title.textContent;
      const chars = [...text];
      const cs = getComputedStyle(title);
      const FS = 100; // SVG 안 글자 크기 (단위). 화면 크기는 em 으로 맞춤
      const ls = (parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)) * FS || 0; // 자간 (px → 단위)
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      const probe = document.createElementNS(NS, 'text');
      probe.setAttribute('class', 'title-ch');
      probe.setAttribute('font-size', FS);
      probe.textContent = text;
      svg.append(probe);
      title.setAttribute('aria-label', text);
      title.textContent = '';
      title.append(svg);
      // 자간은 글자 자리를 잴 때 반영되지 않아서, 잰 자리에 직접 더함 (i 번째 글자는 자간 × i 만큼 당김)
      const xs = chars.map((_, i) => probe.getStartPositionOfChar(i).x + ls * i);
      const box = probe.getBBox();
      probe.remove();
      const pad = 4; // 위·아래·오른쪽: 윤곽선 굵기만큼 여유
      const w = box.width + ls * (chars.length - 1);
      // 왼쪽은 여유 없이 첫 글자의 실제 잉크 왼쪽 끝에서 시작 → 아래 본문 첫 글자와 세로로 맞음.
      // 글꼴 글자 칸에는 잉크 앞 빈틈(사이드 베어링)이 있어서, 캔버스로 첫 글자의 잉크 시작을 잼
      const c = document.createElement('canvas').getContext('2d');
      c.font = `${cs.fontWeight} ${FS}px ${cs.fontFamily}`;
      const inkLeft = -c.measureText(chars[0]).actualBoundingBoxLeft || 0; // 글자 자리에서 잉크가 시작하는 곳
      const sw = 0.7; // 윤곽선 반 굵기 (.title-ch stroke-width 1.4 의 반)
      const x0 = xs[0] + inkLeft - sw;
      const x1 = box.x + w + pad;
      svg.setAttribute('viewBox', `${x0} ${box.y - pad} ${x1 - x0} ${box.height + pad * 2}`);
      svg.style.width = `${(x1 - x0) / FS}em`;
      let n = 0;
      chars.forEach((ch, i) => {
        if (ch === ' ') { n++; return; } // 띄어쓰기에서 한 박자 쉼
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'title-ch');
        t.setAttribute('x', xs[i]);
        t.setAttribute('y', 0);
        t.setAttribute('font-size', FS);
        t.style.setProperty('--i', n++);
        t.textContent = ch;
        svg.append(t);
      });
      // 본문은 제목 글자가 거의 다 그어질 무렵부터
      about.style.setProperty('--title-ms', `${n * STEP_MS + 500}ms`);
    }
    // 말을 바꾸면 js/lang.js 가 제목을 새 글로 바꿔 둠 → 다음에 열 때 획 긋기 제목을 다시 만듦
    document.addEventListener('langchange', () => {
      if (!title) return;
      titleBuilt = false;
      title.removeAttribute('aria-label');
    });
    about.querySelectorAll('.about-body > p, .about-list li').forEach((el, i) => {
      el.classList.add('about-wipe');
      el.style.setProperty('--i', i);
    });

    openBtn.addEventListener('click', () => {
      about.classList.remove('is-closing');
      if (typeof about.showModal === 'function') about.showModal();
      else about.setAttribute('open', '');
      buildTitle(); // 보이는 상태에서 글자 자리를 재야 해서 연 직후 (처음 한 번만)
    });
    // 닫기: 화면 어디를 눌러도, 또는 Esc. 스르르 사라진 뒤 닫힘
    let closing = 0;
    const close = () => {
      if (!about.open || closing) return;
      about.classList.add('is-closing');
      closing = setTimeout(() => {
        closing = 0;
        about.classList.remove('is-closing');
        if (about.close) about.close(); else about.removeAttribute('open');
      }, 260);
    };
    about.addEventListener('click', () => { if (!getSelection().toString()) close(); }); // 글을 긁어 고르는 중이면 닫지 않음
    about.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    about.addEventListener('close', () => openBtn.focus({ preventScroll: true }));
  }

  /* ---------- Share: 위에 작은 검은 창, SNS 이름을 누르면 그 SNS 의 공유 화면이 새 탭으로 ---------- */
  const shareBtn = document.getElementById('share');
  const menu = document.getElementById('share-menu');
  if (shareBtn && menu) {
    const url = location.href.split('#')[0];
    const text = '한글의 철학 — 획을 긋고 돌리며 만져 보는 한글의 원리';
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    const LINKS = {
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      threads: `https://www.threads.net/intent/post?text=${t}%20${u}`,
      line: `https://social-plugins.line.me/lineit/share?url=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      email: `mailto:?subject=${encodeURIComponent('한글의 철학')}&body=${t}%0A${u}`,
    };
    menu.querySelectorAll('a[data-sns]').forEach((a) => { a.href = LINKS[a.dataset.sns]; });
    const items = () => [...menu.querySelectorAll('[role="menuitem"]')];

    const setOpen = (on, focusFirst = false) => {
      menu.hidden = !on;
      shareBtn.setAttribute('aria-expanded', String(on));
      if (on && focusFirst) items()[0].focus();
    };
    // 버튼식: Share 를 누르면 열리고, 창 바깥을 누르거나 항목을 고르거나 Esc 로 닫힘
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menu.hidden, e.detail === 0); // 키보드로 열면 첫 항목에 초점
    });

    // 링크를 복사하고 그 항목 글자로 잠깐 알림
    const copyLink = (item, okText) => new Promise((resolve) => {
      const label = item.textContent;
      const done = (ok) => {
        item.textContent = ok ? okText : 'Copy failed';
        say(ok ? '링크를 복사했습니다.' : '링크를 복사하지 못했습니다.');
        setTimeout(() => { item.textContent = label; resolve(ok); }, 1100);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
      else done(false);
    });
    // 휴대폰·태블릿이면 기기 공유 창으로 (인스타그램·카카오톡 앱이 그 안에 나옴).
    // 윈도 크롬·엣지도 공유 창이 있지만 PC 에서는 링크 복사가 더 자연스러워서 터치 기기에서만 씀
    const systemShare = async () => {
      if (!navigator.share || !matchMedia('(pointer: coarse)').matches) return false;
      try { await navigator.share({ title: document.title, text, url }); } catch { /* 취소 */ }
      return true;
    };

    // 카카오톡: 카카오 개발자 사이트(developers.kakao.com)에서 받은 JavaScript 키를 넣으면
    // 카카오톡 공유 창이 바로 열림. 비워 두면 기기 공유 창 또는 링크 복사로 대신함
    const KAKAO_KEY = '';
    let kakaoReady = null;
    const loadKakao = () => kakaoReady || (kakaoReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => { try { if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY); resolve(window.Kakao); } catch (err) { reject(err); } };
      s.onerror = reject;
      document.head.append(s);
    }));

    const SPECIAL = {
      async instagram(item) {
        // 인스타그램은 웹에서 바로 공유하는 주소가 없음 → 기기 공유 창, 없으면 링크 복사 후 인스타그램 열기
        if (await systemShare()) return;
        const copied = copyLink(item, 'Link copied');
        window.open('https://www.instagram.com/', '_blank', 'noopener'); // 누른 직후에 열어야 팝업 차단에 안 걸림
        await copied;
      },
      async kakao(item) {
        if (KAKAO_KEY) {
          try {
            const Kakao = await loadKakao();
            Kakao.Share.sendScrap({ requestUrl: url });
            return;
          } catch { /* 키·도메인 설정이 맞지 않으면 아래로 */ }
        }
        if (await systemShare()) return;
        await copyLink(item, 'Link copied');
      },
    };
    // Esc: 마우스로 연 뒤(초점이 창 밖에 있어도) 닫힘
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); shareBtn.focus({ preventScroll: true }); }
    });
    // 창 바깥을 누르거나, 항목을 고르면 닫힘
    document.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== shareBtn) setOpen(false);
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[role="menuitem"]');
      if (!item) return;
      const sns = item.dataset.sns;
      if (sns === 'copy') { copyLink(item, 'Copied').then(() => setOpen(false)); return; }
      if (SPECIAL[sns]) { SPECIAL[sns](item).then(() => setOpen(false)); return; }
      setOpen(false);
    });
    // 키보드: Esc 로 닫고, 위·아래 방향키로 항목 이동
    menu.addEventListener('keydown', (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); shareBtn.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    });
  }
})();
