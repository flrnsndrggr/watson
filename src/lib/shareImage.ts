/**
 * Visual share card generator — renders a branded watson Spiele result card
 * on a <canvas> element, then exports it as a PNG blob.
 *
 * Zero external dependencies. Uses the native Canvas API.
 * Card format: 1200×630 (OG image standard — works on WhatsApp, Instagram, Twitter).
 */

const W = 1200;
const H = 630;
const DPR = 2; // 2× for retina
const PAD = 80;

// Watson brand colors (mirrors tokens.css)
const C = {
  bg: '#1A1A1A',
  white: '#FFFFFF',
  gray: '#777777',
  grayDark: '#555555',
  cyan: '#00C6FF',
  pink: '#F40F97',
  green: '#7BD400',
  blue: '#0F6CF5',
  diff: {
    1: '#FFD700', // yellow — easy
    2: '#7BD400', // green — medium
    3: '#0F6CF5', // blue — hard
    4: '#9B59B6', // purple — tricky
  } as Record<number, string>,
} as const;

const FONT_H = '"Onest", "Nunito Sans", sans-serif';
const FONT_B = '"Nunito Sans", sans-serif';

// ---- Public types ----

export interface ShareCardData {
  gameName: string;
  gamePath: string; // route segment for URL (e.g. "verbindige")
  puzzleId: string;
  heading: string;
  subheading: string;
  accentColor: string; // hex color
  grid: ShareCardGrid;
  stats: string;
}

export type ShareCardGrid =
  | { type: 'verbindige'; rows: { difficulty: 1 | 2 | 3 | 4 }[] }
  | { type: 'schlagziil'; results: ('correct' | 'wrong' | null)[]; hints: boolean[] }
  | {
      type: 'zaemesetzli';
      found: number;
      total: number;
      rank: string;
      score: number;
      maxScore: number;
    };

// ---- Entry point ----

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  // Wait for web fonts so canvas renders Onest / Nunito Sans
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(DPR, DPR);

  drawBackground(ctx);
  drawLeftColumn(ctx, data);
  drawRightColumn(ctx, data);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

// ---- Background ----

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Solid dark background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Very subtle radial tint for depth
  const tint = ctx.createRadialGradient(0, 0, 0, W, H, W);
  tint.addColorStop(0, 'rgba(0,198,255,0.025)');
  tint.addColorStop(1, 'rgba(244,15,151,0.025)');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // Top accent stripe (cyan → pink gradient)
  const stripe = ctx.createLinearGradient(0, 0, W, 0);
  stripe.addColorStop(0, C.cyan);
  stripe.addColorStop(1, C.pink);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, W, 5);
}

// ---- Left column (text) ----

function drawLeftColumn(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  // "watson Spiele"
  ctx.fillStyle = C.gray;
  ctx.font = `600 22px ${FONT_H}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('watson Spiele', PAD, 60);

  // Game name
  ctx.fillStyle = C.white;
  ctx.font = `bold 52px ${FONT_H}`;
  ctx.fillText(data.gameName, PAD, 132);

  // Puzzle number
  ctx.fillStyle = C.grayDark;
  ctx.font = `600 26px ${FONT_H}`;
  ctx.fillText(`#${data.puzzleId}`, PAD, 170);

  // Performance heading
  ctx.fillStyle = data.accentColor;
  ctx.font = `bold 42px ${FONT_H}`;
  ctx.fillText(data.heading, PAD, 250);

  // Subheading (with word wrap)
  ctx.fillStyle = C.gray;
  ctx.font = `400 20px ${FONT_B}`;
  wrapText(ctx, data.subheading, PAD, 288, 440, 28);

  // Stats
  ctx.fillStyle = C.white;
  ctx.font = `600 20px ${FONT_B}`;
  ctx.fillText(data.stats, PAD, 520);

  // Tagline
  ctx.fillStyle = C.grayDark;
  ctx.font = `italic 16px ${FONT_B}`;
  ctx.fillText('Spiel, aber deep.', PAD, 568);

  // URL
  ctx.fillStyle = C.cyan;
  ctx.font = `600 16px ${FONT_B}`;
  ctx.fillText(`games-watson.netlify.app/${data.gamePath}`, PAD, 598);
}

// ---- Right column (result grid) ----

function drawRightColumn(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const cx = 910; // horizontal center of right column
  const cy = 330; // vertical center

  // Subtle glow behind the grid
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
  glow.addColorStop(0, hexAlpha(data.accentColor, 0.06));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 200, cy - 200, 400, 400);

  drawGrid(ctx, data.grid, cx, cy);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: ShareCardGrid,
  cx: number,
  cy: number,
) {
  if (grid.type === 'verbindige') {
    drawVerbindigeGrid(ctx, grid, cx, cy);
  } else if (grid.type === 'schlagziil') {
    drawSchlagziilGrid(ctx, grid, cx, cy);
  } else {
    drawZaemesetzliGrid(ctx, grid, cx, cy);
  }
}

function drawVerbindigeGrid(
  ctx: CanvasRenderingContext2D,
  grid: { type: 'verbindige'; rows: { difficulty: 1 | 2 | 3 | 4 }[] },
  cx: number,
  cy: number,
) {
  const size = 56;
  const gap = 10;
  const cols = 4;
  const rows = grid.rows.length;
  const totalW = cols * size + (cols - 1) * gap;
  const totalH = rows * size + (rows - 1) * gap;
  const x0 = cx - totalW / 2;
  const y0 = cy - totalH / 2;

  for (let ri = 0; ri < rows; ri++) {
    const color = C.diff[grid.rows[ri].difficulty] ?? C.cyan;
    for (let ci = 0; ci < cols; ci++) {
      ctx.fillStyle = color;
      roundRect(ctx, x0 + ci * (size + gap), y0 + ri * (size + gap), size, size, 8);
    }
  }
}

function drawSchlagziilGrid(
  ctx: CanvasRenderingContext2D,
  grid: { type: 'schlagziil'; results: ('correct' | 'wrong' | null)[]; hints: boolean[] },
  cx: number,
  cy: number,
) {
  const size = 56;
  const gap = 12;
  const count = grid.results.length;
  const totalW = count * size + (count - 1) * gap;
  const x0 = cx - totalW / 2;
  const y0 = cy - size / 2 - 16;

  grid.results.forEach((result, i) => {
    const x = x0 + i * (size + gap);

    // Square
    ctx.fillStyle = result === 'correct' ? C.green : C.pink;
    roundRect(ctx, x, y0, size, size, 8);

    // Check / X mark
    ctx.fillStyle = C.white;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result === 'correct' ? '\u2713' : '\u2717', x + size / 2, y0 + size / 2);

    // Hint indicator (small dot below)
    if (grid.hints[i]) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + size / 2, y0 + size + 14, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Reset alignment
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Score label below grid
  const correctCount = grid.results.filter((r) => r === 'correct').length;
  ctx.fillStyle = C.white;
  ctx.font = `bold 32px ${FONT_H}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${correctCount}/${count}`, cx, y0 + size + 56);
  ctx.fillStyle = C.gray;
  ctx.font = `400 18px ${FONT_B}`;
  ctx.fillText('richtig', cx, y0 + size + 82);
  ctx.textAlign = 'left';
}

function drawZaemesetzliGrid(
  ctx: CanvasRenderingContext2D,
  grid: {
    type: 'zaemesetzli';
    found: number;
    total: number;
    rank: string;
    score: number;
    maxScore: number;
  },
  cx: number,
  cy: number,
) {
  const barW = 340;
  const barH = 24;
  const x0 = cx - barW / 2;
  const y0 = cy - 70;

  // Background bar
  ctx.fillStyle = '#333333';
  roundRect(ctx, x0, y0, barW, barH, barH / 2);

  // Filled bar (cyan → green gradient)
  const ratio = grid.maxScore > 0 ? grid.score / grid.maxScore : 0;
  const fillW = Math.max(barH, ratio * barW);
  const grad = ctx.createLinearGradient(x0, 0, x0 + barW, 0);
  grad.addColorStop(0, C.cyan);
  grad.addColorStop(1, C.green);
  ctx.fillStyle = grad;
  roundRect(ctx, x0, y0, fillW, barH, barH / 2);

  // Found count
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.font = `bold 36px ${FONT_H}`;
  ctx.fillText(`${grid.found}/${grid.total}`, cx, y0 + barH + 52);

  // "Wörter" label
  ctx.fillStyle = C.gray;
  ctx.font = `400 18px ${FONT_B}`;
  ctx.fillText('Wörter gefunden', cx, y0 + barH + 80);

  // Score
  ctx.fillStyle = C.white;
  ctx.font = `600 22px ${FONT_B}`;
  ctx.fillText(`${grid.score} Punkte`, cx, y0 + barH + 118);

  // Rank badge
  ctx.fillStyle = C.cyan;
  ctx.font = `bold 30px ${FONT_H}`;
  ctx.fillText(grid.rank, cx, y0 + barH + 160);

  ctx.textAlign = 'left';
}

// ---- Helpers ----

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

// ============================================================
// Instagram Story card — 1080×1920 (9:16 portrait)
// ============================================================

const STORY_W = 1080;
const STORY_H = 1920;
const STORY_PAD = 80;

export async function generateStoryCard(data: ShareCardData): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = STORY_W * DPR;
  canvas.height = STORY_H * DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(DPR, DPR);

  storyDrawBackground(ctx, data.accentColor);
  storyDrawContent(ctx, data);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

function storyDrawBackground(ctx: CanvasRenderingContext2D, accent: string) {
  // Solid dark background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Subtle radial tint for depth — centered
  const tint = ctx.createRadialGradient(
    STORY_W / 2, STORY_H * 0.4, 0,
    STORY_W / 2, STORY_H * 0.4, STORY_W,
  );
  tint.addColorStop(0, hexAlpha(accent, 0.06));
  tint.addColorStop(1, 'transparent');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Top accent stripe (cyan → pink gradient)
  const stripe = ctx.createLinearGradient(0, 0, STORY_W, 0);
  stripe.addColorStop(0, C.cyan);
  stripe.addColorStop(1, C.pink);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, STORY_W, 6);

  // Bottom accent stripe
  ctx.fillStyle = stripe;
  ctx.fillRect(0, STORY_H - 6, STORY_W, 6);
}

function storyDrawContent(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const cx = STORY_W / 2;

  // -- Top section: branding --
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // "watson Spiele"
  ctx.fillStyle = C.gray;
  ctx.font = `600 28px ${FONT_H}`;
  ctx.fillText('watson Spiele', cx, 120);

  // Game name — large
  ctx.fillStyle = C.white;
  ctx.font = `bold 72px ${FONT_H}`;
  ctx.fillText(data.gameName, cx, 210);

  // Puzzle number
  ctx.fillStyle = C.grayDark;
  ctx.font = `600 30px ${FONT_H}`;
  ctx.fillText(`#${data.puzzleId}`, cx, 260);

  // -- Center section: result grid --
  const gridCy = 720;
  storyDrawGrid(ctx, data.grid, cx, gridCy);

  // -- Performance heading --
  const textY = 1080;
  ctx.fillStyle = data.accentColor;
  ctx.font = `bold 64px ${FONT_H}`;
  ctx.fillText(data.heading, cx, textY);

  // Subheading
  ctx.fillStyle = C.gray;
  ctx.font = `400 28px ${FONT_B}`;
  wrapTextCentered(ctx, data.subheading, cx, textY + 52, STORY_W - STORY_PAD * 2, 38);

  // Stats
  ctx.fillStyle = C.white;
  ctx.font = `600 30px ${FONT_B}`;
  ctx.fillText(data.stats, cx, textY + 160);

  // -- Bottom section: branding --
  // Tagline
  ctx.fillStyle = C.grayDark;
  ctx.font = `italic 24px ${FONT_B}`;
  ctx.fillText('Spiel, aber deep.', cx, STORY_H - 180);

  // URL
  ctx.fillStyle = C.cyan;
  ctx.font = `600 26px ${FONT_B}`;
  ctx.fillText(`games-watson.netlify.app/${data.gamePath}`, cx, STORY_H - 130);

  ctx.textAlign = 'left';
}

function storyDrawGrid(
  ctx: CanvasRenderingContext2D,
  grid: ShareCardGrid,
  cx: number,
  cy: number,
) {
  if (grid.type === 'verbindige') {
    storyDrawVerbindigeGrid(ctx, grid, cx, cy);
  } else if (grid.type === 'schlagziil') {
    storyDrawSchlagziilGrid(ctx, grid, cx, cy);
  } else {
    storyDrawZaemesetzliGrid(ctx, grid, cx, cy);
  }
}

function storyDrawVerbindigeGrid(
  ctx: CanvasRenderingContext2D,
  grid: { type: 'verbindige'; rows: { difficulty: 1 | 2 | 3 | 4 }[] },
  cx: number,
  cy: number,
) {
  const size = 100;
  const gap = 16;
  const cols = 4;
  const rows = grid.rows.length;
  const totalW = cols * size + (cols - 1) * gap;
  const totalH = rows * size + (rows - 1) * gap;
  const x0 = cx - totalW / 2;
  const y0 = cy - totalH / 2;

  for (let ri = 0; ri < rows; ri++) {
    const color = C.diff[grid.rows[ri].difficulty] ?? C.cyan;
    for (let ci = 0; ci < cols; ci++) {
      ctx.fillStyle = color;
      roundRect(ctx, x0 + ci * (size + gap), y0 + ri * (size + gap), size, size, 12);
    }
  }
}

function storyDrawSchlagziilGrid(
  ctx: CanvasRenderingContext2D,
  grid: { type: 'schlagziil'; results: ('correct' | 'wrong' | null)[]; hints: boolean[] },
  cx: number,
  cy: number,
) {
  const size = 100;
  const gap = 18;
  const count = grid.results.length;
  const totalW = count * size + (count - 1) * gap;
  const x0 = cx - totalW / 2;
  const y0 = cy - size / 2 - 30;

  grid.results.forEach((result, i) => {
    const x = x0 + i * (size + gap);

    ctx.fillStyle = result === 'correct' ? C.green : C.pink;
    roundRect(ctx, x, y0, size, size, 12);

    ctx.fillStyle = C.white;
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result === 'correct' ? '\u2713' : '\u2717', x + size / 2, y0 + size / 2);

    if (grid.hints[i]) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + size / 2, y0 + size + 20, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Score label
  const correctCount = grid.results.filter((r) => r === 'correct').length;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.white;
  ctx.font = `bold 48px ${FONT_H}`;
  ctx.fillText(`${correctCount}/${count}`, cx, y0 + size + 80);
  ctx.fillStyle = C.gray;
  ctx.font = `400 24px ${FONT_B}`;
  ctx.fillText('richtig', cx, y0 + size + 112);
}

function storyDrawZaemesetzliGrid(
  ctx: CanvasRenderingContext2D,
  grid: {
    type: 'zaemesetzli';
    found: number;
    total: number;
    rank: string;
    score: number;
    maxScore: number;
  },
  cx: number,
  cy: number,
) {
  const barW = 600;
  const barH = 36;
  const x0 = cx - barW / 2;
  const y0 = cy - 100;

  // Background bar
  ctx.fillStyle = '#333333';
  roundRect(ctx, x0, y0, barW, barH, barH / 2);

  // Filled bar
  const ratio = grid.maxScore > 0 ? grid.score / grid.maxScore : 0;
  const fillW = Math.max(barH, ratio * barW);
  const grad = ctx.createLinearGradient(x0, 0, x0 + barW, 0);
  grad.addColorStop(0, C.cyan);
  grad.addColorStop(1, C.green);
  ctx.fillStyle = grad;
  roundRect(ctx, x0, y0, fillW, barH, barH / 2);

  // Found count
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.font = `bold 56px ${FONT_H}`;
  ctx.fillText(`${grid.found}/${grid.total}`, cx, y0 + barH + 72);

  // "Wörter" label
  ctx.fillStyle = C.gray;
  ctx.font = `400 24px ${FONT_B}`;
  ctx.fillText('Wörter gefunden', cx, y0 + barH + 106);

  // Score
  ctx.fillStyle = C.white;
  ctx.font = `600 30px ${FONT_B}`;
  ctx.fillText(`${grid.score} Punkte`, cx, y0 + barH + 155);

  // Rank badge
  ctx.fillStyle = C.cyan;
  ctx.font = `bold 44px ${FONT_H}`;
  ctx.fillText(grid.rank, cx, y0 + barH + 210);
}

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, cx, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, cx, currentY);
}
