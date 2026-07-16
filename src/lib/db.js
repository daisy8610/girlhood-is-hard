import { supa } from "./supabaseClient";
import { num } from "./format";

// ============================================================
// App 內部沿用簡短好記的欄位名（item/main/sub/place/date/note），
// 畫面元件完全不用知道 Supabase 的實際 schema；
// 只有這個檔案負責兩邊互轉。
// ============================================================

// ---- providers 快取：地點/診所名稱 <-> id ----
let PROVIDERS = [];

const providerName = (id) => {
  const p = PROVIDERS.find((p) => p.id === id);
  return p ? p.name : "";
};
const providerId = (name) => {
  const p = PROVIDERS.find((p) => p.name === String(name || "").trim());
  return p ? p.id : null;
};

async function ensureProvider(name, kind) {
  const n = String(name || "").trim();
  if (!n) return null;
  const existing = providerId(n);
  if (existing) return existing;
  const { data, error } = await supa
    .from("providers")
    .insert({ name: n, kind: kind || null })
    .select("id, name, kind")
    .single();
  if (error) throw error;
  PROVIDERS = [...PROVIDERS, data];
  return data.id;
}

// ---- expenses <-> 消費紀錄 ----
const expenseToApp = (r) => ({
  id: r.id,
  date: r.spent_on,
  main: r.primary_category,
  sub: r.subcategory,
  item: r.title,
  place: providerName(r.provider_id),
  amount: num(r.amount),
  note: r.notes || "",
});
const expenseToDb = (o, providerId) => ({
  spent_on: o.date || null,
  primary_category: o.main || null,
  subcategory: o.sub || null,
  title: o.item || "（未命名）",
  provider_id: providerId,
  amount: num(o.amount),
  notes: o.note || null,
});

// ---- quotes <-> 詢價比較 ----
const quoteToApp = (r) => ({
  id: r.id,
  date: r.quoted_on,
  clinic: providerName(r.provider_id),
  category: r.treatment_category,
  product: r.product_name,
  qty: num(r.quantity),
  price: num(r.quoted_amount),
  note: r.notes || "",
});
const quoteToDb = (o, providerId) => {
  const price = num(o.price);
  const qty = num(o.qty);
  return {
    quoted_on: o.date || null,
    provider_id: providerId,
    treatment_category: o.category || null,
    treatment_name: o.category || null,
    product_name: o.product || null,
    quoted_amount: price,
    quantity: qty,
    unit_price: price != null && qty ? Number((price / qty).toFixed(2)) : null,
    notes: o.note || null,
  };
};

// ---- budget_plans <-> 預算計畫 ----
const budgetToApp = (r) => ({
  id: r.id,
  date: r.planned_on,
  item: r.title,
  main: r.main_category,
  sub: r.subcategory,
  bucket: r.bucket,
  budget: num(r.budget_amount),
  actual: num(r.actual_amount),
  status: r.status || "計劃中",
  place: providerName(r.provider_id),
  note: r.notes || "",
});
const budgetToDb = (o, providerId) => ({
  planned_on: o.date || null,
  title: o.item || "（未命名）",
  main_category: o.main || null,
  subcategory: o.sub || null,
  bucket: o.bucket || null,
  budget_amount: num(o.budget),
  actual_amount: num(o.actual),
  status: o.status || "計劃中",
  provider_id: providerId,
  notes: o.note || null,
});

// ---- notes <-> 筆記區 ----
const noteToApp = (r) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  status: r.status,
  tags: r.tags || [],
  content: r.content || "",
});
const noteToDb = (o) => ({
  title: o.title || "（未命名）",
  category: o.category || null,
  status: o.status || null,
  tags: Array.isArray(o.tags) ? o.tags : [],
  content: o.content || null,
  updated_at: new Date().toISOString(),
});

// ---- vouchers <-> 儲值金與剩餘堂數 ----
const voucherToApp = (r) => ({
  id: r.id,
  name: r.name,
  value: num(r.balance),
  unit: r.unit || "元",
  updated: r.updated_on,
  note: r.notes || "",
});
const voucherToDb = (o, providerId) => ({
  name: o.name || "（未命名）",
  balance: num(o.value),
  unit: o.unit || "元",
  provider_id: providerId,
  updated_on: o.updated || null,
  notes: o.note || null,
});

// kind（畫面用的分類名）-> 對應的表格與轉換規則
const MAP = {
  spending: { table: "expenses", toApp: expenseToApp, toDb: expenseToDb, placeKey: "place" },
  quotes: { table: "quotes", toApp: quoteToApp, toDb: quoteToDb, placeKey: "clinic" },
  budget: { table: "budget_plans", toApp: budgetToApp, toDb: budgetToDb, placeKey: "place" },
  notes: { table: "notes", toApp: noteToApp, toDb: noteToDb, placeKey: null },
  vouchers: { table: "vouchers", toApp: voucherToApp, toDb: voucherToDb, placeKey: "name" },
};

const usesProvider = (kind) => MAP[kind].placeKey && kind !== "vouchers";

export async function fetchAll() {
  const providersRes = await supa.from("providers").select("id, name, kind");
  if (providersRes.error) throw providersRes.error;
  PROVIDERS = providersRes.data || [];

  const [ex, qu, bp, nt, vo, pf] = await Promise.all([
    supa.from("expenses").select("*").order("spent_on", { ascending: false, nullsFirst: false }),
    supa.from("quotes").select("*").order("quoted_on", { ascending: false, nullsFirst: false }),
    supa.from("budget_plans").select("*").order("planned_on", { ascending: true, nullsFirst: false }),
    supa.from("notes").select("*").order("created_at", { ascending: true }),
    supa.from("vouchers").select("*").order("created_at", { ascending: true }),
    supa.from("profiles").select("id, annual_budget_cap").maybeSingle(),
  ]);
  for (const r of [ex, qu, bp, nt, vo]) if (r.error) throw r.error;

  return {
    spending: (ex.data || []).map(expenseToApp),
    quotes: (qu.data || []).map(quoteToApp),
    budget: (bp.data || []).map(budgetToApp),
    notes: (nt.data || []).map(noteToApp),
    vouchers: (vo.data || []).map(voucherToApp),
    cap: pf.data && pf.data.annual_budget_cap != null ? Number(pf.data.annual_budget_cap) : 50000,
    profileId: pf.data ? pf.data.id : null,
  };
}

export async function insertOne(kind, appObj) {
  const m = MAP[kind];
  const pid = usesProvider(kind) ? await ensureProvider(appObj[m.placeKey], kind === "quotes" ? "診所" : null) : null;
  const { data, error } = await supa.from(m.table).insert(m.toDb(appObj, pid)).select("*").single();
  if (error) throw error;
  return m.toApp(data);
}

export async function updateOne(kind, id, appObj) {
  const m = MAP[kind];
  const pid = usesProvider(kind) ? await ensureProvider(appObj[m.placeKey], kind === "quotes" ? "診所" : null) : null;
  const { error } = await supa.from(m.table).update(m.toDb(appObj, pid)).eq("id", id);
  if (error) throw error;
}

export async function deleteOne(kind, id) {
  const { error } = await supa.from(MAP[kind].table).delete().eq("id", id);
  if (error) throw error;
}

// 大量匯入（例如還原 JSON 備份）：先補齊缺少的店家，再分批插入
export async function bulkInsert(kind, appObjs) {
  if (!appObjs.length) return;
  const m = MAP[kind];
  if (usesProvider(kind)) {
    const names = Array.from(new Set(appObjs.map((o) => String(o[m.placeKey] || "").trim()).filter(Boolean)));
    const missing = names.filter((n) => !providerId(n));
    if (missing.length) {
      const { data, error } = await supa
        .from("providers")
        .insert(missing.map((n) => ({ name: n, kind: kind === "quotes" ? "診所" : null })))
        .select("id, name, kind");
      if (error) throw error;
      PROVIDERS = [...PROVIDERS, ...data];
    }
  }
  const rows = appObjs.map((o) => m.toDb(o, usesProvider(kind) ? providerId(o[m.placeKey]) : null));
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supa.from(m.table).insert(rows.slice(i, i + 100));
    if (error) throw error;
  }
}

export async function deleteAllData() {
  for (const kind of Object.keys(MAP)) {
    const { error } = await supa.from(MAP[kind].table).delete().not("id", "is", null);
    if (error) throw error;
  }
}

export function getProviderCount() {
  return PROVIDERS.length;
}
