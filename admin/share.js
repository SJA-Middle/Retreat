/* 선생님께 공유할 이미지: 조 편성표 / 버스 배차표 (캔버스로 그려서 PNG로 저장) */
(function () {
  // 옛 사파리(iOS 15 이하)용: roundRect가 없으면 직접 그린다
  if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { const a = Array.isArray(r) ? r : [r, r, r, r]; const [tl, tr, br, bl] = a.length === 4 ? a : [a[0], a[0], a[0], a[0]]; this.moveTo(x + tl, y); this.lineTo(x + w - tr, y); this.quadraticCurveTo(x + w, y, x + w, y + tr); this.lineTo(x + w, y + h - br); this.quadraticCurveTo(x + w, y + h, x + w - br, y + h); this.lineTo(x + bl, y + h); this.quadraticCurveTo(x, y + h, x, y + h - bl); this.lineTo(x, y + tl); this.quadraticCurveTo(x, y, x + tl, y); this.closePath(); };
  const W = 1080, P = 48;
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

  /** 그리기 도구: 높이를 먼저 재고(measure) 한 번 더 그린다 */
  function pen(x) {
    const f = (w, s, fam) => { x.font = w + ' ' + s + 'px ' + (fam || BODY); };
    return {
      f,
      t(s, X, Y, col, w, sz, fam, al) { f(w, sz, fam); x.fillStyle = col; x.textAlign = al || 'left'; x.fillText(s, X, Y); x.textAlign = 'left'; },
      w(s, w, sz, fam) { f(w, sz, fam); return x.measureText(s).width; },
      fit(s, max, w, sz, fam) { f(w, sz, fam); if (x.measureText(s).width <= max) return s; while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; },
      wrap(s, max, w, sz, fam) { f(w, sz, fam); const out = []; let cur = ''; String(s).split(' ').forEach(word => { const t = cur ? cur + ' ' + word : word; if (x.measureText(t).width > max && cur) { out.push(cur); cur = word; } else cur = t; }); if (cur) out.push(cur); return out; },
      rr(X, Y, w, h, r, col) { x.fillStyle = col; x.beginPath(); x.roundRect(X, Y, w, h, r); x.fill(); },
    };
  }

  async function header(x, k, D, title, stats, draw) {
    const p = pen(x), c = D.cfg || {};
    const logos = (await Promise.all(['../sja-white.png', '../church-white.png'].map(img))).filter(Boolean);
    let y = 56;
    if (draw) {
      x.fillStyle = C.night; x.fillRect(0, 0, W, k.headH);
      // 위쪽 등불색 띠: 수련회 앱과 같은 색
      x.fillStyle = C.lantern; x.fillRect(0, 0, W, 10);
      let lx = P; const lh = 64;
      logos.forEach(i => { const w = i.naturalWidth * lh / i.naturalHeight; x.drawImage(i, lx, y, w, lh); lx += w + 28; });
    }
    y += 64 + 46;
    if (draw) p.t(c.title || '수련회', P, y, '#ffffffcc', 600, 30);
    y += 24 + 76;
    if (draw) p.t(title, P, y, '#fff', 400, 92, DISP);
    y += 30;
    const theme = String(c.theme || '').split('\n')[0].trim();
    const lines = [theme, [c.dates, c.place].filter(Boolean).join('  ·  ')].filter(Boolean);
    lines.forEach(l => { y += 42; if (draw) p.t(p.fit(l, W - P * 2, 500, 28), P, y, '#ffffffb3', 500, 28); });
    y += 40;
    // 숫자 요약
    let sx = P;
    stats.forEach(s => {
      const w1 = p.w(s[0], 600, 24), w2 = p.w(s[1], 800, 40), bw = Math.max(w1, w2) + 44;
      if (draw) { p.rr(sx, y, bw, 104, 20, '#ffffff14'); p.t(s[0], sx + 22, y + 38, '#ffffffaa', 600, 24); p.t(s[1], sx + 22, y + 84, s[2] || '#fff', 800, 40); }
      sx += bw + 14;
    });
    y += 104 + 44;
    if (!draw) k.headH = y;
    return y + 44;
  }

  function footer(x, y, draw, note) {
    const p = pen(x);
    y += 20;
    if (draw) { x.fillStyle = C.line; x.fillRect(P, y, W - P * 2, 2); }
    y += 52;
    if (draw) { p.t('새중앙교회 중등부', P, y, C.ink, 800, 26); p.t(stamp(), W - P, y, C.sub, 500, 24, null, 'right'); }
    if (note) { y += 40; if (draw) p.t(note, P, y, C.mist, 500, 22); }
    return y + 48;
  }

  // ───── 조 편성표 ─────
  async function rooms(D) {
    const mem = {};
    D.act.forEach(p => { if (p.room) (mem[p.room] = mem[p.room] || []).push(p); });
    Object.keys(mem).forEach(k => mem[k].sort((a, b) => String(a.grade).localeCompare(String(b.grade)) || a.name.localeCompare(b.name, 'ko')));
    const busOf = {}; ((D.rep || {}).buses || []).forEach(b => b.rooms.forEach(no => busOf[no] = b.no));
    const tBy = D.tById || {};
    const late = r => { const t = tBy[r.tid]; return t && D.rep && D.rep.main && t.arrive !== D.rep.main; };
    const cols = ['여', '남'].map(g => D.rooms.filter(r => r.gender === g).sort((a, b) => cmpNo(a.no, b.no)));
    const none = D.act.filter(p => !p.room || !D.rooms.some(r => String(r.no) === String(p.room)));
    const CW = (W - P * 2 - 24) / 2, ROW = 48;
    const cardH = r => 112 + Math.ceil(Math.max(1, (mem[r.no] || []).length) / 2) * ROW + 22;
    const text = D.act.map(p => p.name + info(p)).join('') + D.rooms.map(r => r.name + r.teacher).join('') + '조 편성표여학생남학생호차담당명기준새중앙교회중등부';
    await fonts(text);
    const stats = [['학생', D.act.length + '명'], ['조', D.rooms.length + '개'], ['여학생', D.act.filter(p => p.gender === '여').length + '명', '#F5B8CE'], ['남학생', D.act.filter(p => p.gender === '남').length + '명', '#B5C8F5']];

    const paint = async (x, draw, k) => {
      const p = pen(x);
      let y = await header(x, k, D, '조 편성표', stats, draw);
      if (draw) { x.fillStyle = C.snow; x.fillRect(0, k.headH, W, k.H - k.headH); }
      // 열 제목
      ['여', '남'].forEach((g, i) => { const X = P + i * (CW + 24); if (draw) { p.rr(X, y, 14, 34, 7, gc(g)); p.t(g === '여' ? '여학생' : '남학생', X + 26, y + 30, C.ink, 800, 32); p.t(cols[i].length + '개 조', X + CW, y + 30, C.sub, 600, 24, null, 'right'); } });
      y += 58;
      const n = Math.max(cols[0].length, cols[1].length);
      for (let i = 0; i < n; i++) {
        const h = Math.max(cols[0][i] ? cardH(cols[0][i]) : 0, cols[1][i] ? cardH(cols[1][i]) : 0);
        cols.forEach((col, ci) => {
          const r = col[i]; if (!r || !draw) return;
          const X = P + ci * (CW + 24), m = mem[r.no] || [];
          p.rr(X, y, CW, h, 22, C.paper);
          x.save(); x.beginPath(); x.roundRect(X, y, CW, h, 22); x.clip(); x.fillStyle = gc(r.gender); x.fillRect(X, y, CW, 8); x.restore();
          // 조 번호
          const nw = p.w(String(r.no), 400, 64, DISP);
          p.t(String(r.no), X + 24, y + 80, gc(r.gender), 400, 64, DISP);
          p.t('조', X + 28 + nw, y + 80, gc(r.gender), 800, 26);
          const ix = X + 28 + nw + 46;
          // 버스·인원
          let rx = X + CW - 22;
          const cnt = m.length + '명';
          p.t(cnt, rx, y + 50, C.sub, 700, 24, null, 'right'); rx -= p.w(cnt, 700, 24) + 12;
          if (busOf[r.no]) { const bt = busOf[r.no] + '호차', bw = p.w(bt, 800, 22) + 24; p.rr(rx - bw, y + 26, bw, 34, 17, C.night); p.t(bt, rx - 12, y + 50, '#fff', 800, 22, null, 'right'); rx -= bw + 10; }
          p.t(p.fit(r.name || '숙소 미정', rx - ix - 6, 800, 30), ix, y + 52, C.ink, 800, 30);
          const tn = r.teacher ? '담당 ' + r.teacher + (late(r) ? ' (후발)' : '') : '담당 미정';
          p.t(p.fit(tn, X + CW - 22 - ix, 600, 23), ix, y + 86, late(r) ? C.alert : C.sub, 600, 23);
          x.fillStyle = C.line; x.fillRect(X + 22, y + 106, CW - 44, 2);
          // 명단: 두 줄씩
          const half = (CW - 44) / 2;
          if (!m.length) p.t('아직 아무도 없어요', X + 24, y + 106 + 38, C.mist, 500, 24);
          m.forEach((s, j) => {
            const cx = X + 24 + (j % 2) * half, cy = y + 106 + 38 + Math.floor(j / 2) * ROW;
            const nm = p.fit(s.name, half - 20, 700, 29);
            p.t(nm, cx, cy, C.ink, 700, 29);
            const w = p.w(nm, 700, 29) + 8;
            p.t(p.fit(info(s), half - w - 12, 500, 19), cx + w, cy - 2, C.sub, 500, 19);
          });
        });
        y += h + 18;
      }
      if (none.length) {
        const lines = p.wrap(none.map(s => s.name + '(' + s.gender + ')').join(', '), W - P * 2 - 48, 600, 26);
        const h = 76 + lines.length * 40;
        if (draw) { p.rr(P, y, W - P * 2, h, 22, C.paper); p.t('조 미배정 ' + none.length + '명', P + 24, y + 50, C.alert, 800, 28); lines.forEach((l, i) => p.t(l, P + 24, y + 92 + i * 40, C.ink, 600, 26)); }
        y += h + 18;
      }
      return footer(x, y, draw, '조 편성은 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.');
    };
    return render(paint);
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
    const text = D.act.map(p => p.name).join('') + (D.tAct || []).map(t => t.name + t.arrive).join('') + '버스 배차표호차석명조담당선생님학생함께타는미배정자리없음버스를타지않는기준';
    await fonts(text);
    const staffSeat = Number(c.staff) || 0;
    const stats = [['버스', BS.length + '대'], ['좌석', (Number(c.seats) || 45) + '인승'], ['탑승', total + '명'], ['학생', D.act.length + '명']];
    const IX = P + 200, IW = W - P - 28 - IX;

    const busBlocks = (p, b) => {
      const out = [];
      b.rooms.forEach(no => {
        const r = rmap[no] || { no, gender: '', name: '', teacher: '' }, m = mem[no] || [];
        const lead = tBy[r.tid], cov = tBy[r.cid];
        const who = onBus(lead) ? lead.name + ' 선생님' : onBus(cov) ? cov.name + ' 선생님 (대신 맡음)' : '';
        const miss = who ? '' : lead ? '담당 ' + lead.name + ' 선생님 ' + (lead.arrive === main ? '따로 이동' : '후발') : (r.teacher ? '담당 ' + r.teacher + ' 선생님' : '담당 미정');
        const lines = p.wrap(m.map(s => s.name).join('  '), IW, 500, 25);
        out.push({ r, m, who, miss, lines, h: 50 + lines.length * 36 + 18 });
      });
      if ((b.solo || []).length) { const names = b.solo.map(id => (byId[id] || {}).name).filter(Boolean); const lines = p.wrap(names.join('  '), IW, 500, 25); out.push({ solo: names.length, lines, h: 50 + lines.length * 36 + 18 }); }
      if ((b.staff || []).length) { const names = b.staff.map(id => (tBy[id] || {}).name).filter(Boolean); const lines = p.wrap(names.join(' · '), IW, 600, 25); out.push({ staff: names.length, lines, h: 50 + lines.length * 36 + 18 }); }
      return out;
    };

    const paint = async (x, draw, k) => {
      const p = pen(x);
      let y = await header(x, k, D, '버스 배차표', stats, draw);
      if (draw) { x.fillStyle = C.snow; x.fillRect(0, k.headH, W, k.H - k.headH); }
      if (draw) p.t('조와 담당 선생님은 같은 버스에 타요' + (staffSeat ? ' · 버스마다 스태프석 ' + staffSeat + '석' : ''), P, y + 6, C.sub, 600, 24);
      y += 34;
      BS.forEach(b => {
        const bl = busBlocks(p, b);
        const h = Math.max(230, 30 + bl.reduce((t, q) => t + q.h, 0) + 12);
        if (draw) {
          p.rr(P, y, W - P * 2, h, 24, C.paper);
          // 왼쪽: 호차 번호와 좌석
          x.save(); x.beginPath(); x.roundRect(P, y, 176, h, [24, 0, 0, 24]); x.clip(); x.fillStyle = C.night; x.fillRect(P, y, 176, h); x.restore();
          p.t(String(b.no), P + 88, y + 108, '#fff', 400, 92, DISP, 'center');
          p.t('호차', P + 88, y + 148, '#ffffffcc', 700, 26, null, 'center');
          const used = b.used + '/' + seat;
          p.t(used, P + 88, y + 196, b.used > seat ? '#FF9A93' : C.lantern, 800, 28, null, 'center');
          p.rr(P + 30, y + 210, 116, 8, 4, '#ffffff26');
          p.rr(P + 30, y + 210, Math.max(8, 116 * Math.min(1, b.used / seat)), 8, 4, b.used > seat ? '#FF9A93' : C.lantern);
          // 오른쪽: 조별
          let yy = y + 30;
          bl.forEach((q, i) => {
            if (i) { x.fillStyle = C.line; x.fillRect(IX, yy - 6, IW, 2); }
            if (q.r) {
              const g = q.r.gender, chip = q.r.no + '조', cw = p.w(chip, 800, 25) + 26;
              p.rr(IX, yy + 4, cw, 38, 19, gs(g)); p.t(chip, IX + 13, yy + 32, gc(g), 800, 25);
              const meta = [q.r.name, q.who || q.miss, '학생 ' + q.m.length + '명'].filter(Boolean).join('  ·  ');
              p.t(p.fit(meta, IW - cw - 14, 600, 24), IX + cw + 14, yy + 32, q.who ? C.sub : C.alert, 600, 24);
            } else {
              const lab = q.solo ? '조 미배정 학생 ' + q.solo + '명' : '함께 타는 선생님 ' + q.staff + '명';
              p.t(lab, IX, yy + 32, q.solo ? C.alert : C.pine, 800, 25);
            }
            q.lines.forEach((l, j) => p.t(l, IX, yy + 50 + 30 + j * 36, C.ink, q.staff ? 600 : 500, 25));
            yy += q.h;
          });
        }
        y += h + 18;
      });
      if (nLeft) {
        const names = lf.rooms.map(n => n + '조').concat(lf.solo.map(id => (byId[id] || {}).name).filter(Boolean), lf.staff.map(id => ((tBy[id] || {}).name || '') + ' 선생님'));
        const lines = p.wrap(names.join(', '), W - P * 2 - 48, 600, 26);
        const h = 76 + lines.length * 40;
        if (draw) { p.rr(P, y, W - P * 2, h, 22, C.paper); p.t('버스 자리가 없어요 ' + nLeft + '건', P + 24, y + 50, C.alert, 800, 28); lines.forEach((l, i) => p.t(l, P + 24, y + 92 + i * 40, C.ink, 600, 26)); }
        y += h + 18;
      }
      if (off.length) {
        const groups = {};
        off.forEach(t => { const key = t.arrive === main ? (t.move || '따로 이동') : String(t.arrive || '').replace(/부터 참석$/, ' 합류'); (groups[key] = groups[key] || []).push(t.name); });
        const rows = Object.keys(groups).map(kk => ({ kk, lines: p.wrap(groups[kk].join(' · '), W - P * 2 - 48, 600, 25) }));
        const h = 84 + rows.reduce((t, r) => t + 44 + r.lines.length * 36 + 8, 0);
        if (draw) {
          p.rr(P, y, W - P * 2, h, 22, C.paper);
          p.t('버스를 타지 않는 선생님 ' + off.length + '명', P + 24, y + 52, C.ink, 800, 28);
          let yy = y + 84;
          rows.forEach(r => { p.t(r.kk + ' (' + groups[r.kk].length + '명)', P + 24, yy + 30, C.sub, 700, 23); r.lines.forEach((l, j) => p.t(l, P + 24, yy + 30 + 40 + j * 36, C.ink, 600, 25)); yy += 44 + r.lines.length * 36 + 8; });
        }
        y += h + 18;
      }
      return footer(x, y, draw, '배차는 조 편성에 따라 바뀔 수 있어요. 최신 내용은 운영 앱에서 확인해 주세요.');
    };
    return render(paint);
  }

  async function render(paint) {
    const m = document.createElement('canvas').getContext('2d');
    const k = { headH: 0, H: 0 };
    // 1차: 높이 재기 (헤더 높이도 함께)
    k.H = await paint(m, false, k);
    const cv = document.createElement('canvas');
    const S = 1;
    cv.width = W * S; cv.height = Math.ceil(k.H * S);
    const x = cv.getContext('2d'); x.scale(S, S);
    x.fillStyle = C.snow; x.fillRect(0, 0, W, k.H);
    await paint(x, true, k);
    return new Promise(res => cv.toBlob(res, 'image/png'));
  }

  window.shareImage = { rooms, buses };
})();
