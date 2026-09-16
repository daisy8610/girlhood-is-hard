import { useState, useEffect, useMemo, useRef } from "react";
import { supa } from "./supabaseClient";
import { download, toCSV } from "./format";
import {
  fetchAll, insertOne, updateOne, deleteOne, bulkInsert, deleteAllData, getProviderCount,
} from "./db";

const DEFAULT_SETTINGS = { cap: 50000 };

// 全站資料：讀取、新增/修改/刪除、備份匯出匯入、清空、預算上限
export function useAppData({ session, flash }) {
  const [spending, setSpending] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [providerCount, setProviderCount] = useState(0);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [missingKinds, setMissingKinds] = useState([]);
  const [seeding, setSeeding] = useState(false);

  // 四種資料的最新版本。畫面的 state 要等重新渲染才更新，
  // 修改時要從這裡取最新內容，才不會拿到舊資料或 undefined
  const latest = useRef({ spending: [], quotes: [], notes: [], vouchers: [] });
  const setters = { spending: setSpending, quotes: setQuotes, notes: setNotes, vouchers: setVouchers };
  function setList(kind, next) {
    latest.current[kind] = next;
    setters[kind](next);
  }

  async function loadData() {
    setReady(false); setLoadErr(null);
    try {
      const d = await fetchAll();
      setList("spending", d.spending); setList("quotes", d.quotes);
      setList("notes", d.notes); setList("vouchers", d.vouchers);
      setSettings({ cap: d.cap });
      setProviderCount(getProviderCount());

      const missing = [];
      if (d.spending.length === 0) missing.push("spending");
      if (d.quotes.length === 0) missing.push("quotes");
      if (d.notes.length === 0) missing.push("notes");
      if (d.vouchers.length === 0) missing.push("vouchers");
      setMissingKinds(missing);
      setReady(true);
    } catch (ex) {
      setLoadErr(ex.message || "讀取資料失敗");
      setReady(true);
    }
  }

  useEffect(() => { if (session) loadData(); }, [session]);

  const mk = (kind) => ({
    add: async (r) => {
      try {
        const saved = await insertOne(kind, r);
        setList(kind, [saved, ...latest.current[kind]]);
        setProviderCount(getProviderCount());
        flash("已新增");
      } catch (ex) { flash("新增失敗：" + (ex.message || "")); }
    },
    update: async (id, patch) => {
      // 先算好要存的內容再更新畫面；原本在 setState 的更新函式裡順便算，
      // React 延後執行時 merged 會是 undefined，資料庫就沒有真的存到
      const current = latest.current[kind].find((r) => r.id === id);
      if (!current) return;
      const merged = { ...current, ...patch };
      setList(kind, latest.current[kind].map((r) => (r.id === id ? merged : r)));
      try {
        await updateOne(kind, id, merged);
        setProviderCount(getProviderCount());
        flash("已更新");
      } catch (ex) { flash("更新失敗：" + (ex.message || "")); loadData(); }
    },
    del: async (id) => {
      setList(kind, latest.current[kind].filter((r) => r.id !== id));
      try { await deleteOne(kind, id); flash("已刪除"); }
      catch (ex) { flash("刪除失敗：" + (ex.message || "")); loadData(); }
    },
  });

  const spendH = mk("spending");
  const quoteH = mk("quotes");
  const noteH = mk("notes");
  const voucherH = mk("vouchers");

  const totals = useMemo(() => {
    const now = new Date();
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    let ytd = 0, all = 0;
    const byMain = {};
    spending.forEach((r) => {
      const amt = r.amount || 0;
      all += amt;
      const d = r.date ? new Date(r.date) : null;
      if (d && d >= ytdStart) ytd += amt;
      if (r.main) byMain[r.main] = (byMain[r.main] || 0) + amt;
    });
    return { ytd, all, byMain };
  }, [spending]);

  const counts = { spending: spending.length, quotes: quotes.length, notes: notes.length, vouchers: vouchers.length };

  const backupPayload = () => ({ exportedAt: new Date().toISOString(), spending, quotes, notes, vouchers });

  function exportJSON() {
    const ok = download("當女生好難-備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    flash(ok ? "已下載 JSON 備份" : "下載失敗");
  }

  function exportCSV() {
    const csv = toCSV(spending, [
      { key: "date", label: "日期" }, { key: "main", label: "主分類" }, { key: "sub", label: "子分類" },
      { key: "item", label: "項目" }, { key: "place", label: "地點" }, { key: "amount", label: "金額" }, { key: "note", label: "備註" },
    ]);
    const ok = download("消費紀錄-" + new Date().toISOString().slice(0, 10) + ".csv", csv, "text/csv;charset=utf-8");
    flash(ok ? "已下載 CSV" : "下載失敗");
  }

  async function replaceAllWith(payload, msg) {
    setSeeding(true);
    try {
      await deleteAllData();
      await bulkInsert("spending", payload.spending);
      await bulkInsert("quotes", payload.quotes);
      await bulkInsert("notes", payload.notes);
      await bulkInsert("vouchers", payload.vouchers);
      await loadData();
      flash(msg);
    } catch (ex) {
      flash("操作失敗：" + (ex.message || ""));
      loadData();
    } finally { setSeeding(false); }
  }

  function applyImport(payload) {
    download("還原前自動備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    replaceAllWith(payload, "已還原備份（還原前的資料也自動下載了一份）");
  }

  async function clearAllData() {
    download("清空前自動備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    setSeeding(true);
    try {
      await deleteAllData();
      await loadData();
      flash("已清空所有資料（清空前的資料也自動下載了一份）");
    } catch (ex) {
      flash("操作失敗：" + (ex.message || ""));
      loadData();
    } finally { setSeeding(false); }
  }

  async function saveCap(cap) {
    setSettings((prev) => ({ ...prev, cap }));
    try {
      const { data: u } = await supa.auth.getUser();
      const { error } = await supa.from("profiles").upsert({ id: u.user.id, annual_budget_cap: cap });
      if (error) throw error;
      flash("已更新預算上限");
    } catch (ex) { flash("儲存失敗：" + (ex.message || "")); }
  }

  return {
    spending, quotes, notes, vouchers, settings, providerCount, counts, totals,
    ready, loadErr, missingKinds, seeding, loadData,
    spendH, quoteH, noteH, voucherH,
    exportJSON, exportCSV, applyImport, clearAllData, saveCap,
  };
}
