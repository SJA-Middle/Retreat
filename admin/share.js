/* 선생님께 공유할 그림: 조 편성표 / 버스 배차표
   A4 세로(1240×1754, 150dpi) 쪽 단위로 그려서 PNG 여러 장 또는 PDF 한 개로 저장 */
(function () {
  // 옛 사파리(iOS 15 이하)용: roundRect가 없으면 직접 그린다
  if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { const a = Array.isArray(r) ? r : [r, r, r, r]; const [tl, tr, br, bl] = a.length === 4 ? a : [a[0], a[0], a[0], a[0]]; this.moveTo(x + tl, y); this.lineTo(x + w - tr, y); this.quadraticCurveTo(x + w, y, x + w, y + tr); this.lineTo(x + w, y + h - br); this.quadraticCurveTo(x + w, y + h, x + w - br, y + h); this.lineTo(x + bl, y + h); this.quadraticCurveTo(x, y + h, x, y + h - bl); this.lineTo(x, y + tl); this.quadraticCurveTo(x, y, x + tl, y); this.closePath(); };
  const W = 1240, H = 1754, P = 64;           // A4 세로 150dpi
  const FOOT = 96;                             // 쪽 아래 바닥글 높이
  const C = { night: '#17214A', night2: '#24336E', lantern: '#F4C14F', snow: '#F3F5FA', paper: '#FFFFFF', ink: '#1A2233', sub: '#586379', mist: '#98A1B5', line: '#E1E5EE',
    boy: '#3D64C2', boySoft: '#E7EDFA', girl: '#BC4A74', girlSoft: '#F9E8EF', pine: '#2E6E5C', alert: '#BE3D36' };
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
      f,
      t(s, X, Y, col, w, sz, fam, al) { f(w, sz, fam); x.fillStyle = col; x.textAlign = al || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; },
      w(s, w, sz, fam) { f(w, sz, fam); return x.measureText(s).width; },
      fit(s, max, w, sz, fam) { s = String(s); f(w, sz, fam); if (x.measureText(s).width <= max) return s; while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; },
      wrap(s, max, w, sz, fam) {
        f(w, sz, fam); const out = []; let cur = '';
        String(s).split(' ').forEach(word => {
          // 띄어쓰기 없이 긴 낱말은 글자 단위로 자른다
          while (x.measureText(word).width > max && word.length > 1) { let k = word.length; while (k > 1 && x.measureText(word.slice(0, k)).width > max) k--; if (cur) { out.push(cur); cur = ''; } out.push(word.slice(0, k)); word = word.slice(k); }
          const t = cur ? cur + ' ' + word : word; if (x.measureText(t).width > max && cur) { out.push(cur); cur = word; } else cur = t;
        });
        if (cur) out.push(cur); return out;
      },
      rr(X, Y, w, h, r, col) { x.fillStyle = col; x.beginPath(); x.roundRect(X, Y, w, h, r); x.fill(); },
    };
  }

  // 머리말 정보: 수련회 이름, 주제(줄마다), 날짜·장소
  function headInfo(D) {
    const c = D.cfg || {};
    const theme = String(c.theme || '').split('\n').map(s => s.trim()).filter(Boolean);
    return { title: c.title || '수련회', theme, meta: [c.dates, c.place].filter(Boolean).join('  ·  ') };
  }

  /** 첫 쪽 큰 머리말. 높이를 돌려준다 */
  function bigHeader(x, D, doc, stats, logos, draw, sub) {
    const p = pen(x), hi = headInfo(D);
    const LW = logos.reduce((t, i) => t + i.naturalWidth * 50 / i.naturalHeight + 22, 0);
    const TW = W - P * 2;
    let y = 12 + 52;
    // 오른쪽 위 로고
    if (draw) {
      let lx = W - P;
      logos.slice().reverse().forEach(i => { const w = i.naturalWidth * 50 / i.naturalHeight; lx -= w; x.drawImage(i, lx, y - 8, w, 50); lx -= 22; });
    }
    // 문서 이름 칩
    const cw = p.w(doc, 800, 30) + 44;
    if (draw) { p.rr(P, y - 6, cw, 54, 27, C.lantern); p.t(doc, P + 22, y + 31, C.night, 800, 30); }
    if (sub && draw) p.t(p.fit(sub, W - P * 2 - cw - LW - 30, 700, 26), P + cw + 16, y + 30, '#ffffffcc', 700, 26);
    y += 48 + 104;
    // 수련회 이름 (가장 크게)
    const tl = p.wrap(hi.title, TW, 400, 104, DISP);
    tl.forEach((l, i) => { if (draw) p.t(l, P, y + i * 112, '#fff', 400, 104, DISP); });
    y += (tl.length - 1) * 112;
    // 주제 (자르지 않고 줄바꿈)
    hi.theme.forEach((line, k) => {
      // 첫 줄(표어)은 등불색으로 크게, 다음 줄(주제 말씀)은 흰색으로
      const sz = k ? 32 : 40, col = k ? '#ffffffe6' : C.lantern, wt = k ? 600 : 800;
      p.wrap(line, TW, wt, sz).forEach(l => { y += k ? 48 : 58; if (draw) p.t(l, P, y, col, wt, sz); });
    });
    if (hi.meta) { y += 46; if (draw) p.t(p.fit(hi.meta, TW, 500, 28), P, y, '#ffffffb3', 500, 28); }
    y += 40;
    // 숫자 요약
    let sx = P;
    stats.forEach(s => {
      const w1 = p.w(s[0], 600, 24), w2 = p.w(s[1], 800, 40), bw = Math.max(w1, w2) + 48;
      if (draw) { p.rr(sx, y, bw, 104, 20, '#ffffff14'); p.t(s[0], sx + 24, y + 38, '#ffffffaa', 600, 24); p.t(s[1], sx + 24, y + 84, s[2] || '#fff', 800, 40); }
      sx += bw + 14;
    });
    y += 104 + 44;
    return y;
  }

  /** 둘째 쪽부터 쓰는 작은 머리말 */
  function smallHeader(x, D, doc, logos, draw) {
    const p = pen(x), hi = headInfo(D), h = 112;
    if (draw) {
      x.fillStyle = C.night; x.fillRect(0, 0, W, h); x.fillStyle = C.lantern; x.fillRect(0, 0, W, 10);
      let lx = W - P;
      logos.slice().reverse().forEach(i => { const w = i.naturalWidth * 40 / i.naturalHeight; lx -= w; x.drawImage(i, lx, 40, w, 40); lx -= 18; });
      const cw = p.w(doc, 800, 26) + 36;
      p.rr(P, 34, cw, 48, 24, C.lantern); p.t(doc, P + 18, 67, C.night, 800, 26);
      p.t(p.fit(hi.title, lx - P - cw - 40, 400, 44, DISP), P + cw + 18, 76, '#fff', 400, 44, DISP);
    }
    return h;
  }

  function footer(x, pg, n, note) {
    const p = pen(x), y = H - FOOT;
    x.fillStyle = C.line; x.fillRect(P, y + 6, W - P * 2, 2);
    p.t('새중앙교회 중등부', P, y + 52, C.ink, 800, 24);
    p.t(stamp() + (n > 1 ? '   ' + pg + ' / ' + n + '쪽' : ''), W - P, y + 52, C.sub, 500, 22, null, 'right');
    if (note && pg === n) p.t(note, P, y + 84, C.mist, 500, 20);
  }

  /**
   * 블록들을 A4 쪽에 나눠 담는다.
   * block = { h, draw(x, p, y) } · keep: 다음 블록과 같은 쪽에 두기
   */
  async function pages(D, doc, stats, blocks, note, sub) {
    const logos = (await Promise.all(['../sja-white.png', '../church-white.png'].map(img))).filter(Boolean);
    const m = document.createElement('canvas').getContext('2d');
    const head1 = bigHeader(m, D, doc, stats, logos, false, sub);
    const head2 = 112;
    const bottom = H - FOOT - 16;
    // 쪽 나누기
    const plan = []; let cur = [], y = head1 + 40;
    blocks.forEach((b, i) => {
      const need = b.h + (b.keep && blocks[i + 1] ? blocks[i + 1].h + 18 : 0);
      if (cur.length && y + Math.min(need, bottom - head2 - 40) > bottom) { plan.push(cur); cur = []; y = head2 + 36; }
      cur.push([b, y]); y += b.h + 18;
    });
    plan.push(cur);
    const n = plan.length, out = [];
    for (let i = 0; i < n; i++) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d'), p = pen(x);
      x.fillStyle = C.snow; x.fillRect(0, 0, W, H);
      if (i === 0) {
        x.fillStyle = C.night; x.fillRect(0, 0, W, head1); x.fillStyle = C.lantern; x.fillRect(0, 0, W, 12);
        bigHeader(x, D, doc, stats, logos, true, sub);
      } else smallHeader(x, D, doc, logos, true);
      plan[i].forEach(([b, yy]) => b.draw(x, p, yy));
      footer(x, i + 1, n, note);
      out.push(cv);
    }
    return out;
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
    const CW = (W - P * 2 - 28) / 2, ROW = 46;
    const cardH = r => 112 + Math.ceil(Math.max(1, (mem[r.no] || []).length) / 2) * ROW + 20;
    await fonts(D.act.map(p => p.name + info(p)).join('') + D.rooms.map(r => r.name + r.teacher).join('') + JSON.stringify(headInfo(D)) + '조 편성표여학생남학생호차담당명기준새중앙교회중등부쪽희망친구같은다른' + (opt.sub || ''));
    const stats = [['학생', D.act.length + '명'], ['조', D.rooms.length + '개'], ['여학생', D.act.filter(p => p.gender === '여').length + '명', '#F5B8CE'], ['남학생', D.act.filter(p => p.gender === '남').length + '명', '#B5C8F5']];
    if (opt.extra) stats.push(...opt.extra);

    const card = (x, p, r, X, y, h) => {
      const m = mem[r.no] || [];
      p.rr(X, y, CW, h, 22, C.paper);
      x.save(); x.beginPath(); x.roundRect(X, y, CW, h, 22); x.clip(); x.fillStyle = gc(r.gender); x.fillRect(X, y, CW, 8); x.restore();
      const nw = p.w(String(r.no), 400, 62, DISP);
      p.t(String(r.no), X + 24, y + 80, gc(r.gender), 400, 62, DISP);
      p.t('조', X + 28 + nw, y + 80, gc(r.gender), 800, 26);
      const ix = X + 28 + nw + 44;
      let rx = X + CW - 22;
      const cnt = m.length + '/' + r.cap + '명';
      p.t(cnt, rx, y + 50, m.length > r.cap ? C.alert : C.sub, 700, 23, null, 'right'); rx -= p.w(cnt, 700, 23) + 12;
      if (busOf[r.no]) { const bt = busOf[r.no] + '호차', bw = p.w(bt, 800, 21) + 24; p.rr(rx - bw, y + 26, bw, 34, 17, C.night); p.t(bt, rx - 12, y + 50, '#fff', 800, 21, null, 'right'); rx -= bw + 10; }
      p.t(p.fit(r.name || '숙소 미정', rx - ix - 6, 800, 29), ix, y + 52, C.ink, 800, 29);
      const tn = r.teacher ? '담당 ' + r.teacher + (late(r) ? ' (후발)' : '') : '담당 미정';
      p.t(p.fit(tn, X + CW - 22 - ix, 600, 22), ix, y + 86, late(r) ? C.alert : C.sub, 600, 22);
      x.fillStyle = C.line; x.fillRect(X + 22, y + 106, CW - 44, 2);
      const half = (CW - 44) / 2;
      if (!m.length) p.t('아직 아무도 없어요', X + 24, y + 106 + 38, C.mist, 500, 23);
      m.forEach((s, j) => {
        const cx = X + 24 + (j % 2) * half, cy = y + 106 + 38 + Math.floor(j / 2) * ROW;
        let ox = 0;
        if (opt.wish) { const col = s.wk && s.wk.length ? (s.wh && s.wh.length ? C.pine : '#D9822B') : null; if (col) { x.fillStyle = col; x.beginPath(); x.arc(cx + 6, cy - 9, 6, 0, 7); x.fill(); } ox = 18; }
        const nm = p.fit(s.name, half - 20 - ox, 700, 28);
        p.t(nm, cx + ox, cy, C.ink, 700, 28);
        const w = p.w(nm, 700, 28) + 8 + ox;
        p.t(p.fit(info(s), half - w - 12, 500, 18), cx + w, cy - 2, C.sub, 500, 18);
      });
    };

    const blocks = [];
    blocks.push({ h: 44, keep: 1, draw(x, p, y) { ['여', '남'].forEach((g, i) => { const X = P + i * (CW + 28); p.rr(X, y + 4, 14, 34, 7, gc(g)); p.t(g === '여' ? '여학생' : '남학생', X + 26, y + 34, C.ink, 800, 31); p.t(cols[i].length + '개 조', X + CW, y + 34, C.sub, 600, 23, null, 'right'); }); } });
    if (opt.wish) blocks.push({ h: 34, keep: 1, draw(x, p, y) { [[C.pine, '희망 친구와 같은 조'], ['#D9822B', '희망 친구와 다른 조']].reduce((X, [c, t]) => { x.fillStyle = c; x.beginPath(); x.arc(X + 7, y + 17, 7, 0, 7); x.fill(); p.t(t, X + 22, y + 25, C.sub, 600, 22); return X + 40 + p.w(t, 600, 22); }, P); } });
    const n = Math.max(cols[0].length, cols[1].length);
    for (let i = 0; i < n; i++) {
      const a = cols[0][i], b = cols[1][i];
      const h = Math.max(a ? cardH(a) : 0, b ? cardH(b) : 0);
      blocks.push({ h, draw(x, p, y) { if (a) card(x, p, a, P, y, h); if (b) card(x, p, b, P + CW + 28, y, h); } });
    }
    if (none.length) {
      const m = document.createElement('canvas').getContext('2d');
      const lines = pen(m).wrap(none.map(s => s.name + '(' + s.gender + ')').join(', '), W - P * 2 - 48, 600, 25);
      blocks.push({ h: 76 + lines.length * 38, draw(x, p, y) { p.rr(P, y, W - P * 2, 76 + lines.length * 38, 22, C.paper); p.t('조 미배정 ' + none.length + '명', P + 24, y + 50, C.alert, 800, 27); lines.forEach((l, i) => p.t(l, P + 24, y + 90 + i * 38, C.ink, 600, 25)); } });
    }
    return pages(D, '조 편성표', stats, blocks, opt.note || '조 편성은 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.', opt.sub);
  }

  // ───── 버스 배차표 ─────
  async function buses(D) {
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
    await fonts(D.act.map(p => p.name).join('') + (D.tAct || []).map(t => t.name + t.arrive).join('') + JSON.stringify(headInfo(D)) + '버스 배차표호차석명조담당선생님학생함께타는미배정자리없음버스를타지않는기준쪽');
    const staffSeat = Number(c.staff) || 0;
    const stats = [['버스', BS.length + '대'], ['좌석', (Number(c.seats) || 45) + '인승'], ['탑승', total + '명'], ['학생', D.act.length + '명']];
    const IX = P + 200, IW = W - P - 28 - IX;
    const mp = pen(document.createElement('canvas').getContext('2d'));

    const busBlocks = b => {
      const out = [];
      b.rooms.forEach(no => {
        const r = rmap[no] || { no, gender: '', name: '', teacher: '' }, m = mem[no] || [];
        const lead = tBy[r.tid], cov = tBy[r.cid];
        const who = onBus(lead) ? lead.name + ' 선생님' : onBus(cov) ? cov.name + ' 선생님 (대신 맡음)' : '';
        const miss = who ? '' : lead ? '담당 ' + lead.name + ' 선생님 ' + (lead.arrive === main ? '따로 이동' : '후발') : (r.teacher ? '담당 ' + r.teacher + ' 선생님' : '담당 미정');
        const lines = mp.wrap(m.map(s => s.name).join('  '), IW, 500, 25);
        out.push({ r, m, who, miss, lines, h: 50 + lines.length * 36 + 18 });
      });
      if ((b.solo || []).length) { const names = b.solo.map(id => (byId[id] || {}).name).filter(Boolean); const lines = mp.wrap(names.join('  '), IW, 500, 25); out.push({ solo: names.length, lines, h: 50 + lines.length * 36 + 18 }); }
      if ((b.staff || []).length) { const names = b.staff.map(id => (tBy[id] || {}).name).filter(Boolean); const lines = mp.wrap(names.join(' · '), IW, 600, 25); out.push({ staff: names.length, lines, h: 50 + lines.length * 36 + 18 }); }
      return out;
    };

    const blocks = [];
    blocks.push({ h: 34, keep: 1, draw(x, p, y) { p.t('조와 담당 선생님은 같은 버스에 타요' + (staffSeat ? ' · 버스마다 스태프석 ' + staffSeat + '석' : ''), P, y + 26, C.sub, 600, 24); } });
    BS.forEach(b => {
      const bl = busBlocks(b);
      const h = Math.max(230, 30 + bl.reduce((t, q) => t + q.h, 0) + 12);
      blocks.push({ h, draw(x, p, y) {
        p.rr(P, y, W - P * 2, h, 24, C.paper);
        x.save(); x.beginPath(); x.roundRect(P, y, 176, h, [24, 0, 0, 24]); x.clip(); x.fillStyle = C.night; x.fillRect(P, y, 176, h); x.restore();
        p.t(String(b.no), P + 88, y + 108, '#fff', 400, 92, DISP, 'center');
        p.t('호차', P + 88, y + 148, '#ffffffcc', 700, 26, null, 'center');
        p.t(b.used + '/' + seat, P + 88, y + 196, b.used > seat ? '#FF9A93' : C.lantern, 800, 28, null, 'center');
        p.rr(P + 30, y + 210, 116, 8, 4, '#ffffff26');
        p.rr(P + 30, y + 210, Math.max(8, 116 * Math.min(1, b.used / seat)), 8, 4, b.used > seat ? '#FF9A93' : C.lantern);
        let yy = y + 30;
        bl.forEach((q, i) => {
          if (i) { x.fillStyle = C.line; x.fillRect(IX, yy - 6, IW, 2); }
          if (q.r) {
            const g = q.r.gender, chip = q.r.no + '조', cw = p.w(chip, 800, 25) + 26;
            p.rr(IX, yy + 4, cw, 38, 19, gs(g)); p.t(chip, IX + 13, yy + 32, gc(g), 800, 25);
            const meta = [q.r.name, q.who || q.miss, '학생 ' + q.m.length + '명'].filter(Boolean).join('  ·  ');
            p.t(p.fit(meta, IW - cw - 14, 600, 24), IX + cw + 14, yy + 32, q.who ? C.sub : C.alert, 600, 24);
          } else {
            p.t(q.solo ? '조 미배정 학생 ' + q.solo + '명' : '함께 타는 선생님 ' + q.staff + '명', IX, yy + 32, q.solo ? C.alert : C.pine, 800, 25);
          }
          q.lines.forEach((l, j) => p.t(l, IX, yy + 80 + j * 36, C.ink, q.staff ? 600 : 500, 25));
          yy += q.h;
        });
      } });
    });
    if (nLeft) {
      const names = lf.rooms.map(n => n + '조').concat(lf.solo.map(id => (byId[id] || {}).name).filter(Boolean), lf.staff.map(id => ((tBy[id] || {}).name || '') + ' 선생님'));
      const lines = mp.wrap(names.join(', '), W - P * 2 - 48, 600, 26);
      const h = 76 + lines.length * 40;
      blocks.push({ h, draw(x, p, y) { p.rr(P, y, W - P * 2, h, 22, C.paper); p.t('버스 자리가 없어요 ' + nLeft + '건', P + 24, y + 50, C.alert, 800, 28); lines.forEach((l, i) => p.t(l, P + 24, y + 92 + i * 40, C.ink, 600, 26)); } });
    }
    if (off.length) {
      const groups = {};
      off.forEach(t => { const key = t.arrive === main ? (t.move || '따로 이동') : String(t.arrive || '').replace(/부터 참석$/, ' 합류'); (groups[key] = groups[key] || []).push(t.name); });
      const rows = Object.keys(groups).map(kk => ({ kk, lines: mp.wrap(groups[kk].join(' · '), W - P * 2 - 48, 600, 25) }));
      const h = 84 + rows.reduce((t, r) => t + 44 + r.lines.length * 36 + 8, 0);
      blocks.push({ h, draw(x, p, y) {
        p.rr(P, y, W - P * 2, h, 22, C.paper);
        p.t('버스를 타지 않는 선생님 ' + off.length + '명', P + 24, y + 52, C.ink, 800, 28);
        let yy = y + 84;
        rows.forEach(r => { p.t(r.kk + ' (' + groups[r.kk].length + '명)', P + 24, yy + 30, C.sub, 700, 23); r.lines.forEach((l, j) => p.t(l, P + 24, yy + 70 + j * 36, C.ink, 600, 25)); yy += 44 + r.lines.length * 36 + 8; });
      } });
    }
    return pages(D, '버스 배차표', stats, blocks, '배차는 조 편성에 따라 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.');
  }

  // ───── 저장 형식 ─────
  const png = cv => new Promise(res => cv.toBlob(res, 'image/png'));
  const jpg = cv => new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92));

  /** A4 쪽 그림들을 PDF 한 개로 (JPEG를 그대로 넣는 간단한 PDF) */
  async function pdf(canvases) {
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const push = b => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
    const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
    const n = canvases.length, PW = 595.28, PH = 841.89;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const kids = []; for (let i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>'));
    for (let i = 0; i < n; i++) {
      const pg = 3 + i * 3, im = pg + 1, ct = pg + 2;
      const data = new Uint8Array(await (await jpg(canvases[i])).arrayBuffer());
      obj(pg, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im' + i + ' ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>'));
      obj(im, () => { push('<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + data.length + ' >>\nstream\n'); push(data); push('\nendstream'); });
      const cs = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im' + i + ' Do Q';
      obj(ct, () => push('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream'));
    }
    const total = 3 + n * 3, xref = len;
    let t = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let i = 1; i < total; i++) t += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(t + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }

  window.shareImage = { rooms, buses, png, pdf, A4: { W, H } };
})();
