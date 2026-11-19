// Vice Sunset Cover Studio — cover renderer.
// Draws a multi-panel poster cover onto a canvas: photos in diagonal / grid /
// strip panels, a sunset-or-neon colour grade, procedural sun + skyline + palm
// silhouettes, and bold caption lettering. Everything is drawn in code; no
// external image, font file or network request is used at any point.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const LAYOUTS = {
  diagonal: 'Diagonal hero',
  grid: 'Four panels',
  strip: 'Hero + strip',
  single: 'One photo',
};

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon nights',
  palm: 'Palm dusk',
  mono: 'Mono violet',
};

// Warm-to-cool wash each grade paints over the photos.
const GRADE_WASH = {
  sunset: ['#ff9a3d', '#ff4e7a', '#7b2ff7'],
  neon: ['#00e5ff', '#ff2fb3', '#7b2ff7'],
  palm: ['#ffd166', '#2ec4b6', '#0b3d5c'],
  mono: ['#c084fc', '#7b2ff7', '#2b1055'],
};

const GRADE_SKY = {
  sunset: ['#2b1055', '#ff6b35', '#ffd166'],
  neon: ['#12002e', '#ff2fb3', '#00e5ff'],
  palm: ['#0b3d5c', '#2ec4b6', '#ffd166'],
  mono: ['#1e1033', '#7b2ff7', '#c084fc'],
};

export function defaultState() {
  return {
    size: 'square',
    layout: 'diagonal',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'NEON COAST • ONE LAST RIDE',
    titleSize: 1,
    panels: [
      { photo: null, zoom: 1, ox: 0, oy: 0 },
      { photo: null, zoom: 1, ox: 0, oy: 0 },
      { photo: null, zoom: 1, ox: 0, oy: 0 },
      { photo: null, zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

// Panel rectangles for a layout, as fractions of the canvas (x, y, w, h).
// The first panel is the hero; panels beyond a layout's count are ignored.
export function panelRects(layout, w, h) {
  const g = 0.012; // gutter, as a fraction of the short side
  const gw = w * g;
  const gh = h * g;
  if (layout === 'grid') {
    return [
      [0, 0, (w - gw) / 2, (h - gh) / 2],
      [(w + gw) / 2, 0, (w - gw) / 2, (h - gh) / 2],
      [0, (h + gh) / 2, (w - gw) / 2, (h - gh) / 2],
      [(w + gw) / 2, (h + gh) / 2, (w - gw) / 2, (h - gh) / 2],
    ];
  }
  if (layout === 'strip') {
    const top = h * 0.58;
    return [
      [0, 0, w, top - gh / 2],
      [0, top + gh / 2, (w - gw) / 2, h - top - gh / 2],
      [(w + gw) / 2, top + gh / 2, (w - gw) / 2, h - top - gh / 2],
    ];
  }
  if (layout === 'single') return [[0, 0, w, h]];
  // diagonal: hero takes the left ~62% with a slanted edge, two stacked right.
  return [
    [0, 0, w * 0.62, h],
    [w * 0.62, 0, w * 0.38, (h - gh) / 2],
    [w * 0.62, (h + gh) / 2, w * 0.38, (h - gh) / 2],
  ];
}

function drawPhotoCover(ctx, photo, x, y, w, h, zoom, ox, oy) {
  if (!photo || !photo.naturalWidth) return false;
  const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
  const s = base * (zoom || 1);
  const pw = photo.naturalWidth * s;
  const ph = photo.naturalHeight * s;
  const cx = x + w / 2 + (ox || 0) * w * 0.25;
  const cy = y + h / 2 + (oy || 0) * h * 0.25;
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  return true;
}

function paintPlaceholder(ctx, x, y, w, h, grade, index) {
  // Procedural stand-in when a panel has no photo yet: a graded sky, a sun
  // disc and a skyline, so the cover already looks finished before upload.
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  const cols = GRADE_SKY[grade] || GRADE_SKY.sunset;
  sky.addColorStop(0, cols[0]);
  sky.addColorStop(0.55, cols[1]);
  sky.addColorStop(1, cols[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w, h) * 0.22;
  const sx = x + w * 0.68;
  const sy = y + h * 0.42;
  const glow = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 220, 130, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 150, 80, 0.45)');
  glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  drawSkyline(ctx, x, y + h * 0.62, w, h * 0.38, 'rgba(20, 8, 40, 0.85)', index);
}

function drawSkyline(ctx, x, y, w, h, color, seed) {
  ctx.fillStyle = color;
  let bx = x;
  let n = 0;
  while (bx < x + w) {
    const bw = w * (0.08 + ((seed * 7 + n * 13) % 10) / 100);
    const bh = h * (0.35 + ((seed * 3 + n * 29) % 60) / 100);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if ((n + seed) % 3 === 0) {
      ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.16, bw * 0.4, h * 0.16);
    }
    bx += bw + w * 0.015;
    n += 1;
  }
}

function drawPalm(ctx, x, y, s, lean) {
  // One palm silhouette: a leaning trunk and seven fronds, all curves.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = 'rgba(12, 6, 28, 0.92)';
  ctx.fillStyle = 'rgba(12, 6, 28, 0.92)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 14, -52, lean * 26, -96);
  ctx.stroke();
  ctx.translate(lean * 26, -96);
  for (let i = 0; i < 7; i += 1) {
    const a = (-Math.PI / 7) * i - Math.PI / 14;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 34, Math.sin(a) * 34 - 16, Math.cos(a) * 58, Math.sin(a) * 58 + 14);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.restore();
}

function gradeWash(ctx, w, h, grade) {
  const cols = GRADE_WASH[grade] || GRADE_WASH.sunset;
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, cols[0] + '2e');
  wash.addColorStop(0.55, cols[1] + '26');
  wash.addColorStop(1, cols[2] + '40');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  // Warm horizon band low on the frame, the sunset signature.
  const band = ctx.createLinearGradient(0, h * 0.55, 0, h);
  band.addColorStop(0, 'rgba(255, 120, 60, 0)');
  band.addColorStop(1, 'rgba(255, 80, 140, 0.28)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);
  // Vignette.
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10, 4, 24, 0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `900 ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `900 ${px}px ${family}`;
  }
  return px;
}

function drawCaption(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const family = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif';
  const bandH = h * (state.size === 'wide' ? 0.26 : 0.21);
  const bandY = h - bandH;
  // Dark caption band with a neon top edge.
  const bg = ctx.createLinearGradient(0, bandY, 0, h);
  bg.addColorStop(0, 'rgba(12, 4, 26, 0.88)');
  bg.addColorStop(1, 'rgba(12, 4, 26, 0.97)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, w, bandH);
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, '#ff9a3d');
  edge.addColorStop(0.5, '#ff2fb3');
  edge.addColorStop(1, '#00e5ff');
  ctx.fillStyle = edge;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));
  if (!title) return;
  const pad = w * 0.045;
  const maxW = w - pad * 2;
  const basePx = h * 0.115 * (state.titleSize || 1);
  ctx.save();
  ctx.translate(pad, bandY + bandH * 0.56);
  ctx.rotate(-0.012);
  const px = fitFont(ctx, title, maxW, basePx, family);
  ctx.font = `900 ${px}px ${family}`;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // Sunset gradient fill, dark outline, cyan offset shadow.
  const fill = ctx.createLinearGradient(0, -px * 0.55, 0, px * 0.55);
  fill.addColorStop(0, '#fff7d6');
  fill.addColorStop(0.45, '#ffd166');
  fill.addColorStop(0.75, '#ff6b35');
  fill.addColorStop(1, '#ff2fb3');
  ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
  ctx.fillText(title, 5, 5);
  ctx.strokeStyle = '#14082a';
  ctx.lineWidth = Math.max(3, px * 0.09);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  if (sub) {
    // Shrink the subtitle until the whole line fits before the accent rule,
    // instead of cutting it off mid-word.
    const ruleW = w * 0.16;
    const subMaxX = w - pad - ruleW - w * 0.03;
    let subPx = Math.max(18, h * 0.026);
    const tracking = () => subPx * 0.32;
    const subWidth = () => {
      ctx.font = `700 ${subPx}px "Helvetica Neue", Arial, sans-serif`;
      let tw = 0;
      for (const ch of sub) tw += ctx.measureText(ch).width + tracking();
      return tw;
    };
    while (subPx > 13 && pad + subWidth() > subMaxX) subPx -= 1;
    ctx.font = `700 ${subPx}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = '#e8f6ff';
    ctx.textBaseline = 'alphabetic';
    let sx = pad;
    // Letter-spaced subtitle, drawn one glyph at a time.
    for (const ch of sub) {
      ctx.fillText(ch, sx, bandY + bandH * 0.88);
      sx += ctx.measureText(ch).width + tracking();
    }
    ctx.fillStyle = '#ff2fb3';
    ctx.fillRect(w - pad - ruleW, bandY + bandH * 0.84, ruleW, Math.max(3, h * 0.004));
  }
}

/** Renders the whole cover for `state` onto `canvas` (sized to its export size). */
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { w, h } = size;
  ctx.fillStyle = '#14082a';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const photos = state.panels || [];
  rects.forEach(([x, y, pw, ph], i) => {
    ctx.save();
    ctx.beginPath();
    if (state.layout === 'diagonal' && i === 0) {
      // Slanted hero edge: the poster's diagonal cut.
      ctx.moveTo(x, y);
      ctx.lineTo(x + pw, y);
      ctx.lineTo(x + pw - w * 0.05, y + ph);
      ctx.lineTo(x, y + ph);
      ctx.closePath();
    } else {
      ctx.rect(x, y, pw, ph);
    }
    ctx.clip();
    const panel = photos[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const shown = drawPhotoCover(ctx, panel.photo, x, y, pw, ph, panel.zoom, panel.ox, panel.oy);
    if (!shown) paintPlaceholder(ctx, x, y, pw, ph, state.grade, i + 1);
    // Per-panel grade tint + a thin white frame line.
    const cols = GRADE_WASH[state.grade] || GRADE_WASH.sunset;
    const tint = ctx.createLinearGradient(x, y, x + pw, y + ph);
    tint.addColorStop(0, cols[0] + '14');
    tint.addColorStop(1, cols[2] + '30');
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, pw, ph);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    if (state.layout === 'diagonal' && i === 0) {
      ctx.beginPath();
      ctx.moveTo(x + pw, y);
      ctx.lineTo(x + pw - w * 0.05, y + ph);
      ctx.stroke();
    }
  });
  // Hero decorations: palms across the hero panel's foot, but only when the
  // hero has no photo yet — over a real photo they would cover the subject.
  const hero = rects[0];
  const heroHasPhoto = Boolean((state.panels || [])[0] && state.panels[0].photo);
  if (state.layout !== 'single' && !heroHasPhoto) {
    drawPalm(ctx, hero[0] + hero[2] * 0.1, hero[1] + hero[3] * 0.97, Math.min(w, h) * 0.0016, 1);
    drawPalm(ctx, hero[0] + hero[2] * 0.24, hero[1] + hero[3] * 0.99, Math.min(w, h) * 0.0012, -1);
  }
  gradeWash(ctx, w, h, state.grade);
  drawCaption(ctx, w, h, state);
  return canvas;
}
