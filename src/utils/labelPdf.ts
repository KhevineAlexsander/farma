import { Product } from '../types';

/**
 * Geração de etiquetas 4 x 2 cm em folha A4 (4 colunas x 10 linhas, com espaço entre elas).
 * Cada etiqueta é desenhada em canvas (fundo escuro com detalhes dourados) e inserida no PDF.
 */

export const LABEL_W_MM = 40;
export const LABEL_H_MM = 20;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const COLS = 4;
const ROWS = 10;
const GAP_X_MM = 4;
const GAP_Y_MM = 4;
const PX_PER_MM = 15; // ~380 dpi

export const LABELS_PER_PAGE = COLS * ROWS;

export interface LabelOptions {
  storeName: string;
  subtitle: string;
  sideText: string;
  footerText: string;
}

export interface LabelItem {
  product: Product;
  quantity: number;
}

const FONT = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

const ensureFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load(`800 40px ${FONT}`),
      document.fonts.load(`700 40px ${FONT}`),
      document.fonts.load(`600 40px ${FONT}`),
    ]);
  } catch {
    // Usa a fonte de fallback
  }
};

export const formatLabelProductText = (p: Product): string => {
  const name = (p.name || '').toUpperCase().trim();
  // "100 MG" -> "100MG", como na etiqueta de referência
  const dosage = (p.dosage || '').toUpperCase().replace(/(\d)\s+([A-Z])/g, '$1$2').trim();
  if (!dosage || name.includes(dosage)) return name;
  return `${name} ${dosage}`;
};

const goldGradient = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#a8792c');
  g.addColorStop(0.3, '#f5d98f');
  g.addColorStop(0.55, '#c99a45');
  g.addColorStop(0.8, '#f1d488');
  g.addColorStop(1, '#9c6d24');
  return g;
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Diminui a fonte até o texto caber na largura. Retorna o tamanho usado. */
const fitFont = (ctx: CanvasRenderingContext2D, text: string, weight: number, maxSize: number, minSize: number, maxWidth: number) => {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
};

/** Quebra o nome do produto em até 2 linhas, se não couber em uma. */
const splitInTwoLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best: string[] = [text];
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (w < bestWidth) {
      bestWidth = w;
      best = [a, b];
    }
  }
  return best;
};

export const renderLabelCanvas = (product: Product, opts: LabelOptions): HTMLCanvasElement => {
  const W = LABEL_W_MM * PX_PER_MM;
  const H = LABEL_H_MM * PX_PER_MM;
  const mm = PX_PER_MM;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fundo branco (fora dos cantos arredondados)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Fundo escuro
  const radius = 1.4 * mm;
  roundRect(ctx, 0, 0, W, H, radius);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#05080b');
  bg.addColorStop(0.5, '#141a20');
  bg.addColorStop(1, '#06090c');
  ctx.fillStyle = bg;
  ctx.fill();

  // Textura diagonal fina
  ctx.save();
  roundRect(ctx, 0, 0, W, H, radius);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 2;
  for (let x = -H; x < W + H; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + H, 0);
    ctx.stroke();
  }
  // Brilho suave no centro
  const glow = ctx.createRadialGradient(W * 0.55, H * 0.45, 0, W * 0.55, H * 0.45, W * 0.55);
  glow.addColorStop(0, 'rgba(201,154,69,0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Bordas douradas (externa grossa + interna fina)
  ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H);
  ctx.lineWidth = 0.45 * mm;
  roundRect(ctx, 0.3 * mm, 0.3 * mm, W - 0.6 * mm, H - 0.6 * mm, radius);
  ctx.stroke();
  ctx.lineWidth = 0.12 * mm;
  roundRect(ctx, 0.9 * mm, 0.9 * mm, W - 1.8 * mm, H - 1.8 * mm, radius * 0.7);
  ctx.stroke();

  // Faixa lateral com texto vertical
  const sideW = 4.2 * mm;
  ctx.strokeStyle = 'rgba(201,154,69,0.55)';
  ctx.lineWidth = 0.1 * mm;
  ctx.beginPath();
  ctx.moveTo(sideW + 1 * mm, 2 * mm);
  ctx.lineTo(sideW + 1 * mm, H - 2 * mm);
  ctx.stroke();
  if (opts.sideText.trim()) {
    ctx.save();
    ctx.translate(1 * mm + sideW / 2, H / 2);
    ctx.rotate(-Math.PI / 2);
    const sideText = opts.sideText.toUpperCase();
    fitFont(ctx, sideText, 800, 2.3 * mm, 1.2 * mm, H - 4 * mm);
    ctx.fillStyle = goldGradient(ctx, -H / 2, 0, H / 2, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sideText, 0, 0);
    ctx.restore();
  }

  // Área de conteúdo
  const left = sideW + 2 * mm;
  const right = W - 1.8 * mm;
  const cx = (left + right) / 2;
  const contentW = right - left;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Nome da loja (marca)
  const brand = (opts.storeName || '').toUpperCase().trim();
  if (brand) {
    fitFont(ctx, brand, 800, 4.6 * mm, 1.6 * mm, contentW * 0.92);
    ctx.fillStyle = goldGradient(ctx, left, 0, right, 0);
    ctx.fillText(brand, cx, 6.2 * mm);
  }

  // Subtítulo
  const subtitle = (opts.subtitle || '').toUpperCase().trim();
  if (subtitle) {
    fitFont(ctx, subtitle, 600, 1.35 * mm, 0.9 * mm, contentW * 0.8);
    ctx.fillStyle = '#c9a45a';
    ctx.fillText(subtitle, cx, 7.9 * mm);
  }

  // Nome do produto + dosagem
  const productText = formatLabelProductText(product);
  let size = fitFont(ctx, productText, 800, 3.6 * mm, 2.4 * mm, contentW);
  let lines = [productText];
  if (ctx.measureText(productText).width > contentW) {
    ctx.font = `800 ${2.6 * mm}px ${FONT}`;
    lines = splitInTwoLines(ctx, productText, contentW);
    size = 2.6 * mm;
    for (const l of lines) size = Math.min(size, fitFont(ctx, l, 800, size, 1.4 * mm, contentW));
    ctx.font = `800 ${size}px ${FONT}`;
  }
  ctx.fillStyle = goldGradient(ctx, left, 0, right, 0);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  if (lines.length === 1) {
    ctx.fillText(lines[0], cx, 12.6 * mm);
  } else {
    ctx.fillText(lines[0], cx, 11.2 * mm);
    ctx.fillText(lines[1], cx, 11.2 * mm + size * 1.05);
  }
  ctx.shadowBlur = 0;

  // Linha divisória fina
  ctx.strokeStyle = 'rgba(201,154,69,0.45)';
  ctx.lineWidth = 0.08 * mm;
  ctx.beginPath();
  ctx.moveTo(left + contentW * 0.12, 15 * mm);
  ctx.lineTo(right - contentW * 0.12, 15 * mm);
  ctx.stroke();

  // Rodapé
  const footer = (opts.footerText || '').toUpperCase().trim();
  if (footer) {
    fitFont(ctx, footer, 700, 1.45 * mm, 0.9 * mm, contentW * 0.75);
    ctx.fillStyle = goldGradient(ctx, left, 0, right, 0);
    ctx.fillText(footer, cx, 17.6 * mm);

    // Divisas decorativas ao lado do rodapé
    const tw = ctx.measureText(footer).width;
    ctx.strokeStyle = 'rgba(201,154,69,0.7)';
    ctx.lineWidth = 0.12 * mm;
    const chevron = (x: number, dir: 1 | -1) => {
      for (let i = 0; i < 2; i++) {
        const ox = x + dir * i * 0.7 * mm;
        ctx.beginPath();
        ctx.moveTo(ox, 16.6 * mm);
        ctx.lineTo(ox + dir * 0.5 * mm, 17.1 * mm);
        ctx.lineTo(ox, 17.6 * mm);
        ctx.stroke();
      }
    };
    chevron(cx - tw / 2 - 2.6 * mm, 1);
    chevron(cx + tw / 2 + 2.6 * mm, -1);
  }

  return canvas;
};

/**
 * Monta a lista de etiquetas e gera o PDF.
 * As etiquetas são distribuídas por coluna (de cima para baixo), como na folha de referência:
 * com 10 unidades por produto, cada coluna fica com um produto.
 */
export const generateLabelsPdf = async (items: LabelItem[], opts: LabelOptions, filename = 'etiquetas_4x2_a4.pdf') => {
  const sequence: Product[] = [];
  items.forEach(({ product, quantity }) => {
    for (let i = 0; i < Math.max(0, Math.floor(quantity)); i++) sequence.push(product);
  });
  if (sequence.length === 0) return 0;

  await ensureFonts();
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const gridW = COLS * LABEL_W_MM + (COLS - 1) * GAP_X_MM;
  const gridH = ROWS * LABEL_H_MM + (ROWS - 1) * GAP_Y_MM;
  const marginX = (PAGE_W_MM - gridW) / 2;
  const marginY = (PAGE_H_MM - gridH) / 2;

  const cache = new Map<string, string>();
  const imageFor = (p: Product) => {
    const key = p.id || formatLabelProductText(p);
    let data = cache.get(key);
    if (!data) {
      data = renderLabelCanvas(p, opts).toDataURL('image/jpeg', 0.92);
      cache.set(key, data);
    }
    return { key, data };
  };

  sequence.forEach((product, index) => {
    const pos = index % LABELS_PER_PAGE;
    if (index > 0 && pos === 0) pdf.addPage();
    const col = Math.floor(pos / ROWS);
    const row = pos % ROWS;
    const x = marginX + col * (LABEL_W_MM + GAP_X_MM);
    const y = marginY + row * (LABEL_H_MM + GAP_Y_MM);
    const { key, data } = imageFor(product);
    // alias: o jsPDF reutiliza a mesma imagem para etiquetas repetidas (PDF menor)
    pdf.addImage(data, 'JPEG', x, y, LABEL_W_MM, LABEL_H_MM, `lbl_${key}`, 'FAST');
  });

  pdf.save(filename);
  return sequence.length;
};
