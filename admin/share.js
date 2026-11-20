/* 선생님께 공유·인쇄할 자료: 조 편성표 / 버스 배차표
   A4 세로(1240×1754px, 약 150dpi) 여러 쪽으로 그려서 PNG 묶음 또는 PDF로 저장한다 */
(function () {
  // 옛 사파리(iOS 15 이하)용: roundRect가 없으면 직접 그린다
  if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { const a = Array.isArray(r) ? r : [r, r, r, r]; const [tl, tr, br, bl] = a.length === 4 ? a : [a[0], a[0], a[0], a[0]]; this.moveTo(x + tl, y); this.lineTo(x + w - tr, y); this.quadraticCurveTo(x + w, y, x + w, y + tr); this.lineTo(x + w, y + h - br); this.quadraticCurveTo(x + w, y + h, x + w - br, y + h); this.lineTo(x + bl, y + h); this.quadraticCurveTo(x, y + h, x, y + h - bl); this.lineTo(x, y + tl); this.quadraticCurveTo(x, y, x + tl, y); this.closePath(); };
  const W = 1240, H = 1754, M = 72;           // A4 세로, 바깥 여백
  const IW = W - M * 2, FOOT = 64;            // 본문 폭, 바닥글 높이
  const C = { night: '#17214A', lantern: '#E9A93A', ink: '#1A2233', sub: '#586379', mist: '#98A1B5', line: '#DDE2EC', soft: '#F4F6FA',
    boy: '#3D64C2', boySoft: '#E9EFFB', girl: '#BC4A74', girlSoft: '#FAEAF0', pine: '#2E6E5C', alert: '#BE3D36' };
  const BODY = "'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', sans-serif", DISP = "'Black Han Sans', " + BODY;
  const gc = g => g === '여' ? C.girl : C.boy, gs = g => g === '여' ? C.girlSoft : C.boySoft;
  const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const grade = p => { const g = String(p.grade || '').replace('학년', ''); return g ? '중' + g : ''; };
  const dept = p => p.dept === '타교회' ? (p.church || '타교회') : String(p.dept || '').replace(/^3부\s*\(?열린예배\)?$/, '열린예배');
  const info = p => [grade(p), dept(p)].filter(Boolean).join(' · ');
  const cmpNo = (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || String(a).localeCompare(String(b));
  const stamp = () => { const d = new Date(); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일(' + '일월화수목금토'[d.getDay()] + ') ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' 기준'; };

  async function fonts(text) {
    try {
      await Promise.all(["400 80px 'Black Han Sans'", "400 30px 'Pretendard Variable'", "600 30px 'Pretendard Variable'", "800 30px 'Pretendard Variable'"].map(f => document.fonts.load(f, text)));
      await document.fonts.ready;
    } catch (e) { }
  }

  function pen(x) {
    const f = (w, s, fam) => { x.font = w + ' ' + s + 'px ' + (fam || BODY); };
    return {
      t(s, X, Y, col, w, sz, fam, al) { f(w, sz, fam); x.fillStyle = col; x.textAlign = al || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; },
      w(s, w, sz, fam) { f(w, sz, fam); return x.measureText(s).width; },
      fit(s, max, w, sz, fam) { s = String(s); f(w, sz, fam); if (x.measureText(s).width <= max) return s; while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; },
      wrap(s, max, w, sz, fam) { f(w, sz, fam); const out = []; let cur = ''; String(s).split(' ').forEach(word => { const t = cur ? cur + ' ' + word : word; if (x.measureText(t).width > max && cur) { out.push(cur); cur = word; } else cur = t; }); if (cur) out.push(cur); return out; },
      rr(X, Y, w, h, r, col) { x.fillStyle = col; x.beginPath(); x.roundRect(X, Y, w, h, r); x.fill(); },
      line(X, Y, w, col, h) { x.fillStyle = col; x.fillRect(X, Y, w, h || 2); },
    };
  }

  /** 첫 쪽 머리: 왼쪽에 수련회 이름·주제·일시, 오른쪽에 교회·중등부 로고, 아래에 문서 제목 띠 */
  function firstHead(x, D, logos, title, stats) {
    const p = pen(x), c = D.cfg || {};
    let y = M;
    // 오른쪽 로고 (색 로고, 오른쪽 정렬)
    const lh = 56; let rx = W - M;
    logos.slice().reverse().forEach(i => { const w = i.naturalWidth * lh / i.naturalHeight; rx -= w; x.drawImage(i, rx, y, w, lh); rx -= 26; });
    // 왼쪽 글: 수련회 이름을 크게
    p.t(c.title || '수련회', M, y + 70, C.night, 400, 72, DISP);
    y += 70;
    const th = String(c.theme || '').split('\n').map(s => s.trim()).filter(Boolean);
    th.forEach((l, i) => { y += i ? 40 : 52; p.t(p.fit(l, IW, i ? 600 : 800, i ? 28 : 32), M, y, i ? C.sub : C.ink, i ? 600 : 800, i ? 28 : 32); });
    const when = [c.dates, c.place].filter(Boolean).join('   ·   ');
    if (when) { y += 44; p.t(p.fit(when, IW, 500, 24), M, y, C.sub, 500, 24); }
    y += 34;
    // 문서 제목 띠
    p.rr(M, y, IW, 84, 18, C.night);
    p.t(title, M + 30, y + 58, '#fff', 400, 44, DISP);
    let sx = W - M - 28;
    stats.slice().reverse().forEach(s => {
      const v = s[1], w2 = p.w(v, 800, 30), w1 = p.w(s[0], 600, 20);
      p.t(v, sx, y + 56, s[2] || '#fff', 800, 30, null, 'right'); p.t(s[0], sx - w2 - 8, y + 54, '#ffffffb0', 600, 20, null, 'right');
      sx -= w2 + w1 + 34;
    });
    return y + 84 + 26;
  }
  /** 둘째 쪽부터: 얇은 머리 */
  function contHead(x, D, title) {
    const p = pen(x), c = D.cfg || {};
    p.t((c.title || '수련회') + '  ' + title, M, M + 34, C.night, 400, 32, DISP);
    p.t('(이어서)', W - M, M + 32, C.mist, 600, 22, null, 'right');
    p.line(M, M + 52, IW, C.night, 3);
    return M + 52 + 30;
  }
  function foot(x, pg, n, note) {
    const p = pen(x), y = H - M + 8;
    p.line(M, y - 40, IW, C.line, 2);
    p.t('새중앙교회 드림공동체 중등부', M, y, C.ink, 800, 20);
    const right = stamp() + '   ' + pg + ' / ' + n, rw = p.w(right, 600, 20);
    if (note) p.t(p.fit(note, IW - 300 - rw - 24, 500, 18), M + 300, y, C.mist, 500, 18);
    p.t(right, W - M, y, C.sub, 600, 20, null, 'right');
  }

  /**
   * 블록을 A4 쪽에 차례로 담는다. 블록 = { h, draw(x, y) }. 쪽이 넘치면 다음 쪽으로.
   * top(x, y, pageIndex) 는 쪽마다 본문 맨 위에 그릴 것(열 제목 등)을 그리고 다음 y를 돌려준다.
   */
  async function paginate(D, title, stats, blocks, opt) {
    const logos = (await Promise.all(['../church.png', '../jungdeung.png'].map(img))).filter(Boolean);
    const m = document.createElement('canvas').getContext('2d');
    const head0 = firstHead(m, D, logos, title, stats), head1 = contHead(m, D, title);
    const topH = opt.topH || 0, limit = H - M - FOOT;
    const pages = []; let cur = null, y = 0;
    const start = () => { cur = []; pages.push(cur); y = (pages.length === 1 ? head0 : head1) + topH; };
    start();
    blocks.forEach(b => {
      if (y + b.h > limit && cur.length) start();
      cur.push({ b, y }); y += b.h + (b.gap == null ? 16 : b.gap);
    });
    return pages.map((items, i) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      const yy = i === 0 ? firstHead(x, D, logos, title, stats) : contHead(x, D, title);
      if (opt.top) opt.top(x, yy);
      items.forEach(it => it.b.draw(x, it.y));
      foot(x, i + 1, pages.length, opt.note);
      return cv;
    });
  }

  // ───── 조 편성표 ─────
  async function rooms(D, opt) {
    opt = opt || {};
    const mem = {};
    D.act.forEach(p => { if (p.room) (mem[p.room] = mem[p.room] || []).push(p); });
    Object.keys(mem).forEach(k => mem[k].sort((a, b) => String(a.grade).localeCompare(String(b.grade)) || a.name.localeCompare(b.name, 'ko')));
    const busOf = {}; ((D.rep || {}).buses || []).forEach(b => b.rooms.forEach(no => busOf[no] = b.no));
    const tBy = D.tById || {};
    const late = r => { const t = tBy[r.tid]; return t && D.rep && D.rep.main && t.arrive !== D.rep.main; };
    const cols = ['여', '남'].map(g => D.rooms.filter(r => r.gender === g).sort((a, b) => cmpNo(a.no, b.no)));
    const none = D.act.filter(p => !p.room || !D.rooms.some(r => String(r.no) === String(p.room)));
    const GAP = 24, CW = (IW - GAP) / 2, ROW = 40;
    const cardH = r => 94 + Math.ceil(Math.max(1, (mem[r.no] || []).length) / 2) * ROW + 12;
    await fonts(D.act.map(p => p.name + info(p)).join('') + D.rooms.map(r => r.name + r.teacher).join('') + (D.cfg.title || '') + (D.cfg.theme || '') + '조 편성표시안여학생남학생호차담당명기준새중앙교회드림공동체중등부이어서후발미정아직아무도없어요');
    const stats = [['학생', D.act.length + '명'], ['조', D.rooms.length + '개'], ['여', D.act.filter(p => p.gender === '여').length + '명', '#F7BFD3'], ['남', D.act.filter(p => p.gender === '남').length + '명', '#BACBF6']];
    if (opt.label) stats.unshift(['안', opt.label, '#F4C14F']);

    const card = (x, r, X, y, h) => {
      const p = pen(x), m = mem[r.no] || [];
      p.rr(X, y, CW, h, 16, '#fff');
      x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.roundRect(X + 1, y + 1, CW - 2, h - 2, 16); x.stroke();
      x.save(); x.beginPath(); x.roundRect(X, y, CW, h, 16); x.clip(); x.fillStyle = gc(r.gender); x.fillRect(X, y, 10, h); x.restore();
      const nw = p.w(String(r.no), 400, 56, DISP);
      p.t(String(r.no), X + 30, y + 66, gc(r.gender), 400, 56, DISP);
      p.t('조', X + 34 + nw, y + 66, gc(r.gender), 800, 24);
      const ix = X + 34 + nw + 44;
      let rx = X + CW - 22;
      const cnt = m.length + '명';
      p.t(cnt, rx, y + 42, C.sub, 700, 22, null, 'right'); rx -= p.w(cnt, 700, 22) + 12;
      if (busOf[r.no]) { const bt = busOf[r.no] + '호차', bw = p.w(bt, 800, 20) + 22; p.rr(rx - bw, y + 18, bw, 32, 16, C.night); p.t(bt, rx - 11, y + 41, '#fff', 800, 20, null, 'right'); rx -= bw + 10; }
      p.t(p.fit(r.name || '숙소 미정', rx - ix - 6, 800, 28), ix, y + 42, C.ink, 800, 28);
      const tn = r.teacher ? '담당 ' + r.teacher + ' 선생님' + (late(r) ? ' (후발)' : '') : '담당 미정';
      p.t(p.fit(tn, X + CW - 22 - ix, 600, 21), ix, y + 74, late(r) ? C.alert : C.sub, 600, 21);
      p.line(X + 26, y + 88, CW - 48, C.line, 2);
      const half = (CW - 52) / 2;
      if (!m.length) p.t('아직 아무도 없어요', X + 30, y + 88 + 34, C.mist, 500, 22);
      m.forEach((s, j) => {
        const cx = X + 30 + (j % 2) * half, cy = y + 88 + 34 + Math.floor(j / 2) * ROW;
        const nm = p.fit(s.name, half - 24, 700, 27);
        p.t(nm, cx, cy, C.ink, 700, 27);
        const w = p.w(nm, 700, 27) + 8;
        p.t(p.fit(info(s), half - w - 14, 500, 18), cx + w, cy - 2, C.sub, 500, 18);
      });
    };
    const blocks = [];
    const n = Math.max(cols[0].length, cols[1].length);
    for (let i = 0; i < n; i++) {
      const a = cols[0][i], b = cols[1][i];
      const h = Math.max(a ? cardH(a) : 0, b ? cardH(b) : 0);
      blocks.push({ h, gap: 14, draw: (x, y) => { if (a) card(x, a, M, y, h); if (b) card(x, b, M + CW + GAP, y, h); } });
    }
    if (none.length) {
      const m = document.createElement('canvas').getContext('2d');
      const lines = pen(m).wrap(none.map(s => s.name + '(' + s.gender + ')').join(', '), IW - 48, 600, 24);
      blocks.push({ h: 70 + lines.length * 36, draw: (x, y) => { const p = pen(x); p.rr(M, y, IW, 70 + lines.length * 36, 16, C.soft); p.t('조 미배정 ' + none.length + '명', M + 24, y + 44, C.alert, 800, 26); lines.forEach((l, i) => p.t(l, M + 24, y + 84 + i * 36, C.ink, 600, 24)); } });
    }
    const top = (x, y) => {
      const p = pen(x);
      ['여', '남'].forEach((g, i) => { const X = M + i * (CW + GAP); p.rr(X, y - 30, 10, 30, 5, gc(g)); p.t(g === '여' ? '여학생' : '남학생', X + 20, y - 6, C.ink, 800, 26); p.t(cols[i].length + '개 조', X + CW, y - 6, C.sub, 600, 20, null, 'right'); });
    };
    return paginate(D, opt.title || '조 편성표', stats, blocks, { top: (x, y) => top(x, y + 30), topH: 52, note: opt.note || '조 편성은 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.' });
  }

  // ───── 버스 배차표 ─────
  async function buses(D, opt) {
    opt = opt || {};
    const rep = D.rep || {}, c = D.cfg || {}, tBy = D.tById || {}, byId = D.byId || {};
    const rmap = {}; D.rooms.forEach(r => rmap[r.no] = r);
    const mem = {}; D.act.forEach(p => { if (p.room) (mem[p.room] = mem[p.room] || []).push(p); });
    Object.keys(mem).forEach(k => mem[k].sort((a, b) => a.name.localeCompare(b.name, 'ko')));
    const main = rep.main;
    const onBus = t => t && t.arrive === main && t.move === '버스';
    const seat = rep.seat || 45;
    const BS = rep.buses || [];
    const total = BS.reduce((t, b) => t + b.used, 0);
    const off = (D.tAct || []).filter(t => !onBus(t));
    const lf = rep.busLeft || { rooms: [], solo: [], staff: [] };
    const nLeft = lf.rooms.length + lf.solo.length + lf.staff.length;
    await fonts(D.act.map(p => p.name).join('') + (D.tAct || []).map(t => t.name + t.arrive).join('') + (c.title || '') + (c.theme || '') + '버스 배차표호차석명조담당선생님학생함께타는미배정자리없음버스를타지않는기준새중앙교회드림공동체중등부이어서따로이동후발합류대신맡음');
    const staffSeat = Number(c.staff) || 0;
    const stats = [['버스', BS.length + '대'], ['좌석', (Number(c.seats) || 45) + '인승'], ['탑승', total + '명']];
    const LW = 170, IX = M + LW + 28, RW = W - M - 24 - IX;
    const m = pen(document.createElement('canvas').getContext('2d'));

    const busBlocks = b => {
      const out = [];
      b.rooms.forEach(no => {
        const r = rmap[no] || { no, gender: '', name: '', teacher: '' }, ms = mem[no] || [];
        const lead = tBy[r.tid], cov = tBy[r.cid];
        const who = onBus(lead) ? lead.name + ' 선생님' : onBus(cov) ? cov.name + ' 선생님 (대신 맡음)' : '';
        const miss = who ? '' : lead ? '담당 ' + lead.name + ' 선생님 ' + (lead.arrive === main ? '따로 이동' : '후발') : (r.teacher ? '담당 ' + r.teacher + ' 선생님' : '담당 미정');
        const lines = m.wrap(ms.map(s => s.name).join('  '), RW, 500, 23);
        out.push({ r, m: ms, who, miss, lines, h: 44 + lines.length * 31 + 12 });
      });
      if ((b.solo || []).length) { const names = b.solo.map(id => (byId[id] || {}).name).filter(Boolean); const lines = m.wrap(names.join('  '), RW, 500, 23); out.push({ solo: names.length, lines, h: 44 + lines.length * 31 + 12 }); }
      if ((b.staff || []).length) { const names = b.staff.map(id => (tBy[id] || {}).name).filter(Boolean); const lines = m.wrap(names.join(' · '), RW, 600, 23); out.push({ staff: names.length, lines, h: 44 + lines.length * 31 + 12 }); }
      return out;
    };
    const blocks = BS.map(b => {
      const bl = busBlocks(b);
      const h = Math.max(220, 22 + bl.reduce((t, q) => t + q.h, 0) + 6);
      return { h, draw: (x, y) => {
        const p = pen(x);
        p.rr(M, y, IW, h, 18, '#fff');
        x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.roundRect(M + 1, y + 1, IW - 2, h - 2, 18); x.stroke();
        x.save(); x.beginPath(); x.roundRect(M, y, LW, h, [18, 0, 0, 18]); x.clip(); x.fillStyle = C.night; x.fillRect(M, y, LW, h); x.restore();
        p.t(String(b.no), M + LW / 2, y + 100, '#fff', 400, 84, DISP, 'center');
        p.t('호차', M + LW / 2, y + 140, '#ffffffcc', 700, 24, null, 'center');
        const over = b.used > seat;
        p.t(b.used + '/' + seat + '석', M + LW / 2, y + 184, over ? '#FF9A93' : '#F4C14F', 800, 24, null, 'center');
        p.rr(M + 28, y + 198, LW - 56, 8, 4, '#ffffff30');
        p.rr(M + 28, y + 198, Math.max(8, (LW - 56) * Math.min(1, b.used / seat)), 8, 4, over ? '#FF9A93' : '#F4C14F');
        let yy = y + 22;
        bl.forEach((q, i) => {
          if (i) p.line(IX, yy - 6, RW, C.line, 2);
          if (q.r) {
            const g = q.r.gender, chip = q.r.no + '조', cw = p.w(chip, 800, 23) + 24;
            p.rr(IX, yy + 4, cw, 36, 18, gs(g)); p.t(chip, IX + 12, yy + 30, gc(g), 800, 23);
            const meta = [q.r.name, q.who || q.miss, '학생 ' + q.m.length + '명'].filter(Boolean).join('  ·  ');
            p.t(p.fit(meta, RW - cw - 14, 600, 22), IX + cw + 14, yy + 30, q.who ? C.sub : C.alert, 600, 22);
          } else {
            p.t(q.solo ? '조 미배정 학생 ' + q.solo + '명' : '함께 타는 선생님 ' + q.staff + '명', IX, yy + 30, q.solo ? C.alert : C.pine, 800, 23);
          }
          q.lines.forEach((l, j) => p.t(l, IX, yy + 44 + 26 + j * 31, C.ink, q.staff ? 600 : 500, 23));
          yy += q.h;
        });
      } };
    });
    const box = (ttl, col, rows) => {
      // rows: [[소제목, 줄 배열]]
      const h = 74 + rows.reduce((t, r) => t + (r[0] ? 38 : 0) + r[1].length * 34 + 10, 0);
      return { h, draw: (x, y) => {
        const p = pen(x);
        p.rr(M, y, IW, h, 18, C.soft);
        p.t(ttl, M + 26, y + 46, col, 800, 26);
        let yy = y + 74;
        rows.forEach(r => { if (r[0]) { p.t(r[0], M + 26, yy + 24, C.sub, 700, 21); yy += 38; } r[1].forEach((l, j) => p.t(l, M + 26, yy + 24 + j * 34, C.ink, 600, 23)); yy += r[1].length * 34 + 10; });
      } };
    };
    if (nLeft) {
      const names = lf.rooms.map(n => n + '조').concat(lf.solo.map(id => (byId[id] || {}).name).filter(Boolean), lf.staff.map(id => ((tBy[id] || {}).name || '') + ' 선생님'));
      blocks.push(box('버스 자리가 없어요 ' + nLeft + '건', C.alert, [['', m.wrap(names.join(', '), IW - 52, 600, 23)]]));
    }
    if (off.length) {
      const groups = {};
      off.forEach(t => { const key = t.arrive === main ? (t.move || '따로 이동') : String(t.arrive || '').replace(/부터 참석$/, ' 합류'); (groups[key] = groups[key] || []).push(t.name); });
      blocks.push(box('버스를 타지 않는 선생님 ' + off.length + '명', C.ink, Object.keys(groups).map(k => [k + ' (' + groups[k].length + '명)', m.wrap(groups[k].join(' · '), IW - 52, 600, 23)])));
    }
    const top = (x, y) => { pen(x).t('조와 담당 선생님은 같은 버스에 타요' + (staffSeat ? ' · 버스마다 스태프석 ' + staffSeat + '석' : ''), M, y + 4, C.sub, 600, 21); };
    return paginate(D, '버스 배차표', stats, blocks, { top, topH: 30, note: opt.note || '배차는 조 편성에 따라 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.' });
  }

  /** 쪽 캔버스 → PNG 파일들 */
  async function toPngs(pages, base) {
    const out = [];
    for (let i = 0; i < pages.length; i++) {
      const b = await new Promise(res => pages[i].toBlob(res, 'image/png'));
      out.push(new File([b], base + (pages.length > 1 ? '_' + (i + 1) + '쪽' : '') + '.png', { type: 'image/png' }));
    }
    return out;
  }
  /** 쪽 캔버스 → A4 PDF 한 파일 (jsPDF는 처음 쓸 때만 불러온다) */
  let pdfLoad = null;
  async function toPdf(pages, base) {
    if (!window.jspdf) {
      pdfLoad = pdfLoad || new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload = res; s.onerror = () => { pdfLoad = null; rej(new Error('PDF 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.')); }; document.head.appendChild(s); });
      await pdfLoad;
    }
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    pages.forEach((cv, i) => { if (i) doc.addPage(); doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297); });
    return new File([doc.output('blob')], base + '.pdf', { type: 'application/pdf' });
  }

  window.shareImage = { rooms, buses, toPngs, toPdf };
})();
