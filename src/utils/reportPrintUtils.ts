import { Order, Product, FinancialTransaction, CashRegisterSession, StoreSettings } from '../types';
import { formatCurrency } from './exportUtils';

export type ReportPrintFormat = 'a4' | '80mm' | '50mm';

export interface BasePrintOptions {
  storeSettings?: Partial<StoreSettings>;
  printedBy?: string;
  storeName?: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatDateOnly = (value?: string | Date | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('pt-BR');
};

const getBaseCss = (format: ReportPrintFormat): string => {
  if (format === 'a4') {
    return `
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 14mm 14mm;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #0f172a;
        background: #fff;
        font-size: 11px;
        line-height: 1.4;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 0;
      }
      .page-container {
        max-width: 100%;
        margin: 0 auto;
      }
      .report-header {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 10px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .brand-title {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
        text-transform: uppercase;
      }
      .brand-subtitle {
        font-size: 11px;
        color: #475569;
        margin-top: 2px;
      }
      .report-badge {
        font-size: 13px;
        font-weight: 700;
        text-align: right;
        color: #0f172a;
      }
      .meta-box {
        font-size: 10px;
        color: #64748b;
        text-align: right;
        margin-top: 3px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .kpi-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 10px;
      }
      .kpi-title {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }
      .kpi-value {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        font-variant-numeric: tabular-nums;
      }
      .kpi-sub {
        font-size: 9px;
        color: #64748b;
        margin-top: 2px;
      }
      .section-heading {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #0f172a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin-top: 14px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
        margin-bottom: 12px;
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      th {
        background: #f1f5f9;
        color: #334155;
        font-weight: 700;
        text-align: left;
        padding: 6px 8px;
        border: 1px solid #cbd5e1;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      td {
        padding: 5px 8px;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        font-variant-numeric: tabular-nums;
      }
      tr:nth-child(even) td {
        background: #f8fafc;
      }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }
      .footer-note {
        margin-top: 18px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
        font-size: 9.5px;
        color: #64748b;
        display: flex;
        justify-content: space-between;
      }
      .signature-block {
        display: flex;
        justify-content: space-around;
        margin-top: 28px;
        padding-top: 8px;
      }
      .signature-line {
        width: 200px;
        border-top: 1px solid #0f172a;
        text-align: center;
        padding-top: 4px;
        font-size: 9.5px;
        color: #334155;
      }
    `;
  }

  // Térmicas (80mm e 50mm)
  const is50 = format === '50mm';
  const widthMm = is50 ? 48 : 72;
  const baseFont = is50 ? 9.5 : 11.5;

  return `
    @page {
      size: ${is50 ? '58mm' : '80mm'} auto;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${widthMm}mm;
      margin: 0 auto;
      padding: 3mm 0 8mm;
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${baseFont}px;
      line-height: 1.32;
      color: #000;
      background: #fff;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .center { text-align: center; }
    .store { font-size: 1.25em; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; }
    .report-title { font-size: 1.15em; font-weight: 800; margin: 1.5mm 0 0.5mm; text-transform: uppercase; }
    .muted { font-size: 0.88em; color: #111; }
    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
    .divider-double { border-top: 2px solid #000; margin: 2.5mm 0; }
    .section-title { font-weight: 800; text-transform: uppercase; margin: 1.5mm 0 1mm; font-size: 0.98em; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; margin-bottom: 0.5mm; }
    .row .val { flex-shrink: 0; text-align: right; max-width: 60%; font-weight: 600; }
    .row.bold { font-weight: 800; }
    .row.large { font-size: 1.15em; font-weight: 800; }
    .row.small { font-size: 0.9em; }
    .item-block { margin-bottom: 1.5mm; }
    .item-name { font-weight: 700; }
    .tag { display: inline-block; border: 1px solid #000; padding: 0.5mm 1.5mm; font-weight: 700; font-size: 0.85em; text-transform: uppercase; }
    .footer-signatures { margin-top: 5mm; text-align: center; }
    .line-sign { width: 85%; margin: 4mm auto 1mm; border-top: 1px solid #000; }
  `;
};

// =========================================================================
// 1. RELATÓRIO DE VENDAS (SalesReportsTab)
// =========================================================================
export interface SalesReportPrintOptions extends BasePrintOptions {
  periodLabel: string;
  statusFilterLabel: string;
  orders: Order[];
  rankedProducts: Array<{
    name: string;
    dosage?: string;
    category?: string;
    qtySold: number;
    totalRevenue: number;
    currentStock?: number;
  }>;
  rankedCustomers?: Array<{
    name: string;
    phone?: string;
    ordersCount: number;
    totalSpent: number;
  }>;
  metrics: {
    totalRevenue: number;
    totalPaid: number;
    totalPendingBalance: number;
    ordersCount: number;
    totalUnitsSold: number;
    averageTicket: number;
    totalDiscounts: number;
    totalShipping: number;
    paymentMethodsBreakdown?: Record<string, { count: number; total: number }>;
  };
}

export function buildSalesReportHtml(options: SalesReportPrintOptions, format: ReportPrintFormat): string {
  const {
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
    periodLabel,
    statusFilterLabel,
    orders,
    rankedProducts = [],
    rankedCustomers = [],
    metrics,
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
    storeSettings?.siteUrl ? storeSettings.siteUrl.replace(/^https?:\/\//, '') : '',
  ].filter(Boolean);

  // Pagamentos
  const payMap = metrics.paymentMethodsBreakdown || {};
  if (!metrics.paymentMethodsBreakdown) {
    orders.forEach((o) => {
      const pm = o.paymentMethod || 'A Combinar';
      if (!payMap[pm]) payMap[pm] = { count: 0, total: 0 };
      payMap[pm].count += 1;
      payMap[pm].total += o.total || 0;
    });
  }

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório de Vendas - ${escapeHtml(storeName)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge">RELATÓRIO DE VENDAS</div>
        <div class="meta-box">Período: <strong>${escapeHtml(periodLabel)}</strong></div>
        <div class="meta-box">Status: <strong>${escapeHtml(statusFilterLabel)}</strong></div>
        <div class="meta-box">Emissão: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Faturamento Bruto</div>
        <div class="kpi-value">${formatCurrency(metrics.totalRevenue)}</div>
        <div class="kpi-sub">${metrics.ordersCount} pedidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Recebido / Pago</div>
        <div class="kpi-value" style="color:#059669">${formatCurrency(metrics.totalPaid)}</div>
        <div class="kpi-sub">Efetivamente liquidado</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Saldo a Receber</div>
        <div class="kpi-value" style="color:#e11d48">${formatCurrency(metrics.totalPendingBalance)}</div>
        <div class="kpi-sub">Pendências / a prazo</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Ticket Médio / Unidades</div>
        <div class="kpi-value">${formatCurrency(metrics.averageTicket)}</div>
        <div class="kpi-sub">${metrics.totalUnitsSold} un. vendidas</div>
      </div>
    </div>

    <!-- Formas de Pagamento -->
    <div class="section-heading">
      <span>Distribuição por Forma de Pagamento</span>
      <span style="font-size:9.5px;color:#64748b;text-transform:none">Descontos: ${formatCurrency(metrics.totalDiscounts)} | Frete: ${formatCurrency(metrics.totalShipping)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Forma de Pagamento</th>
          <th class="text-center" style="width:100px">Qtd Pedidos</th>
          <th class="text-right" style="width:140px">Total (R$)</th>
          <th class="text-right" style="width:100px">% Faturamento</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(payMap).map(([pm, data]) => {
          const pct = metrics.totalRevenue > 0 ? ((data.total / metrics.totalRevenue) * 100).toFixed(1) : '0.0';
          return `<tr>
            <td class="font-bold">${escapeHtml(pm)}</td>
            <td class="text-center">${data.count}</td>
            <td class="text-right font-bold">${formatCurrency(data.total)}</td>
            <td class="text-right">${pct}%</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- Ranking de Produtos Mais Vendidos -->
    <div class="section-heading">
      <span>Ranking de Produtos Mais Vendidos</span>
      <span style="font-size:9.5px;color:#64748b;text-transform:none">${rankedProducts.length} itens movimentados</span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="text-center" style="width:36px">#</th>
          <th>Produto & Apresentação</th>
          <th>Categoria</th>
          <th class="text-center" style="width:80px">Qtd Vendida</th>
          <th class="text-right" style="width:110px">Faturamento</th>
          <th class="text-center" style="width:80px">Estoque Atual</th>
        </tr>
      </thead>
      <tbody>
        ${rankedProducts.slice(0, 25).map((p, idx) => `<tr>
          <td class="text-center font-bold" style="color:#64748b">${idx + 1}º</td>
          <td class="font-bold">${escapeHtml(p.name)} ${p.dosage ? `<span style="font-weight:normal;color:#475569">(${escapeHtml(p.dosage)})</span>` : ''}</td>
          <td>${escapeHtml(p.category || 'Geral')}</td>
          <td class="text-center font-bold">${p.qtySold} un</td>
          <td class="text-right font-bold">${formatCurrency(p.totalRevenue)}</td>
          <td class="text-center">${p.currentStock !== undefined ? `${p.currentStock} un` : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    ${rankedCustomers.length > 0 ? `
      <!-- Ranking de Clientes -->
      <div class="section-heading">
        <span>Principais Clientes do Período</span>
        <span style="font-size:9.5px;color:#64748b;text-transform:none">Top ${Math.min(10, rankedCustomers.length)} compradores</span>
      </div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width:36px">#</th>
            <th>Nome do Cliente</th>
            <th>WhatsApp / Contato</th>
            <th class="text-center" style="width:90px">Nº Pedidos</th>
            <th class="text-right" style="width:120px">Total Comprado</th>
          </tr>
        </thead>
        <tbody>
          ${rankedCustomers.slice(0, 10).map((c, idx) => `<tr>
            <td class="text-center font-bold" style="color:#64748b">${idx + 1}º</td>
            <td class="font-bold">${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.phone || '—')}</td>
            <td class="text-center">${c.ordersCount}</td>
            <td class="text-right font-bold">${formatCurrency(c.totalSpent)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}

    <!-- Relação de Pedidos do Período -->
    <div class="section-heading">
      <span>Relação de Pedidos (${orders.length} pedidos)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:80px">Pedido</th>
          <th style="width:110px">Data/Hora</th>
          <th>Cliente</th>
          <th style="width:100px">Status</th>
          <th style="width:110px">Pagamento</th>
          <th class="text-right" style="width:100px">Total (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${orders.slice(0, 50).map((o) => `<tr>
          <td class="font-bold">${escapeHtml(o.orderNumber)}</td>
          <td>${formatDateTime(o.createdAt)}</td>
          <td>${escapeHtml(o.customer?.name || 'Cliente')}</td>
          <td>${escapeHtml(o.status)}</td>
          <td>${escapeHtml(o.paymentMethod || 'A Combinar')}</td>
          <td class="text-right font-bold">${formatCurrency(o.total || 0)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${orders.length > 50 ? `<p style="font-size:9px;color:#64748b;text-align:center;margin-bottom:10px;">Exibindo os primeiros 50 pedidos de um total de ${orders.length}.</p>` : ''}

    <div class="footer-note">
      <span>Documento gerado para controle interno e auditoria administrativa.</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>

    <div class="signature-block">
      <div class="signature-line">Visto do Operador</div>
      <div class="signature-line">Visto do Gerente</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório de Vendas</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contacts.map((c) => `<div class="muted">${escapeHtml(c)}</div>`).join('')}
    <div class="report-title">RELATÓRIO DE VENDAS</div>
    <div class="muted">Período: ${escapeHtml(periodLabel)}</div>
    <div class="muted">Status: ${escapeHtml(statusFilterLabel)}</div>
    <div class="muted">Emissão: ${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="divider-double"></div>

  <div class="section-title">RESUMO EXECUTIVO</div>
  <div class="row large"><span>FATURAMENTO:</span><span class="val">${formatCurrency(metrics.totalRevenue)}</span></div>
  <div class="row"><span>Total Recebido:</span><span class="val">${formatCurrency(metrics.totalPaid)}</span></div>
  <div class="row"><span>Saldo a Receber:</span><span class="val">${formatCurrency(metrics.totalPendingBalance)}</span></div>
  <div class="row"><span>Total de Pedidos:</span><span class="val">${metrics.ordersCount}</span></div>
  <div class="row"><span>Itens Vendidos:</span><span class="val">${metrics.totalUnitsSold} un</span></div>
  <div class="row"><span>Ticket Médio:</span><span class="val">${formatCurrency(metrics.averageTicket)}</span></div>
  ${metrics.totalDiscounts > 0 ? `<div class="row"><span>Descontos:</span><span class="val">- ${formatCurrency(metrics.totalDiscounts)}</span></div>` : ''}

  <div class="divider"></div>
  <div class="section-title">FORMAS DE PAGAMENTO</div>
  ${Object.entries(payMap).map(([pm, data]) => `
    <div class="row">
      <span>${escapeHtml(pm)} (${data.count}x):</span>
      <span class="val">${formatCurrency(data.total)}</span>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="section-title">PRODUTOS MAIS VENDIDOS</div>
  ${rankedProducts.slice(0, 15).map((p, idx) => `
    <div class="item-block">
      <div class="item-name">${idx + 1}. ${escapeHtml(p.name)} ${p.dosage ? `(${escapeHtml(p.dosage)})` : ''}</div>
      <div class="row small">
        <span>${p.qtySold} un. vendidas</span>
        <span class="val">${formatCurrency(p.totalRevenue)}</span>
      </div>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="center">
    <div class="muted">Total de ${orders.length} pedidos apurados</div>
    <div class="muted">${escapeHtml(nowFormatted)}${printedBy ? ` • ${escapeHtml(printedBy)}` : ''}</div>
  </div>

  <div class="footer-signatures">
    <div class="line-sign"></div>
    <div class="muted">Responsável / Visto</div>
  </div>
</body>
</html>`;
}

// =========================================================================
// 2. RELATÓRIO DE FECHAMENTO DE CAIXA / PEDIDOS FECHADOS (ClosedOrdersTab)
// =========================================================================
export interface ClosedOrdersReportPrintOptions extends BasePrintOptions {
  sessionTitle: string;
  session?: CashRegisterSession | null;
  orders: Order[];
  totals: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    ordersCount: number;
    paymentMethodsBreakdown: Record<string, { count: number; total: number }>;
  };
}

export function buildClosedOrdersReportHtml(options: ClosedOrdersReportPrintOptions, format: ReportPrintFormat): string {
  const {
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
    sessionTitle,
    session,
    orders,
    totals,
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
  ].filter(Boolean);

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Fechamento de Caixa - ${escapeHtml(sessionTitle)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge">FECHAMENTO DE CAIXA</div>
        <div class="meta-box">Sessão: <strong>${escapeHtml(sessionTitle)}</strong></div>
        ${session?.openedAt ? `<div class="meta-box">Aberto em: ${formatDateTime(session.openedAt)} ${session.openedByName ? `(${escapeHtml(session.openedByName)})` : ''}</div>` : ''}
        ${session?.closedAt ? `<div class="meta-box">Fechado em: ${formatDateTime(session.closedAt)} ${session.closedByName ? `(${escapeHtml(session.closedByName)})` : ''}</div>` : ''}
        <div class="meta-box">Emissão: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Faturamento Fechado</div>
        <div class="kpi-value">${formatCurrency(totals.totalRevenue)}</div>
        <div class="kpi-sub">${totals.ordersCount} pedidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Quitado</div>
        <div class="kpi-value" style="color:#059669">${formatCurrency(totals.totalPaid)}</div>
        <div class="kpi-sub">Pago em caixa</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Saldo Pendente</div>
        <div class="kpi-value" style="color:#e11d48">${formatCurrency(totals.totalPending)}</div>
        <div class="kpi-sub">A receber de clientes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Ticket Médio</div>
        <div class="kpi-value">${formatCurrency(totals.ordersCount > 0 ? totals.totalRevenue / totals.ordersCount : 0)}</div>
        <div class="kpi-sub">Média por pedido</div>
      </div>
    </div>

    ${session ? `
      <div class="section-heading"><span>Informações do Caixa</span></div>
      <table>
        <tbody>
          <tr>
            <td style="width:20%"><strong>Nome do Caixa:</strong></td>
            <td>${escapeHtml(session.name || 'Sessão')}</td>
            <td style="width:20%"><strong>Status:</strong></td>
            <td>${session.isOpen ? 'ABERTO' : 'FECHADO'}</td>
          </tr>
          <tr>
            <td><strong>Abertura:</strong></td>
            <td>${formatDateTime(session.openedAt)} por ${escapeHtml(session.openedByName || '—')}</td>
            <td><strong>Fechamento:</strong></td>
            <td>${session.closedAt ? `${formatDateTime(session.closedAt)} por ${escapeHtml(session.closedByName || '—')}` : 'Caixa ainda aberto'}</td>
          </tr>
          ${session.notes ? `<tr><td><strong>Observações:</strong></td><td colspan="3">${escapeHtml(session.notes)}</td></tr>` : ''}
        </tbody>
      </table>
    ` : ''}

    <div class="section-heading">
      <span>Fechamento por Forma de Pagamento</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Forma de Pagamento</th>
          <th class="text-center" style="width:120px">Qtd Pedidos</th>
          <th class="text-right" style="width:160px">Total Apurado (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(totals.paymentMethodsBreakdown).map(([pm, data]) => `<tr>
          <td class="font-bold">${escapeHtml(pm)}</td>
          <td class="text-center">${data.count}</td>
          <td class="text-right font-bold">${formatCurrency(data.total)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="section-heading">
      <span>Relação Detalhada de Pedidos do Caixa (${orders.length})</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:75px">Pedido</th>
          <th style="width:105px">Data/Hora</th>
          <th>Cliente</th>
          <th>Itens / Produtos</th>
          <th style="width:110px">Pagamento</th>
          <th class="text-right" style="width:90px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((o) => {
          const itemsStr = (o.items || []).map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ');
          return `<tr>
            <td class="font-bold">${escapeHtml(o.orderNumber)}</td>
            <td>${formatDateTime(o.createdAt)}</td>
            <td class="font-bold">${escapeHtml(o.customer?.name || 'Cliente')}</td>
            <td style="font-size:9.5px;color:#475569">${escapeHtml(itemsStr || '—')}</td>
            <td>${escapeHtml(o.paymentMethod || 'A Combinar')}</td>
            <td class="text-right font-bold">${formatCurrency(o.total || 0)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="footer-note">
      <span>Conferência de Fechamento de Caixa</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>

    <div class="signature-block">
      <div class="signature-line">Operador de Caixa</div>
      <div class="signature-line">Conferência / Gerência</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Fechamento de Caixa</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contacts.map((c) => `<div class="muted">${escapeHtml(c)}</div>`).join('')}
    <div class="report-title">FECHAMENTO DE CAIXA</div>
    <div class="muted">${escapeHtml(sessionTitle)}</div>
    ${session?.closedAt ? `<div class="muted">Fechado: ${formatDateTime(session.closedAt)}</div>` : ''}
    <div class="muted">Impresso: ${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="divider-double"></div>

  <div class="section-title">TOTAIS APURADOS</div>
  <div class="row large"><span>FATURAMENTO:</span><span class="val">${formatCurrency(totals.totalRevenue)}</span></div>
  <div class="row"><span>Total Quitado:</span><span class="val">${formatCurrency(totals.totalPaid)}</span></div>
  <div class="row"><span>Saldo a Receber:</span><span class="val">${formatCurrency(totals.totalPending)}</span></div>
  <div class="row"><span>Qtd de Pedidos:</span><span class="val">${totals.ordersCount}</span></div>

  <div class="divider"></div>
  <div class="section-title">POR FORMA DE PAGAMENTO</div>
  ${Object.entries(totals.paymentMethodsBreakdown).map(([pm, data]) => `
    <div class="row">
      <span>${escapeHtml(pm)} (${data.count}x):</span>
      <span class="val">${formatCurrency(data.total)}</span>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="section-title">PEDIDOS DO CAIXA (${orders.length})</div>
  ${orders.map((o) => `
    <div class="item-block">
      <div class="row small">
        <span class="item-name">${escapeHtml(o.orderNumber)} - ${escapeHtml(o.customer?.name || 'Cliente')}</span>
        <span class="val">${formatCurrency(o.total || 0)}</span>
      </div>
      <div class="muted" style="font-size:0.82em">${escapeHtml(o.paymentMethod || 'A Combinar')} • ${formatDateTime(o.createdAt)}</div>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="footer-signatures">
    <div class="line-sign"></div>
    <div class="muted">Operador de Caixa</div>
    <div class="line-sign" style="margin-top:5mm"></div>
    <div class="muted">Gerente / Conferência</div>
  </div>
</body>
</html>`;
}

// =========================================================================
// 3. RELATÓRIO FINANCEIRO / FLUXO DE CAIXA (FinancialManagement)
// =========================================================================
export interface FinancialReportPrintOptions extends BasePrintOptions {
  periodLabel: string;
  totals: {
    totalSalesRevenue: number;
    totalOtherIncome: number;
    totalExpenses: number;
    netBalance: number;
  };
  transactions: FinancialTransaction[];
  paymentBreakdown?: Record<string, number>;
  expenseCategoryBreakdown?: Record<string, number>;
}

export function buildFinancialReportHtml(options: FinancialReportPrintOptions, format: ReportPrintFormat): string {
  const {
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
    periodLabel,
    totals,
    transactions,
    paymentBreakdown = {},
    expenseCategoryBreakdown = {},
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
  ].filter(Boolean);

  const totalInflows = totals.totalSalesRevenue + totals.totalOtherIncome;

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Fluxo de Caixa - ${escapeHtml(storeName)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge">RELATÓRIO DE FLUXO DE CAIXA</div>
        <div class="meta-box">Período: <strong>${escapeHtml(periodLabel)}</strong></div>
        <div class="meta-box">Emissão: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Vendas Realizadas</div>
        <div class="kpi-value" style="color:#0284c7">${formatCurrency(totals.totalSalesRevenue)}</div>
        <div class="kpi-sub">Receita bruta de vendas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Outras Entradas</div>
        <div class="kpi-value" style="color:#059669">${formatCurrency(totals.totalOtherIncome)}</div>
        <div class="kpi-sub">Aportes e receitas diversas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Saídas / Despesas</div>
        <div class="kpi-value" style="color:#e11d48">${formatCurrency(totals.totalExpenses)}</div>
        <div class="kpi-sub">Custos e sangrias</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Saldo Líquido em Caixa</div>
        <div class="kpi-value" style="color:${totals.netBalance >= 0 ? '#059669' : '#e11d48'}">${formatCurrency(totals.netBalance)}</div>
        <div class="kpi-sub">Entradas - Saídas</div>
      </div>
    </div>

    ${Object.keys(expenseCategoryBreakdown).length > 0 ? `
      <div class="section-heading"><span>Despesas por Categoria</span></div>
      <table>
        <thead>
          <tr>
            <th>Categoria de Despesa</th>
            <th class="text-right" style="width:160px">Valor Total (R$)</th>
            <th class="text-right" style="width:120px">% do Total</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(expenseCategoryBreakdown).map(([cat, val]) => {
            const pct = totals.totalExpenses > 0 ? ((val / totals.totalExpenses) * 100).toFixed(1) : '0.0';
            return `<tr>
              <td class="font-bold">${escapeHtml(cat)}</td>
              <td class="text-right font-bold">${formatCurrency(val)}</td>
              <td class="text-right">${pct}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : ''}

    <div class="section-heading">
      <span>Movimentações e Lançamentos (${transactions.length})</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:110px">Data/Hora</th>
          <th style="width:80px">Tipo</th>
          <th>Categoria</th>
          <th>Descrição</th>
          <th style="width:120px">Operador</th>
          <th class="text-right" style="width:110px">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t) => `<tr>
          <td>${formatDateTime(t.date || t.createdAt)}</td>
          <td class="font-bold" style="color:${t.type === 'INCOME' ? '#059669' : '#e11d48'}">
            ${t.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
          </td>
          <td>${escapeHtml(t.category || 'Geral')}</td>
          <td>${escapeHtml(t.description || '—')}</td>
          <td>${escapeHtml(t.operatorName || '—')}</td>
          <td class="text-right font-bold" style="color:${t.type === 'INCOME' ? '#059669' : '#e11d48'}">
            ${t.type === 'INCOME' ? '+' : '-'} ${formatCurrency(t.amount)}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="footer-note">
      <span>Relatório Financeiro Administrativo.</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>

    <div class="signature-block">
      <div class="signature-line">Responsável Financeiro</div>
      <div class="signature-line">Diretoria / Auditoria</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Fluxo de Caixa</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contacts.map((c) => `<div class="muted">${escapeHtml(c)}</div>`).join('')}
    <div class="report-title">FLUXO DE CAIXA</div>
    <div class="muted">Período: ${escapeHtml(periodLabel)}</div>
    <div class="muted">Emissão: ${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="divider-double"></div>

  <div class="section-title">BALANÇO FINANCEIRO</div>
  <div class="row"><span>Vendas Realizadas:</span><span class="val">${formatCurrency(totals.totalSalesRevenue)}</span></div>
  <div class="row"><span>Outras Entradas:</span><span class="val">${formatCurrency(totals.totalOtherIncome)}</span></div>
  <div class="row bold"><span>TOTAL ENTRADAS:</span><span class="val">${formatCurrency(totalInflows)}</span></div>
  <div class="row" style="margin-top:1.5mm"><span>TOTAL SAÍDAS:</span><span class="val">- ${formatCurrency(totals.totalExpenses)}</span></div>
  <div class="divider"></div>
  <div class="row large"><span>SALDO LÍQUIDO:</span><span class="val">${formatCurrency(totals.netBalance)}</span></div>

  ${Object.keys(expenseCategoryBreakdown).length > 0 ? `
    <div class="divider"></div>
    <div class="section-title">DESPESAS POR CATEGORIA</div>
    ${Object.entries(expenseCategoryBreakdown).map(([cat, val]) => `
      <div class="row small">
        <span>${escapeHtml(cat)}:</span>
        <span class="val">${formatCurrency(val)}</span>
      </div>
    `).join('')}
  ` : ''}

  <div class="divider"></div>
  <div class="section-title">ÚLTIMOS LANÇAMENTOS</div>
  ${transactions.slice(0, 15).map((t) => `
    <div class="item-block">
      <div class="row small">
        <span class="item-name">${t.type === 'INCOME' ? '[ENTRADA]' : '[SAÍDA]'} ${escapeHtml(t.category)}</span>
        <span class="val">${t.type === 'INCOME' ? '+' : '-'} ${formatCurrency(t.amount)}</span>
      </div>
      <div class="muted" style="font-size:0.82em">${escapeHtml(t.description || '')} (${formatDateOnly(t.date || t.createdAt)})</div>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="center muted">
    <div>Total de ${transactions.length} lançamentos</div>
    <div>${escapeHtml(nowFormatted)}${printedBy ? ` • ${escapeHtml(printedBy)}` : ''}</div>
  </div>

  <div class="footer-signatures">
    <div class="line-sign"></div>
    <div class="muted">Visto Financeiro</div>
  </div>
</body>
</html>`;
}

// =========================================================================
// 4. RELATÓRIO DE PRODUTOS & ESTOQUE (ProductManagement)
// =========================================================================
export interface ProductsReportPrintOptions extends BasePrintOptions {
  products: Product[];
  categoryFilter?: string;
}

export function buildProductsReportHtml(options: ProductsReportPrintOptions, format: ReportPrintFormat): string {
  const {
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
    products,
    categoryFilter = 'Todas',
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
  ].filter(Boolean);

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalStockValueSale = products.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 0)), 0);
  const totalStockValueCost = products.reduce((acc, p) => acc + (((p as any).costPrice || 0) * (p.stock || 0)), 0);

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório de Produtos & Estoque - ${escapeHtml(storeName)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge">RELATÓRIO DE ESTOQUE & PRODUTOS</div>
        <div class="meta-box">Categoria: <strong>${escapeHtml(categoryFilter)}</strong></div>
        <div class="meta-box">Itens Cadastrados: <strong>${products.length}</strong></div>
        <div class="meta-box">Emissão: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Itens no Catálogo</div>
        <div class="kpi-value">${products.length}</div>
        <div class="kpi-sub">Produtos cadastrados</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Volume em Estoque</div>
        <div class="kpi-value">${totalStockUnits} un</div>
        <div class="kpi-sub">Total físico em depósito</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Valor a Preço de Venda</div>
        <div class="kpi-value" style="color:#059669">${formatCurrency(totalStockValueSale)}</div>
        <div class="kpi-sub">Faturamento potencial</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Valor a Preço de Custo</div>
        <div class="kpi-value" style="color:#0284c7">${formatCurrency(totalStockValueCost)}</div>
        <div class="kpi-sub">Capital imobilizado</div>
      </div>
    </div>

    <div class="section-heading">
      <span>Inventário Completo de Produtos</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Produto</th>
          <th>Dosagem</th>
          <th>Categoria</th>
          <th class="text-right" style="width:90px">Preço Venda</th>
          <th class="text-right" style="width:90px">Preço Custo</th>
          <th class="text-center" style="width:80px">Estoque</th>
          <th class="text-right" style="width:100px">Total Venda</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((p, idx) => {
          const cost = (p as any).costPrice || 0;
          const stock = p.stock || 0;
          const totalVal = (p.price || 0) * stock;
          return `<tr>
            <td class="text-center" style="color:#64748b">${idx + 1}</td>
            <td class="font-bold">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.dosage || '—')}</td>
            <td>${escapeHtml(p.category || 'Geral')}</td>
            <td class="text-right font-bold">${formatCurrency(p.price || 0)}</td>
            <td class="text-right">${cost > 0 ? formatCurrency(cost) : '—'}</td>
            <td class="text-center font-bold" style="color:${stock <= 0 ? '#e11d48' : stock < 5 ? '#d97706' : '#059669'}">${stock} un</td>
            <td class="text-right font-bold">${formatCurrency(totalVal)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="footer-note">
      <span>Relatório emitido para auditoria de estoque e inventário.</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>

    <div class="signature-block">
      <div class="signature-line">Conferente do Estoque</div>
      <div class="signature-line">Gerência / Farmacêutico</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Inventário de Produtos</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    <div class="report-title">INVENTÁRIO / ESTOQUE</div>
    <div class="muted">Cat: ${escapeHtml(categoryFilter)} • ${products.length} itens</div>
    <div class="muted">Emissão: ${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="divider-double"></div>

  <div class="section-title">RESUMO DE ESTOQUE</div>
  <div class="row"><span>Total de Produtos:</span><span class="val">${products.length} itens</span></div>
  <div class="row"><span>Unidades Físicas:</span><span class="val">${totalStockUnits} un</span></div>
  <div class="row bold"><span>VALOR (VENDA):</span><span class="val">${formatCurrency(totalStockValueSale)}</span></div>
  ${totalStockValueCost > 0 ? `<div class="row"><span>Valor (Custo):</span><span class="val">${formatCurrency(totalStockValueCost)}</span></div>` : ''}

  <div class="divider"></div>
  <div class="section-title">PRODUTOS & QUANTIDADES</div>
  ${products.map((p) => `
    <div class="item-block">
      <div class="row small">
        <span class="item-name">${escapeHtml(p.name)} ${p.dosage ? `(${escapeHtml(p.dosage)})` : ''}</span>
        <span class="val">${p.stock || 0} un</span>
      </div>
      <div class="muted" style="font-size:0.82em">Preço: ${formatCurrency(p.price || 0)}</div>
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="center muted">
    <div>Fim da Listagem de Estoque</div>
    <div>${escapeHtml(nowFormatted)}${printedBy ? ` • ${escapeHtml(printedBy)}` : ''}</div>
  </div>

  <div class="footer-signatures">
    <div class="line-sign"></div>
    <div class="muted">Conferente</div>
  </div>
</body>
</html>`;
}

// =========================================================================
// 5. IMPRESSÃO DE PEDIDO INDIVIDUAL (Order) - A4, 80mm, 50mm
// =========================================================================
export interface OrderPrintOptions extends BasePrintOptions {
  paperWidth?: 58 | 80;
}

export function buildOrderPrintHtml(order: Order, options: OrderPrintOptions, format: ReportPrintFormat): string {
  const {
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
    storeSettings?.siteUrl ? storeSettings.siteUrl.replace(/^https?:\/\//, '') : '',
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
  ].filter((line) => line && line.trim());

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Pedido ${escapeHtml(order.orderNumber)} - ${escapeHtml(storeName)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge" style="font-size:16px;">PEDIDO #${escapeHtml(order.orderNumber)}</div>
        <div class="meta-box">Data do Pedido: <strong>${formatDateTime(order.createdAt)}</strong></div>
        <div class="meta-box">Situação: <strong style="text-transform:uppercase;">${escapeHtml(order.status)}</strong></div>
        <div class="meta-box">Impresso em: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <!-- Dados do Cliente e Entrega -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="font-size:10px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:4px;">DADOS DO CLIENTE</div>
        <div style="font-size:12px; font-weight:700; color:#0f172a;">${escapeHtml(order.customer?.name || 'Cliente')}</div>
        ${order.customer?.phone ? `<div style="font-size:10.5px; color:#334155; margin-top:2px;"><strong>Telefone / WhatsApp:</strong> ${escapeHtml(order.customer.phone)}</div>` : ''}
        ${order.customer?.cpf ? `<div style="font-size:10.5px; color:#334155; margin-top:2px;"><strong>CPF:</strong> ${escapeHtml(order.customer.cpf)}</div>` : ''}
        ${order.customer?.email ? `<div style="font-size:10.5px; color:#334155; margin-top:2px;"><strong>Email:</strong> ${escapeHtml(order.customer.email)}</div>` : ''}
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="font-size:10px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:4px;">ENDEREÇO DE ENTREGA</div>
        ${addressLines.length > 0 ? addressLines.map(l => `<div style="font-size:10.5px; color:#334155; margin-top:2px;">${escapeHtml(l)}</div>`).join('') : '<div style="font-size:10.5px; color:#64748b; font-style:italic;">Retirada no balcão / Endereço não informado</div>'}
        ${order.trackingCode ? `<div style="font-size:10.5px; color:#0284c7; font-weight:700; margin-top:4px;">Rastreio: ${escapeHtml(order.trackingCode)}</div>` : ''}
      </div>
    </div>

    <!-- Itens do Pedido -->
    <div class="section-heading">
      <span>Itens do Pedido (${totalUnits} ${totalUnits === 1 ? 'unidade' : 'unidades'})</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:35px">#</th>
          <th>Descrição do Produto</th>
          <th>Dosagem / Apresentação</th>
          <th class="text-center" style="width:70px">Qtd</th>
          <th class="text-right" style="width:110px">Preço Unit.</th>
          <th class="text-right" style="width:110px">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const qty = it.quantity || 1;
          const unitPrice = it.product?.price || 0;
          const sub = unitPrice * qty;
          return `<tr>
            <td class="text-center" style="color:#64748b">${idx + 1}</td>
            <td class="font-bold">${escapeHtml(it.product?.name || 'Produto')}</td>
            <td>${escapeHtml(it.product?.dosage || '—')}</td>
            <td class="text-center font-bold">${qty}</td>
            <td class="text-right">${formatCurrency(unitPrice)}</td>
            <td class="text-right font-bold">${formatCurrency(sub)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- Totais e Pagamento -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top:10px;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="font-size:10px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:6px;">FORMA DE PAGAMENTO</div>
        <div style="font-size:12px; font-weight:700;">${escapeHtml(order.paymentMethod || 'A Combinar')}</div>
        ${hasPaymentInfo ? `
          <div style="font-size:10.5px; margin-top:4px;"><strong>Valor Pago:</strong> ${formatCurrency(paid)}</div>
          ${remaining > 0 ? `<div style="font-size:10.5px; color:#e11d48; font-weight:700; margin-top:2px;">Saldo Pendente: ${formatCurrency(remaining)}</div>` : ''}
          ${remaining > 0 && order.dueDate ? `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">Vencimento: ${order.dueDate}</div>` : ''}
        ` : ''}
        ${order.notes ? `
          <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #cbd5e1; font-size:10px; color:#475569;">
            <strong>Observações:</strong> ${escapeHtml(order.notes)}
          </div>
        ` : ''}
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <table style="margin-bottom:0;">
          <tbody>
            <tr>
              <td style="border:none; padding:3px 0;">Subtotal dos Itens:</td>
              <td class="text-right" style="border:none; padding:3px 0;">${formatCurrency(order.subtotal ?? total)}</td>
            </tr>
            ${(order.shipping || 0) > 0 ? `
              <tr>
                <td style="border:none; padding:3px 0;">Frete:</td>
                <td class="text-right" style="border:none; padding:3px 0;">${formatCurrency(order.shipping || 0)}</td>
              </tr>
            ` : ''}
            ${(order.additionalAmount || 0) > 0 ? `
              <tr>
                <td style="border:none; padding:3px 0;">Acréscimo:</td>
                <td class="text-right" style="border:none; padding:3px 0;">+ ${formatCurrency(order.additionalAmount || 0)}</td>
              </tr>
            ` : ''}
            ${(order.discount || 0) > 0 ? `
              <tr>
                <td style="border:none; padding:3px 0; color:#059669;">Desconto:</td>
                <td class="text-right" style="border:none; padding:3px 0; color:#059669;">- ${formatCurrency(order.discount || 0)}</td>
              </tr>
            ` : ''}
            <tr style="border-top:2px solid #0f172a;">
              <td style="border:none; padding:6px 0 0; font-size:13px; font-weight:800;">VALOR TOTAL:</td>
              <td class="text-right" style="border:none; padding:6px 0 0; font-size:14px; font-weight:800; color:#0f172a;">${formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Canhoto de Entrega / Assinatura -->
    <div style="margin-top:24px; padding:12px; border:1px dashed #94a3b8; border-radius:6px; background:#fafafa;">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; color:#475569; margin-bottom:14px;">
        <span><strong>COMPROVANTE DE ENTREGA / RECEBIMENTO</strong> — PEDIDO #${escapeHtml(order.orderNumber)}</span>
        <span>${escapeHtml(storeName)}</span>
      </div>
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; align-items:flex-end;">
        <div>
          <div style="border-bottom:1px solid #0f172a; height:24px;"></div>
          <div style="font-size:9px; color:#475569; margin-top:3px;">Nome legível e assinatura de quem recebeu</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #0f172a; height:24px;"></div>
          <div style="font-size:9px; color:#475569; margin-top:3px;">Data do recebimento: _____/_____/_________</div>
        </div>
      </div>
    </div>

    <div class="footer-note" style="margin-top:14px;">
      <span>Agradecemos pela preferência! Documento auxiliar de entrega e conferência.</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Pedido ${escapeHtml(order.orderNumber)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contacts.map((c) => `<div class="muted">${escapeHtml(c)}</div>`).join('')}
  </div>

  <div class="divider"></div>

  <div class="center">
    <div class="muted">PEDIDO</div>
    <div class="report-title">${escapeHtml(order.orderNumber)}</div>
    <div class="muted">${formatDateTime(order.createdAt)}</div>
    <div style="margin-top:1.5mm"><span class="tag">${escapeHtml(order.status)}</span></div>
  </div>

  <div class="divider"></div>
  <div class="section-title">CLIENTE</div>
  <div style="font-weight:700">${escapeHtml(order.customer?.name || 'Cliente')}</div>
  ${order.customer?.phone ? `<div>Tel: ${escapeHtml(order.customer.phone)}</div>` : ''}
  ${order.customer?.cpf ? `<div>CPF: ${escapeHtml(order.customer.cpf)}</div>` : ''}
  ${addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}

  <div class="divider"></div>
  <div class="section-title">ITENS (${totalUnits} ${totalUnits === 1 ? 'un' : 'unidades'})</div>
  ${items.map((i) => {
    const qty = i.quantity || 1;
    const price = i.product?.price || 0;
    const name = [i.product?.name || 'Produto', i.product?.dosage].filter(Boolean).join(' ');
    return `<div class="item-block">
      <div class="item-name">${qty}x ${escapeHtml(name)}</div>
      <div class="row small">
        <span>${qty} x ${formatCurrency(price)}</span>
        <span class="val">${formatCurrency(price * qty)}</span>
      </div>
    </div>`;
  }).join('')}

  <div class="divider"></div>
  <div class="row"><span>Subtotal:</span><span class="val">${formatCurrency(order.subtotal ?? total)}</span></div>
  ${(order.shipping || 0) > 0 ? `<div class="row"><span>Frete:</span><span class="val">${formatCurrency(order.shipping)}</span></div>` : ''}
  ${(order.additionalAmount || 0) > 0 ? `<div class="row"><span>Acréscimo:</span><span class="val">+ ${formatCurrency(order.additionalAmount)}</span></div>` : ''}
  ${(order.discount || 0) > 0 ? `<div class="row"><span>Desconto:</span><span class="val">- ${formatCurrency(order.discount)}</span></div>` : ''}
  <div class="row large" style="margin-top:1.5mm"><span>TOTAL:</span><span class="val">${formatCurrency(total)}</span></div>

  <div class="divider"></div>
  <div class="section-title">PAGAMENTO</div>
  <div class="row"><span>Método:</span><span class="val">${escapeHtml(order.paymentMethod || 'A Combinar')}</span></div>
  ${hasPaymentInfo ? `
    <div class="row"><span>Valor Pago:</span><span class="val">${formatCurrency(paid)}</span></div>
    ${remaining > 0 ? `<div class="row bold"><span>A RECEBER:</span><span class="val">${formatCurrency(remaining)}</span></div>` : ''}
  ` : ''}
  ${order.trackingCode ? `<div class="row small"><span>Rastreio:</span><span class="val">${escapeHtml(order.trackingCode)}</span></div>` : ''}

  ${order.notes ? `
    <div class="divider"></div>
    <div class="section-title">OBSERVAÇÕES</div>
    <div style="font-size:0.88em;white-space:pre-wrap;">${escapeHtml(order.notes)}</div>
  ` : ''}

  <div class="divider"></div>
  <div class="center muted">
    <div style="font-weight:700">Obrigado pela preferência!</div>
    <div style="margin-top:1mm">*** NÃO É DOCUMENTO FISCAL ***</div>
    <div style="margin-top:1mm">Impresso em ${escapeHtml(nowFormatted)}${printedBy ? ` por ${escapeHtml(printedBy)}` : ''}</div>
  </div>
</body>
</html>`;
}

// =========================================================================
// 6. RELATÓRIO DE PREPARAÇÃO / SEPARAÇÃO DE PEDIDOS ATIVOS DO CAIXA
// =========================================================================
export interface ActiveOrdersReportPrintOptions extends BasePrintOptions {
  orders: Order[];
  title?: string;
  subtitle?: string;
  metrics?: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
  };
}

export function buildActiveOrdersPreparationReportHtml(
  options: ActiveOrdersReportPrintOptions,
  format: ReportPrintFormat
): string {
  const {
    orders,
    storeSettings,
    storeName = storeSettings?.storeName || 'Glow Imports Farma',
    printedBy,
    title = 'RELATÓRIO DE PEDIDOS ATIVOS (CAIXA ABERTO)',
    subtitle = 'Guia de Preparação e Separação de Pedidos dos Clientes',
    metrics,
  } = options;

  const nowFormatted = formatDateTime(new Date());
  const css = getBaseCss(format);
  const contacts = [
    storeSettings?.whatsappDisplay ? `WhatsApp: ${storeSettings.whatsappDisplay}` : '',
  ].filter(Boolean);

  // Consolidação de Produtos a Separar / Fazer
  const productMap = new Map<
    string,
    { name: string; dosage: string; totalQty: number; ordersCount: number; orderNumbers: string[] }
  >();

  let totalItemsCount = 0;
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const pName = item.product?.name || 'Produto sem nome';
      const pDosage = item.product?.dosage || '';
      const key = `${pName.trim().toLowerCase()}_${pDosage.trim().toLowerCase()}`;
      const qty = item.quantity || 1;
      totalItemsCount += qty;

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: pName,
          dosage: pDosage,
          totalQty: 0,
          ordersCount: 0,
          orderNumbers: [],
        });
      }
      const pData = productMap.get(key)!;
      pData.totalQty += qty;
      pData.ordersCount += 1;
      if (!pData.orderNumbers.includes(o.orderNumber)) {
        pData.orderNumbers.push(o.orderNumber);
      }
    });
  });

  const consolidatedProducts = Array.from(productMap.values()).sort((a, b) => b.totalQty - a.totalQty);

  const totalRevenue =
    metrics?.totalRevenue ?? orders.reduce((acc, o) => acc + (o.status !== 'Cancelado' ? Number(o.total || 0) : 0), 0);
  const totalPaid =
    metrics?.totalPaid ??
    orders.reduce((acc, o) => {
      if (o.status === 'Cancelado') return acc;
      return acc + (o.paidAmount ?? (['Pago', 'Entregue', 'Enviado'].includes(o.status) ? Number(o.total || 0) : 0));
    }, 0);
  const totalPending =
    metrics?.totalPending ??
    orders.reduce((acc, o) => {
      if (o.status === 'Cancelado') return acc;
      const paid = o.paidAmount ?? (['Pago', 'Entregue', 'Enviado'].includes(o.status) ? Number(o.total || 0) : 0);
      return acc + Math.max(0, Number(o.total || 0) - paid);
    }, 0);

  if (format === 'a4') {
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(storeName)}</title>
  <style>
    ${css}
    .prep-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
      background: #fff;
      page-break-inside: avoid;
    }
    .prep-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .check-box {
      width: 14px;
      height: 14px;
      border: 1.5px solid #0f172a;
      display: inline-block;
      border-radius: 3px;
      margin-right: 6px;
      vertical-align: middle;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border: 1px solid #0f172a;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="brand-title">${escapeHtml(storeName)}</div>
        <div class="brand-subtitle">${escapeHtml(contacts.join(' • '))}</div>
      </div>
      <div>
        <div class="report-badge">${escapeHtml(title)}</div>
        <div class="meta-box">${escapeHtml(subtitle)}</div>
        <div class="meta-box">Emissão: ${escapeHtml(nowFormatted)}${printedBy ? ` • Operador: ${escapeHtml(printedBy)}` : ''}</div>
      </div>
    </div>

    <!-- KPIs do Caixa Aberto -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Pedidos no Caixa</div>
        <div class="kpi-value">${orders.length} pedidos</div>
        <div class="kpi-sub">Sessão ativa em andamento</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Itens / Frascos a Fazer</div>
        <div class="kpi-value" style="color:#0284c7">${totalItemsCount} unidades</div>
        <div class="kpi-sub">${consolidatedProducts.length} produtos diferentes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Faturamento do Caixa</div>
        <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
        <div class="kpi-sub">Total bruto dos pedidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Quitado / Pendente</div>
        <div class="kpi-value" style="color:#059669">${formatCurrency(totalPaid)}</div>
        <div class="kpi-sub" style="color:#e11d48">Pendente: ${formatCurrency(totalPending)}</div>
      </div>
    </div>

    <!-- SEÇÃO 1: ROMANEIO DE SEPARAÇÃO (PRODUTOS CONSOLIDADOS A PREPARAR) -->
    <div class="section-heading">
      <span>📦 1. GUIA DE SEPARAÇÃO & PRODUÇÃO CONSOLIDADA (TOTAL A SEPARAR)</span>
      <span style="font-size:9.5px;color:#64748b;text-transform:none">Marque [X] conforme for separando do estoque</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px" class="text-center">Sep.</th>
          <th>Produto & Substância</th>
          <th style="width:130px">Dosagem</th>
          <th class="text-center" style="width:100px">QTD TOTAL</th>
          <th class="text-center" style="width:90px">Em Pedidos</th>
          <th>Nos Pedidos Nº</th>
        </tr>
      </thead>
      <tbody>
        ${consolidatedProducts.map((p) => `<tr>
          <td class="text-center"><span class="check-box"></span></td>
          <td class="font-bold">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.dosage || '—')}</td>
          <td class="text-center font-bold" style="font-size:12px;color:#0284c7;">${p.totalQty} un</td>
          <td class="text-center">${p.ordersCount}x</td>
          <td style="font-size:9px;color:#475569;">${escapeHtml(p.orderNumbers.join(', '))}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- SEÇÃO 2: DETALHAMENTO DE CADA PEDIDO DOS CLIENTES -->
    <div class="section-heading" style="margin-top:20px;">
      <span>📋 2. RELAÇÃO INDIVIDUAL DE PEDIDOS ATIVOS (${orders.length} PEDIDOS)</span>
      <span style="font-size:9.5px;color:#64748b;text-transform:none">Separar, etiquetar e montar pacotes</span>
    </div>

    ${orders.map((o, idx) => {
      const a = o.address;
      const addrStr = [
        [a?.street, a?.number].filter(Boolean).join(', ') + (a?.complement ? ` (${a.complement})` : ''),
        [a?.neighborhood, a?.city, a?.state].filter(Boolean).join(' - '),
        a?.zipCode ? `CEP: ${a.zipCode}` : '',
      ].filter(Boolean).join(' | ');

      const orderItems = o.items || [];
      const orderUnits = orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

      return `
        <div class="prep-box">
          <div class="prep-header">
            <div>
              <span class="check-box"></span>
              <strong style="font-size:12px;">#${idx + 1} • Pedido ${escapeHtml(o.orderNumber)}</strong>
              <span style="color:#64748b;font-size:10px;margin-left:8px;">${formatDateTime(o.createdAt)}</span>
            </div>
            <div>
              <span class="badge-status">${escapeHtml(o.status)}</span>
              <span style="margin-left:8px;font-weight:800;font-size:12px;">${formatCurrency(o.total || 0)}</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px;margin-bottom:6px;font-size:10px;">
            <div>
              <div><strong>Cliente:</strong> ${escapeHtml(o.customer?.name || 'Cliente')}</div>
              ${o.customer?.phone ? `<div><strong>WhatsApp/Tel:</strong> ${escapeHtml(o.customer.phone)}</div>` : ''}
              ${o.customer?.cpf ? `<div><strong>CPF:</strong> ${escapeHtml(o.customer.cpf)}</div>` : ''}
            </div>
            <div>
              <div><strong>Entrega:</strong> ${escapeHtml(addrStr || 'Retirada no balcão')}</div>
              <div><strong>Pagamento:</strong> ${escapeHtml(o.paymentMethod || 'A Combinar')}</div>
            </div>
          </div>

          <table style="margin-bottom:4px;font-size:10px;">
            <thead>
              <tr>
                <th style="width:30px" class="text-center">OK</th>
                <th style="width:50px" class="text-center">Qtd</th>
                <th>Item / Descrição</th>
                <th style="width:110px">Dosagem</th>
                <th class="text-right" style="width:90px">Total Item</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((it) => {
                const qty = it.quantity || 1;
                const pPrice = it.product?.price || 0;
                return `<tr>
                  <td class="text-center"><span class="check-box" style="width:12px;height:12px;"></span></td>
                  <td class="text-center font-bold" style="color:#0284c7;">${qty}x</td>
                  <td class="font-bold">${escapeHtml(it.product?.name || 'Produto')}</td>
                  <td>${escapeHtml(it.product?.dosage || '—')}</td>
                  <td class="text-right">${formatCurrency(pPrice * qty)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          ${o.notes ? `
            <div style="margin-top:4px;padding:4px 8px;background:#f8fafc;border-left:3px solid #0284c7;font-size:9.5px;color:#334155;">
              <strong>Observação do Pedido:</strong> ${escapeHtml(o.notes)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}

    <div class="footer-note">
      <span>Relatório de separação e expedição para o caixa ativo da farmácia.</span>
      <span>Impresso em ${escapeHtml(nowFormatted)}</span>
    </div>

    <div class="signature-block">
      <div class="signature-line">Conferência / Separação</div>
      <div class="signature-line">Expedição / Entrega</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Térmicas (80mm ou 50mm)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(storeName)}</div>
    ${contacts.map((c) => `<div class="muted">${escapeHtml(c)}</div>`).join('')}
    <div class="report-title">PEDIDOS DO CAIXA ATIVO</div>
    <div class="muted">GUIA DE SEPARAÇÃO / PRODUÇÃO</div>
    <div class="muted">${orders.length} pedidos • ${totalItemsCount} itens</div>
    <div class="muted">Impresso: ${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="divider-double"></div>

  <div class="section-title">RESUMO DO CAIXA</div>
  <div class="row large"><span>FATURAMENTO:</span><span class="val">${formatCurrency(totalRevenue)}</span></div>
  <div class="row"><span>Total Recebido:</span><span class="val">${formatCurrency(totalPaid)}</span></div>
  <div class="row"><span>Saldo a Receber:</span><span class="val">${formatCurrency(totalPending)}</span></div>
  <div class="row bold"><span>Total de Frascos:</span><span class="val">${totalItemsCount} un</span></div>

  <div class="divider"></div>
  <div class="section-title">1. TOTAL A SEPARAR (ROMANEIO)</div>
  ${consolidatedProducts.map((p) => `
    <div class="item-block">
      <div class="row small">
        <span class="item-name">[ ] ${p.totalQty}x ${escapeHtml(p.name)}</span>
        <span class="val">${escapeHtml(p.dosage || '')}</span>
      </div>
      <div class="muted" style="font-size:0.82em">P/ pedidos: ${escapeHtml(p.orderNumbers.join(', '))}</div>
    </div>
  `).join('')}

  <div class="divider-double"></div>
  <div class="section-title">2. PEDIDOS DOS CLIENTES (${orders.length})</div>
  ${orders.map((o) => `
    <div class="item-block" style="border-bottom:1px dashed #000;padding-bottom:1.5mm;margin-bottom:2mm;">
      <div class="row">
        <span class="item-name">#${escapeHtml(o.orderNumber)} - ${escapeHtml(o.customer?.name || 'Cliente')}</span>
        <span class="val">${formatCurrency(o.total || 0)}</span>
      </div>
      <div class="muted" style="font-size:0.82em">${escapeHtml(o.status)} • ${escapeHtml(o.paymentMethod || 'A Combinar')}</div>
      ${o.customer?.phone ? `<div class="muted" style="font-size:0.82em">Tel: ${escapeHtml(o.customer.phone)}</div>` : ''}
      <div style="margin-top:1mm;">
        ${(o.items || []).map((it) => `
          <div class="row small">
            <span>[ ] ${it.quantity}x ${escapeHtml(it.product?.name || 'Item')} ${it.product?.dosage ? `(${escapeHtml(it.product.dosage)})` : ''}</span>
          </div>
        `).join('')}
      </div>
      ${o.notes ? `<div class="muted" style="font-size:0.8em;font-style:italic;margin-top:0.5mm;">Obs: ${escapeHtml(o.notes)}</div>` : ''}
    </div>
  `).join('')}

  <div class="divider"></div>
  <div class="center muted">
    <div>Fim da Listagem de Preparação</div>
    <div>${escapeHtml(nowFormatted)}${printedBy ? ` • ${escapeHtml(printedBy)}` : ''}</div>
  </div>

  <div class="footer-signatures">
    <div class="line-sign"></div>
    <div class="muted">Conferente / Farmacêutico</div>
  </div>
</body>
</html>`;
}


