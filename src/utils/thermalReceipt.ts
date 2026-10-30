import { Order, StoreSettings } from '../types';
import { formatCurrency } from './exportUtils';

export type ThermalPaperWidth = 58 | 80;

// Largura útil de cada bobina: a cabeça térmica não imprime até a borda do papel.
const PRINTABLE_WIDTH_MM: Record<ThermalPaperWidth, number> = { 58: 48, 80: 72 };
const BASE_FONT_PX: Record<ThermalPaperWidth, number> = { 58: 10.5, 80: 12 };

export interface ThermalReceiptOptions {
  paperWidth: ThermalPaperWidth;
  storeSettings?: Partial<StoreSettings>;
  printedBy?: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

const formatDateTime = (value: string | Date): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

// dueDate pode vir como AAAA-MM-DD (sem fuso) ou ISO completo
const formatDueDate = (value: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('pt-BR');
};

const row = (label: string, value: string, className = ''): string =>
  `<div class="row ${className}"><span>${escapeHtml(label)}</span><span class="val">${escapeHtml(value)}</span></div>`;

/**
 * Builds a self-contained HTML receipt sized for 58mm / 80mm thermal printers.
 * All dynamic values are escaped, since the document is rendered in a same-origin iframe.
 */
export function buildThermalReceiptHtml(order: Order, options: ThermalReceiptOptions): string {
  const { paperWidth, storeSettings, printedBy } = options;
  const storeName = storeSettings?.storeName || 'Glow Slim Peptide Imports';
  const site = (storeSettings?.siteUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const contactLines = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
    site,
  ].filter(Boolean);

  const items = order.items || [];
  const totalUnits = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const total = order.total || 0;
  const hasPaymentInfo =
    order.paidAmount !== undefined || order.remainingAmount !== undefined || order.status === 'Pago Parcial';
  const paid = order.paidAmount ?? (order.status === 'Pago' ? total : 0);
  const remaining = order.remainingAmount ?? Math.max(0, total - paid);

  const a = order.address;
  const addressLines = [
    [a?.street, a?.number].filter(Boolean).join(', ') + (a?.complement ? ` - ${a.complement}` : ''),
    [a?.neighborhood, [a?.city, a?.state].filter(Boolean).join('/')].filter(Boolean).join(' - '),
    a?.zipCode ? `CEP: ${a.zipCode}` : '',
  ].filter((line) => line.trim());

  const itemsHtml = items
    .map((i) => {
      const qty = i.quantity || 1;
      const price = i.product?.price || 0;
      const name = [i.product?.name || 'Produto', i.product?.dosage].filter(Boolean).join(' ');
      return `<div class="item">
        <div class="item-name">${escapeHtml(`${qty}x ${name}`)}</div>
        ${row(`${qty} x ${formatCurrency(price)}`, formatCurrency(price * qty), 'small')}
      </div>`;
    })
    .join('');

  const totalsHtml = [
    row('Subtotal', formatCurrency(order.subtotal ?? total)),
    (order.shipping || 0) > 0 ? row('Frete', formatCurrency(order.shipping)) : '',
    (order.importTax || 0) > 0 ? row('Taxa de importação', formatCurrency(order.importTax || 0)) : '',
    (order.additionalAmount || 0) > 0 ? row('Acréscimo', `+ ${formatCurrency(order.additionalAmount || 0)}`) : '',
    (order.discount || 0) > 0 ? row('Desconto', `- ${formatCurrency(order.discount)}`) : '',
  ].join('');

  const paymentHtml = [
    row('Pagamento', order.paymentMethod || 'A Combinar'),
    hasPaymentInfo ? row('Valor pago', formatCurrency(paid)) : '',
    hasPaymentInfo && remaining > 0 ? row('SALDO A RECEBER', formatCurrency(remaining), 'bold') : '',
    remaining > 0 && order.dueDate ? row('Vencimento', formatDueDate(order.dueDate)) : '',
  ].join('');

  const printedLine = `Impresso em ${formatDateTime(new Date())}${printedBy ? ` por ${printedBy}` : ''}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Pedido ${escapeHtml(order.orderNumber)}</title>
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: #000; }
  body {
    width: ${PRINTABLE_WIDTH_MM[paperWidth]}mm;
    margin: 0 auto;
    padding: 3mm 0 8mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${BASE_FONT_PX[paperWidth]}px;
    line-height: 1.35;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .center { text-align: center; }
  .store { font-size: 1.3em; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; }
  .muted { font-size: 0.9em; }
  .divider { border-top: 1px dashed #000; margin: 2mm 0; }
  .section-title { font-weight: 800; text-transform: uppercase; margin-bottom: 0.8mm; }
  .order-number { font-size: 1.5em; font-weight: 800; margin: 1mm 0; }
  .status { display: inline-block; border: 1.5px solid #000; padding: 0.5mm 2mm; font-weight: 800; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
  .row .val { flex-shrink: 0; max-width: 65%; text-align: right; }
  .row.small { font-size: 0.92em; }
  .row.bold { font-weight: 800; }
  .item { margin-bottom: 1.2mm; }
  .item-name { font-weight: 700; }
  .total { font-size: 1.35em; font-weight: 800; margin: 1mm 0; }
  .notes { white-space: pre-wrap; }
</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contactLines.map((line) => `<div class="muted">${escapeHtml(line)}</div>`).join('')}
  </div>

  <div class="divider"></div>

  <div class="center">
    <div class="muted">PEDIDO</div>
    <div class="order-number">${escapeHtml(order.orderNumber)}</div>
    <div class="muted">${escapeHtml(formatDateTime(order.createdAt))}</div>
    <div style="margin-top:1.5mm"><span class="status">${escapeHtml(order.status)}</span></div>
  </div>

  <div class="divider"></div>

  <div class="section-title">Cliente</div>
  <div>${escapeHtml(order.customer?.name || 'Cliente')}</div>
  ${order.customer?.phone ? `<div>Tel: ${escapeHtml(order.customer.phone)}</div>` : ''}
  ${order.customer?.cpf ? `<div>CPF: ${escapeHtml(order.customer.cpf)}</div>` : ''}
  ${addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}

  <div class="divider"></div>

  <div class="section-title">Itens (${totalUnits} ${totalUnits === 1 ? 'unidade' : 'unidades'})</div>
  ${itemsHtml || '<div class="muted">Nenhum item</div>'}

  <div class="divider"></div>

  ${totalsHtml}
  ${row('TOTAL', formatCurrency(total), 'total')}

  <div class="divider"></div>

  ${paymentHtml}
  ${order.trackingCode ? row('Rastreio', order.trackingCode) : ''}

  ${order.notes ? `<div class="divider"></div><div class="section-title">Observações</div><div class="notes">${escapeHtml(order.notes)}</div>` : ''}

  <div class="divider"></div>

  <div class="center">
    <div style="font-weight:700">Obrigado pela preferência!</div>
    <div class="muted" style="margin-top:1mm">*** NÃO É DOCUMENTO FISCAL ***</div>
    <div class="muted" style="margin-top:1mm">${escapeHtml(printedLine)}</div>
  </div>
</body>
</html>`;
}
