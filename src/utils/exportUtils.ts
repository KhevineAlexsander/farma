import * as XLSX from 'xlsx';
import { Order } from '../types';

export interface ExportSalesReportOptions {
  orders: Order[];
  rankedProducts: Array<{
    name: string;
    dosage?: string;
    category?: string;
    qtySold: number;
    totalRevenue: number;
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
  timeFilterLabel: string;
  statusFilterLabel: string;
  storeName?: string;
}

/**
 * Formats a currency value for display in TXT or raw number for Excel
 */
export function formatCurrency(value: number): string {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/**
 * Formats an order address to a readable string
 */
function formatOrderAddress(order: Order): string {
  if (!order.address) return '—';
  const { street, number, complement, neighborhood, city, state, zipCode } = order.address;
  const parts: string[] = [];
  if (street) {
    parts.push(number ? `${street}, ${number}` : street);
  }
  if (complement) parts.push(complement);
  if (neighborhood) parts.push(neighborhood);
  if (city || state) parts.push(`${city || ''}${state ? `/${state}` : ''}`);
  if (zipCode) parts.push(`CEP: ${zipCode}`);
  return parts.length > 0 ? parts.join(' - ') : '—';
}

/**
 * Generates and triggers download of Excel (.xlsx) sales report with multiple worksheets
 */
export function exportSalesReportToExcel(options: ExportSalesReportOptions) {
  const {
    orders,
    rankedProducts,
    metrics,
    timeFilterLabel,
    statusFilterLabel,
    storeName = 'Peptide Imports Farma',
  } = options;

  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

  // =========================================================================
  // ABA 1: RESUMO EXECUTIVO & FINANCEIRO
  // =========================================================================
  const summaryAoa: any[][] = [
    [storeName.toUpperCase() + ' - RELATÓRIO EXECUTIVO DE VENDAS'],
    ['Emitido em:', `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`],
    ['Período Selecionado:', timeFilterLabel],
    ['Filtro de Status:', statusFilterLabel],
    [''],
    ['MÉTRICA', 'VALOR CONSOLIDADO'],
    ['Total de Pedidos Realizados', metrics.ordersCount],
    ['Faturamento Total Bruto', metrics.totalRevenue],
    ['Total Efetivamente Pago / Quitado', metrics.totalPaid],
    ['Saldo a Receber / Pendente', metrics.totalPendingBalance],
    ['Total de Unidades / Frascos Vendidos', metrics.totalUnitsSold],
    ['Ticket Médio por Pedido', metrics.averageTicket],
    ['Total de Descontos Concedidos', metrics.totalDiscounts],
    ['Total de Fretes Cobrados', metrics.totalShipping],
    [''],
    ['FORMAS DE PAGAMENTO UTILIZADAS', 'QTD PEDIDOS', 'TOTAL (R$)'],
  ];

  if (metrics.paymentMethodsBreakdown) {
    Object.entries(metrics.paymentMethodsBreakdown).forEach(([method, data]) => {
      summaryAoa.push([method, data.count, data.total]);
    });
  } else {
    const payMap: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const pm = o.paymentMethod || 'A Combinar';
      if (!payMap[pm]) payMap[pm] = { count: 0, total: 0 };
      payMap[pm].count += 1;
      payMap[pm].total += o.total || 0;
    });
    Object.entries(payMap).forEach(([method, data]) => {
      summaryAoa.push([method, data.count, data.total]);
    });
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

  // =========================================================================
  // ABA 2: RANKING COMPLETO DE PRODUTOS VENDIDOS
  // =========================================================================
  const totalUnits = metrics.totalUnitsSold > 0 ? metrics.totalUnitsSold : 1;
  const productsRows = rankedProducts.map((p, idx) => {
    const unitPrice = p.qtySold > 0 ? p.totalRevenue / p.qtySold : 0;
    const sharePct = ((p.qtySold / totalUnits) * 100).toFixed(1) + '%';
    return {
      'Posição': `${idx + 1}º`,
      'Nome do Produto / Peptídeo': p.name,
      'Dosagem': p.dosage || 'Padrão',
      'Categoria': p.category || 'Peptídeos',
      'Qtd Vendida (un.)': p.qtySold,
      'Preço Médio (R$)': Number(unitPrice.toFixed(2)),
      'Faturamento Total (R$)': Number(p.totalRevenue.toFixed(2)),
      '% do Volume Vendido': sharePct,
    };
  });

  const wsProducts = XLSX.utils.json_to_sheet(productsRows);
  wsProducts['!cols'] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos Vendidos');

  // =========================================================================
  // ABA 3: RELAÇÃO COMPLETA DE PEDIDOS DETALHADOS
  // =========================================================================
  const ordersRows = orders.map((o) => {
    const itemsDescription = (o.items || [])
      .map((item) => {
        const pName = item.product?.name || 'Produto';
        const pDosage = item.product?.dosage ? ` (${item.product.dosage})` : '';
        const qty = item.quantity || 1;
        return `${pName}${pDosage} x${qty}`;
      })
      .join('; ');

    const itemsQty = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    const orderDate = o.createdAt
      ? new Date(o.createdAt).toLocaleString('pt-BR')
      : 'Não informada';

    const paidVal = o.paidAmount !== undefined
      ? o.paidAmount
      : (['Pago', 'Enviado', 'Entregue'].includes(o.status) ? o.total : 0);
    const pendingVal = o.remainingAmount !== undefined
      ? o.remainingAmount
      : Math.max(0, (o.total || 0) - paidVal);

    return {
      'Nº Pedido': o.orderNumber || o.id,
      'Data e Hora': orderDate,
      'Status': o.status,
      'Cliente': o.customer?.name || 'Cliente',
      'Telefone': o.customer?.phone || '',
      'E-mail': o.customer?.email || '',
      'CPF': o.customer?.cpf || '',
      'Produtos / Itens': itemsDescription,
      'Qtd Itens': itemsQty,
      'Subtotal (R$)': Number((o.subtotal || o.total || 0).toFixed(2)),
      'Frete (R$)': Number((o.shipping || 0).toFixed(2)),
      'Desconto (R$)': Number((o.discount || 0).toFixed(2)),
      'Valor Total (R$)': Number((o.total || 0).toFixed(2)),
      'Valor Pago (R$)': Number((paidVal || 0).toFixed(2)),
      'Saldo a Receber (R$)': Number((pendingVal || 0).toFixed(2)),
      'Forma de Pagamento': o.paymentMethod || 'PIX',
      'Código de Rastreio': o.trackingCode || '—',
      'Endereço Completo': formatOrderAddress(o),
      'Cidade': o.address?.city || '—',
      'UF': o.address?.state || '—',
      'Baixado por': o.clearedBy || '—',
      'Data da Baixa': o.clearedManuallyAt ? new Date(o.clearedManuallyAt).toLocaleString('pt-BR') : '—',
    };
  });

  const wsOrders = XLSX.utils.json_to_sheet(ordersRows);
  wsOrders['!cols'] = [
    { wch: 14 }, // Nº Pedido
    { wch: 20 }, // Data
    { wch: 16 }, // Status
    { wch: 28 }, // Cliente
    { wch: 18 }, // Telefone
    { wch: 26 }, // Email
    { wch: 16 }, // CPF
    { wch: 45 }, // Produtos
    { wch: 10 }, // Qtd
    { wch: 14 }, // Subtotal
    { wch: 12 }, // Frete
    { wch: 14 }, // Desconto
    { wch: 16 }, // Total
    { wch: 14 }, // Pago
    { wch: 18 }, // Saldo
    { wch: 20 }, // Pagamento
    { wch: 18 }, // Rastreio
    { wch: 40 }, // Endereço
    { wch: 20 }, // Cidade
    { wch: 6 },  // UF
    { wch: 22 }, // Baixado por
    { wch: 20 }, // Data Baixa
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Relação de Pedidos');

  // =========================================================================
  // ABA 4: CLIENTES & COMPRADORES
  // =========================================================================
  const clientMap = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string;
      cpf: string;
      city: string;
      state: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }
  >();

  orders.forEach((o) => {
    const key = (o.customer?.name || 'Cliente').trim().toLowerCase();
    const existing = clientMap.get(key) || {
      name: o.customer?.name || 'Cliente',
      phone: o.customer?.phone || '',
      email: o.customer?.email || '',
      cpf: o.customer?.cpf || '',
      city: o.address?.city || '',
      state: o.address?.state || '',
      ordersCount: 0,
      totalSpent: 0,
      lastOrderDate: o.createdAt || '',
    };
    existing.ordersCount += 1;
    existing.totalSpent += o.total || 0;
    if (o.createdAt && (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate))) {
      existing.lastOrderDate = o.createdAt;
    }
    clientMap.set(key, existing);
  });

  const clientsRows = Array.from(clientMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map((c, idx) => ({
      'Ranking': `${idx + 1}º`,
      'Cliente': c.name,
      'Telefone': c.phone || '—',
      'E-mail': c.email || '—',
      'CPF': c.cpf || '—',
      'Cidade / UF': c.city ? `${c.city} - ${c.state || ''}` : '—',
      'Qtd Pedidos': c.ordersCount,
      'Total Comprado (R$)': Number(c.totalSpent.toFixed(2)),
      'Ticket Médio (R$)': Number((c.totalSpent / c.ordersCount).toFixed(2)),
      'Última Compra': c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('pt-BR') : '—',
    }));

  const wsClients = XLSX.utils.json_to_sheet(clientsRows);
  wsClients['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 18 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');

  const safePeriod = timeFilterLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `relatorio_vendas_completo_${safePeriod}_${dateStr}_${timeStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Generates and triggers download of clean TXT sales report with full details
 */
export function exportSalesReportToTxt(options: ExportSalesReportOptions) {
  const {
    orders,
    rankedProducts,
    metrics,
    timeFilterLabel,
    statusFilterLabel,
    storeName = 'Peptide Imports Farma',
  } = options;

  const nowFormatted = new Date().toLocaleString('pt-BR');
  const line = '═'.repeat(80);
  const subline = '─'.repeat(80);

  let text = '';
  text += `${line}\n`;
  text += `                     ${storeName.toUpperCase()}\n`;
  text += `                RELATÓRIO COMPLETO DE VENDAS & PEDIDOS\n`;
  text += `${line}\n`;
  text += `Data de Emissão:     ${nowFormatted}\n`;
  text += `Período Analisado:   ${timeFilterLabel}\n`;
  text += `Filtro de Status:    ${statusFilterLabel}\n`;
  text += `Total de Pedidos:    ${orders.length} pedidos\n`;
  text += `Total de Produtos:   ${rankedProducts.length} itens distintos vendidos\n`;
  text += `${line}\n\n`;

  // 1. RESUMO EXECUTIVO
  text += `1. RESUMO EXECUTIVO & FINANCEIRO\n`;
  text += `${subline}\n`;
  text += `• Faturamento Bruto Total:       ${formatCurrency(metrics.totalRevenue)}\n`;
  text += `• Total Efetivamente Pago:       ${formatCurrency(metrics.totalPaid)}\n`;
  text += `• Saldo Pendente a Receber:      ${formatCurrency(metrics.totalPendingBalance)}\n`;
  text += `• Total de Pedidos Faturados:    ${metrics.ordersCount} pedidos\n`;
  text += `• Volume Total de Itens:         ${metrics.totalUnitsSold} unidades\n`;
  text += `• Ticket Médio por Pedido:       ${formatCurrency(metrics.averageTicket)}\n`;
  text += `• Total de Descontos Aplicados:  ${formatCurrency(metrics.totalDiscounts)}\n`;
  text += `• Total de Fretes Cobrados:      ${formatCurrency(metrics.totalShipping)}\n\n`;

  // Formas de Pagamento
  text += `Formas de Pagamento:\n`;
  const payMap: Record<string, { count: number; total: number }> = {};
  orders.forEach((o) => {
    const pm = o.paymentMethod || 'A Combinar';
    if (!payMap[pm]) payMap[pm] = { count: 0, total: 0 };
    payMap[pm].count += 1;
    payMap[pm].total += o.total || 0;
  });
  Object.entries(payMap).forEach(([method, data]) => {
    text += `  - ${method.padEnd(25)}: ${data.count.toString().padStart(3)} pedido(s) • ${formatCurrency(data.total)}\n`;
  });
  text += `\n${subline}\n\n`;

  // 2. RANKING DE PRODUTOS VENDIDOS
  text += `2. RANKING DE PRODUTOS VENDIDOS (${rankedProducts.length} ITENS NO PERÍODO)\n`;
  text += `${subline}\n`;
  if (rankedProducts.length === 0) {
    text += `Nenhum produto computado no período selecionado.\n`;
  } else {
    rankedProducts.forEach((prod, idx) => {
      const pos = `${idx + 1}º`.padStart(4);
      const dosageStr = prod.dosage ? ` (${prod.dosage})` : '';
      const totalUnits = metrics.totalUnitsSold > 0 ? metrics.totalUnitsSold : 1;
      const pct = ((prod.qtySold / totalUnits) * 100).toFixed(1);
      const unitPrice = prod.qtySold > 0 ? prod.totalRevenue / prod.qtySold : 0;

      text += `${pos} ${prod.name}${dosageStr}\n`;
      text += `     Quantidade: ${prod.qtySold} un. (${pct}% do volume) | Preço Médio: ${formatCurrency(unitPrice)} | Receita: ${formatCurrency(prod.totalRevenue)}\n`;
    });
  }
  text += `\n${subline}\n\n`;

  // 3. RELAÇÃO COMPLETA DE PEDIDOS
  text += `3. RELAÇÃO COMPLETA DE PEDIDOS (${orders.length} PEDIDOS)\n`;
  text += `${subline}\n`;
  if (orders.length === 0) {
    text += `Nenhum pedido encontrado para os filtros selecionados.\n`;
  } else {
    orders.forEach((o, idx) => {
      const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleString('pt-BR') : 'Data não informada';
      const client = o.customer?.name || 'Cliente';
      const phone = o.customer?.phone || 'Sem telefone';
      const email = o.customer?.email ? ` | Email: ${o.customer.email}` : '';
      const cpf = o.customer?.cpf ? ` | CPF: ${o.customer.cpf}` : '';
      const paid = o.paidAmount !== undefined
        ? o.paidAmount
        : (['Pago', 'Enviado', 'Entregue'].includes(o.status) ? o.total : 0);
      const pending = o.remainingAmount !== undefined
        ? o.remainingAmount
        : Math.max(0, (o.total || 0) - (paid || 0));

      text += `[${idx + 1}] PEDIDO ${o.orderNumber || o.id} - ${orderDate} - STATUS: ${o.status.toUpperCase()}\n`;
      text += `    Cliente:    ${client} | Tel: ${phone}${email}${cpf}\n`;

      // Itens
      text += `    Itens:      `;
      if (o.items && o.items.length > 0) {
        const itemStrs = o.items.map((it) => {
          const name = it.product?.name || 'Produto';
          const dosage = it.product?.dosage ? ` (${it.product.dosage})` : '';
          const qty = it.quantity || 1;
          const price = (it.product?.price || 0) * qty;
          return `${qty}x ${name}${dosage} [${formatCurrency(price)}]`;
        });
        text += itemStrs.join(', ') + '\n';
      } else {
        text += `Nenhum item listado\n`;
      }

      text += `    Financeiro: Total: ${formatCurrency(o.total || 0)} | Pago: ${formatCurrency(paid || 0)} | Saldo: ${formatCurrency(pending)} | Pagto: ${o.paymentMethod || 'PIX'}\n`;

      if (o.trackingCode) {
        text += `    Logística:  Rastreio: ${o.trackingCode}\n`;
      }

      const addressStr = formatOrderAddress(o);
      if (addressStr !== '—') {
        text += `    Endereço:   ${addressStr}\n`;
      }

      if (o.clearedBy || o.clearedManuallyAt) {
        text += `    Baixa:      Operador: ${o.clearedBy || 'Sistema'}${o.clearedManuallyAt ? ` em ${new Date(o.clearedManuallyAt).toLocaleString('pt-BR')}` : ''}\n`;
      }

      text += `    ────────────────────────────────────────────────────────────────────\n`;
    });
  }
  text += `\n${subline}\n\n`;

  // 4. TOP CLIENTES
  text += `4. CLIENTES COM MAIOR VOLUME DE COMPRAS\n`;
  text += `${subline}\n`;
  const clientMap = new Map<string, { name: string; phone: string; count: number; total: number }>();
  orders.forEach((o) => {
    const key = (o.customer?.name || 'Cliente').trim().toLowerCase();
    const existing = clientMap.get(key) || {
      name: o.customer?.name || 'Cliente',
      phone: o.customer?.phone || '',
      count: 0,
      total: 0,
    };
    existing.count += 1;
    existing.total += o.total || 0;
    clientMap.set(key, existing);
  });

  const sortedClients = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);
  sortedClients.slice(0, 30).forEach((c, idx) => {
    const pos = `${idx + 1}º`.padStart(4);
    const phoneStr = c.phone ? ` (${c.phone})` : '';
    text += `${pos} ${c.name}${phoneStr} — ${c.count} pedido(s) • Total: ${formatCurrency(c.total)}\n`;
  });

  text += `\n${line}\n`;
  text += `                FIM DO RELATÓRIO - ${storeName.toUpperCase()}\n`;
  text += `${line}\n`;

  // Trigger download with UTF-8 BOM so Windows Notepad and all editors open accents flawlessly
  const bom = '\uFEFF';
  const blob = new Blob([bom + text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safePeriod = timeFilterLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `relatorio_vendas_completo_${safePeriod}_${dateStr}.txt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Export a direct list of orders to an Excel file (.xlsx)
 */
export function exportOrdersListToExcel(
  orders: Order[],
  title: string = 'Pedidos',
  storeName: string = 'Peptide Imports Farma'
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

  const ordersRows = orders.map((o) => {
    const itemsDescription = (o.items || [])
      .map((item) => {
        const pName = item.product?.name || 'Produto';
        const pDosage = item.product?.dosage ? ` (${item.product.dosage})` : '';
        const qty = item.quantity || 1;
        return `${pName}${pDosage} x${qty}`;
      })
      .join('; ');

    const itemsQty = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    const orderDate = o.createdAt
      ? new Date(o.createdAt).toLocaleString('pt-BR')
      : 'Não informada';

    const paidVal = o.paidAmount !== undefined
      ? o.paidAmount
      : (['Pago', 'Enviado', 'Entregue'].includes(o.status) ? o.total : 0);
    const pendingVal = o.remainingAmount !== undefined
      ? o.remainingAmount
      : Math.max(0, (o.total || 0) - paidVal);

    return {
      'Nº Pedido': o.orderNumber || o.id,
      'Data e Hora': orderDate,
      'Status': o.status,
      'Cliente': o.customer?.name || 'Cliente',
      'Telefone': o.customer?.phone || '',
      'E-mail': o.customer?.email || '',
      'CPF': o.customer?.cpf || '',
      'Produtos / Itens': itemsDescription,
      'Qtd Itens': itemsQty,
      'Subtotal (R$)': Number((o.subtotal || o.total || 0).toFixed(2)),
      'Frete (R$)': Number((o.shipping || 0).toFixed(2)),
      'Desconto (R$)': Number((o.discount || 0).toFixed(2)),
      'Valor Total (R$)': Number((o.total || 0).toFixed(2)),
      'Valor Pago (R$)': Number((paidVal || 0).toFixed(2)),
      'Saldo a Receber (R$)': Number((pendingVal || 0).toFixed(2)),
      'Forma de Pagamento': o.paymentMethod || 'PIX',
      'Código de Rastreio': o.trackingCode || '—',
      'Endereço Completo': formatOrderAddress(o),
      'Cidade': o.address?.city || '—',
      'UF': o.address?.state || '—',
      'Baixado por': o.clearedBy || '—',
      'Data da Baixa': o.clearedManuallyAt ? new Date(o.clearedManuallyAt).toLocaleString('pt-BR') : '—',
    };
  });

  const ws = XLSX.utils.json_to_sheet(ordersRows);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 45 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 40 },
    { wch: 20 },
    { wch: 6 },
    { wch: 22 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `pedidos_${safeTitle}_${dateStr}_${timeStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Export a direct list of orders to a clean TXT file (.txt)
 */
export function exportOrdersListToTxt(
  orders: Order[],
  title: string = 'Pedidos',
  storeName: string = 'Peptide Imports Farma'
) {
  const line = '═'.repeat(80);
  const subline = '─'.repeat(80);
  let text = '';
  text += `${line}\n`;
  text += `                     ${storeName.toUpperCase()}\n`;
  text += `                     RELAÇÃO DE PEDIDOS (${title.toUpperCase()})\n`;
  text += `${line}\n`;
  text += `Emissão: ${new Date().toLocaleString('pt-BR')}\n`;
  text += `Total de Pedidos: ${orders.length}\n`;
  text += `${subline}\n\n`;

  orders.forEach((o, idx) => {
    const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleString('pt-BR') : 'Data não informada';
    const client = o.customer?.name || 'Cliente';
    const phone = o.customer?.phone || 'Sem telefone';
    const email = o.customer?.email ? ` | Email: ${o.customer.email}` : '';
    const cpf = o.customer?.cpf ? ` | CPF: ${o.customer.cpf}` : '';
    const paid = o.paidAmount !== undefined
      ? o.paidAmount
      : (['Pago', 'Enviado', 'Entregue'].includes(o.status) ? o.total : 0);
    const pending = o.remainingAmount !== undefined
      ? o.remainingAmount
      : Math.max(0, (o.total || 0) - (paid || 0));

    text += `[${idx + 1}] PEDIDO ${o.orderNumber || o.id} - ${orderDate} - STATUS: ${o.status.toUpperCase()}\n`;
    text += `    Cliente:    ${client} | Tel: ${phone}${email}${cpf}\n`;

    text += `    Produtos:   `;
    if (o.items && o.items.length > 0) {
      const itemStrs = o.items.map((it) => {
        const name = it.product?.name || 'Produto';
        const dosage = it.product?.dosage ? ` (${it.product.dosage})` : '';
        const qty = it.quantity || 1;
        const price = (it.product?.price || 0) * qty;
        return `${qty}x ${name}${dosage} [${formatCurrency(price)}]`;
      });
      text += itemStrs.join(', ') + '\n';
    } else {
      text += `Nenhum item listado\n`;
    }

    text += `    Financeiro: Total: ${formatCurrency(o.total || 0)} | Pago: ${formatCurrency(paid || 0)} | Saldo: ${formatCurrency(pending)} | Pagto: ${o.paymentMethod || 'PIX'}\n`;

    if (o.trackingCode) {
      text += `    Logística:  Rastreio: ${o.trackingCode}\n`;
    }

    const addressStr = formatOrderAddress(o);
    if (addressStr !== '—') {
      text += `    Endereço:   ${addressStr}\n`;
    }

    if (o.clearedBy || o.clearedManuallyAt) {
      text += `    Baixa:      Operador: ${o.clearedBy || 'Sistema'}${o.clearedManuallyAt ? ` em ${new Date(o.clearedManuallyAt).toLocaleString('pt-BR')}` : ''}\n`;
    }

    text += `    ────────────────────────────────────────────────────────────────────\n`;
  });

  text += `\n${line}\n`;
  text += `                     FIM DA LISTA DE PEDIDOS\n`;
  text += `${line}\n`;

  const bom = '\uFEFF';
  const blob = new Blob([bom + text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `pedidos_${safeTitle}_${dateStr}.txt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
