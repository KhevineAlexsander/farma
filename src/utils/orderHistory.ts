import { Order, OrderHistoryChange, OrderHistoryEntry } from '../types';

// Keeps Firestore documents well under the 1 MiB limit even for very active orders.
const MAX_HISTORY_ENTRIES = 300;

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

const EMPTY = '—';

const formatMoney = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? currency.format(v) : EMPTY);
const formatText = (v: unknown) => (v === undefined || v === null || String(v).trim() === '' ? EMPTY : String(v).trim());
const formatDate = (v: unknown) => {
  if (!v) return EMPTY;
  const d = new Date(String(v).length === 10 ? `${v}T12:00:00` : String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('pt-BR');
};
const formatBool = (v: unknown) => (v ? 'Sim' : 'Não');

const formatItems = (o: Order) =>
  (o.items || []).length === 0
    ? EMPTY
    : (o.items || [])
        .map((it) => `${it.quantity || 1}x ${[it.product?.name, it.product?.dosage].filter(Boolean).join(' ')}`)
        .join(', ');

const formatAddress = (o: Order) => {
  const a = o.address;
  if (!a) return EMPTY;
  return [
    [a.street, a.number].filter(Boolean).join(', '),
    a.complement,
    a.neighborhood,
    [a.city, a.state].filter(Boolean).join('/'),
    a.zipCode,
  ]
    .filter((p) => p && String(p).trim())
    .join(' - ') || EMPTY;
};

// Notes carry machine tags ([CAIXA_FECHADO:...], [ADICIONAL:...]) that must not show up as user edits.
const stripTags = (v: unknown) => formatText(String(v ?? '').replace(/\[(CAIXA_FECHADO|ADICIONAL):[^\]]*\]/g, ''));

const TRACKED: { label: string; read: (o: Order) => string }[] = [
  { label: 'Status', read: (o) => formatText(o.status) },
  { label: 'Forma de pagamento', read: (o) => formatText(o.paymentMethod) },
  { label: 'Itens', read: formatItems },
  { label: 'Subtotal', read: (o) => formatMoney(o.subtotal) },
  { label: 'Frete', read: (o) => formatMoney(o.shipping) },
  { label: 'Desconto', read: (o) => formatMoney(o.discount) },
  { label: 'Acréscimo', read: (o) => formatMoney(o.additionalAmount || 0) },
  { label: 'Total', read: (o) => formatMoney(o.total) },
  { label: 'Valor pago', read: (o) => formatMoney(o.paidAmount) },
  { label: 'Saldo devedor', read: (o) => formatMoney(o.remainingAmount) },
  { label: 'Vencimento', read: (o) => formatDate(o.dueDate) },
  { label: 'Código de rastreio', read: (o) => formatText(o.trackingCode) },
  { label: 'Cliente', read: (o) => formatText(o.customer?.name) },
  { label: 'Telefone', read: (o) => formatText(o.customer?.phone) },
  { label: 'E-mail', read: (o) => formatText(o.customer?.email) },
  { label: 'CPF', read: (o) => formatText(o.customer?.cpf) },
  { label: 'Endereço', read: formatAddress },
  { label: 'Observações', read: (o) => stripTags(o.notes) },
  { label: 'Baixa feita por', read: (o) => formatText(o.clearedBy) },
  { label: 'Cobranças enviadas', read: (o) => formatText(o.remindersCount ?? 0) },
  { label: 'Caixa fechado', read: (o) => formatBool(o.isClosed) },
  { label: 'Caixa', read: (o) => formatText(o.closedSessionName) },
];

/** Field-by-field differences between two versions of the same order. */
export function diffOrder(before: Order, after: Order): OrderHistoryChange[] {
  const changes: OrderHistoryChange[] = [];
  for (const { label, read } of TRACKED) {
    const from = read(before);
    const to = read(after);
    if (from !== to) changes.push({ field: label, from, to });
  }
  return changes;
}

export function createHistoryEntry(by: string, action: string, changes?: OrderHistoryChange[]): OrderHistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    by: by || 'Sistema',
    action,
    ...(changes && changes.length > 0 ? { changes } : {}),
  };
}

/** Returns `after` with a new history entry describing what changed since `before`. */
export function withHistory(before: Order, after: Order, by: string, action: string): Order {
  const changes = diffOrder(before, after);
  if (changes.length === 0) return { ...after, history: before.history };
  return appendHistory(after, createHistoryEntry(by, action, changes), before.history);
}

export function appendHistory(order: Order, entry: OrderHistoryEntry, baseHistory = order.history): Order {
  const history = [...(baseHistory || []), entry].slice(-MAX_HISTORY_ENTRIES);
  return { ...order, history };
}

/** Union of two histories (e.g. local copy + Firestore copy), so a stale copy never erases entries. */
export function mergeOrderHistory(a?: OrderHistoryEntry[], b?: OrderHistoryEntry[]): OrderHistoryEntry[] | undefined {
  if (!a?.length) return b?.length ? b : a;
  if (!b?.length) return a;
  const byId = new Map<string, OrderHistoryEntry>();
  for (const e of [...a, ...b]) if (e && e.id) byId.set(e.id, e);
  return Array.from(byId.values())
    .sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime())
    .slice(-MAX_HISTORY_ENTRIES);
}

export const formatHistoryTimestamp = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateTime.format(d);
};
