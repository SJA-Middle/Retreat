// ── 접수증 이미지 저장 ──
// 화면의 접수증을 그대로 그림(PNG)으로 그려서 사진첩에 저장하거나 내려받게 한다
const ticketImg = { data: null };
function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
async function drawTicket(t) {
  try { await document.fonts.ready; } catch (e) { }
  const S = 2, W = 420, P = 24, IW = W - P * 2;
  const disp = "'Black Han Sans', 'Pretendard Variable', sans-serif", body = "'Pretendard Variable', Pretendard, -apple-system, sans-serif";
  const cv = document.createElement('canvas'), x = cv.getContext('2d');
  const font = (w, s, f) => { x.font = w + ' ' + s + 'px ' + (f || body); };
  const wrap = (txt, maxW) => {
    const out = []; let line = '';
    for (const ch of String(txt)) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
    if (line) out.push(line);
    return out;
  };
  const ops = []; let y = 0;
  // 머리
  const head = () => {
    const h0 = y; y += 24;
    font(400, 13); ops.push(['t', t.label, P, y + 13, '#ffffffaa', 400, 13]); y += 22;
    font(400, 30, disp); wrap(t.title, IW).forEach(l => { ops.push(['t', l, P, y + 30, '#fff', 400, 30, disp]); y += 35; });
    y += 4;
    t.when.forEach(([k, v]) => {
      font(400, 14); const kw = x.measureText(k).width + 8;
      wrap(v, IW - kw).forEach((l, i) => { if (!i) ops.push(['t', k, P, y + 15, '#ffffff88', 400, 14]); ops.push(['t', l, P + kw, y + 15, '#ffffffdd', 400, 14]); y += 24; });
    });
    y += 22;
    ops.unshift(['head', h0, y]);
  };
  head();
  const cutY = y; y += 22;
  // 큰 글씨(접수 번호 또는 이름)
  y += 6;
  font(400, 52, disp);
  ops.push(['t', t.bigLabel, P, y + 44, '#586379', 400, 14]);
  ops.push(['tr', t.big, W - P, y + 48, '#17214A', 400, 52, disp]);
  y += 66;
  // 항목
  t.rows.forEach(([k, v]) => {
    font(600, 15); const ls = wrap(v, IW - 98);
    ops.push(['t', k, P, y + 16, '#586379', 400, 15]);
    ls.forEach(l => { ops.push(['t', l, P + 98, y + 16, '#1A2233', 600, 15]); y += 24; });
    y += 4;
  });
  // 회비 안내
  if (t.pay.length) {
    y += 14; const p0 = y; y += 12;
    t.pay.forEach(([txt, b]) => { font(b ? 700 : 400, 14); wrap(txt, IW - 28).forEach(l => { ops.push(['t', l, P + 14, y + 15, '#6B4B00', b ? 700 : 400, 14]); y += 22; }); });
    y += 12; ops.push(['pay', p0, y]);
  }
  // 교회 로고: 흰 카드 안 맨 아래에 넣어 로고 바탕(흰색)과 어울리게
  const logos = (await Promise.all(t.logos.map(loadImg))).filter(Boolean);
  const lh = 30; let lineY = 0, logoY = 0;
  if (logos.length) { y += 22; lineY = y; y += 18; logoY = y; y += lh + 20; } else y += 22;
  const bodyEnd = y;
  const M = 16, H = y;
  cv.width = (W + M * 2) * S; cv.height = (H + M * 2) * S; x.scale(S, S);
  x.fillStyle = '#EEF1F7'; x.fillRect(0, 0, W + M * 2, H + M * 2);
  x.translate(M, M);
  const rr = (x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r[0], y0); x.lineTo(x0 + w - r[1], y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r[1]); x.lineTo(x0 + w, y0 + h - r[2]); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r[2], y0 + h); x.lineTo(x0 + r[3], y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r[3]); x.lineTo(x0, y0 + r[0]); x.quadraticCurveTo(x0, y0, x0 + r[0], y0); x.closePath(); };
  // 카드 몸통
  x.fillStyle = '#fff'; rr(0, 0, W, bodyEnd, [22, 22, 22, 22]); x.fill();
  ops.forEach(o => {
    if (o[0] === 'head') { x.fillStyle = t.color; rr(0, o[1], W, o[2] - o[1], [22, 22, 0, 0]); x.fill(); }
    else if (o[0] === 'pay') { x.fillStyle = '#FDF6E3'; rr(P, o[1], IW, o[2] - o[1], [12, 12, 12, 12]); x.fill(); }
  });
  // 절취선
  x.fillStyle = '#EEF1F7';
  x.beginPath(); x.arc(0, cutY + 11, 11, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(W, cutY + 11, 11, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#E1E5EE'; x.lineWidth = 2; x.setLineDash([6, 5]);
  x.beginPath(); x.moveTo(18, cutY + 11); x.lineTo(W - 18, cutY + 11); x.stroke(); x.setLineDash([]);
  ops.forEach(o => {
    if (o[0] !== 't' && o[0] !== 'tr') return;
    font(o[5], o[6], o[7]); x.fillStyle = o[4]; x.textAlign = o[0] === 'tr' ? 'right' : 'left'; x.fillText(o[1], o[2], o[3]);
  });
  x.textAlign = 'left';
  // 로고 (가운데 정렬)
  if (logos.length) {
    x.strokeStyle = '#E1E5EE'; x.lineWidth = 1; x.beginPath(); x.moveTo(P, lineY); x.lineTo(W - P, lineY); x.stroke();
    const ws = logos.map(i => i.naturalWidth * lh / i.naturalHeight), gap = 18;
    let lx = (W - ws.reduce((a, b) => a + b, 0) - gap * (ws.length - 1)) / 2;
    logos.forEach((i, k) => { x.drawImage(i, lx, logoY, ws[k], lh); lx += ws[k] + gap; });
  }
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function saveTicket() {
  const btn = $('#saveT'); if (!ticketImg.data || !btn) return;
  btn.disabled = true; const old = btn.textContent; btn.textContent = '접수증 만드는 중…';
  try {
    const blob = await drawTicket(ticketImg.data);
    if (!blob) throw new Error('접수증 그림을 만들지 못했어요.');
    const name = '수련회_접수증_' + ticketImg.data.file + '.png';
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    showTicketImg(blob, name);
  } catch (e) { toast(e.message || '저장하지 못했어요. 화면을 캡처해 주세요.'); }
  finally { btn.disabled = false; btn.textContent = old; }
}
// 공유가 안 되는 브라우저(카카오톡 등): 그림을 띄워 길게 눌러 저장하게 하고, 내려받기 링크도 준다
function showTicketImg(blob, name) {
  const url = URL.createObjectURL(blob);
  const w = document.createElement('div'); w.className = 'tkimg';
  w.innerHTML = '<div class="in"><p><b>접수증 그림이에요.</b><br>그림을 길게 눌러 <b>사진 앱에 저장</b>해 주세요.</p><img alt="접수증" src="' + url + '">' +
    '<a class="btn block" download="' + esc(name) + '" href="' + url + '">파일로 내려받기</a><button class="btn light block" type="button">닫기</button></div>';
  document.body.appendChild(w);
  w.querySelector('button').onclick = () => { w.remove(); URL.revokeObjectURL(url); };
}
