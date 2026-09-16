import { useState, useEffect, useMemo } from "react";
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

  async function loadData() {
    setReady(false); setLoadErr(null);
    try {
      const d = await fetchAll();
      setSpending(d.spending); setQuotes(d.quotes);
      setNotes(d.notes); setVouchers(d.vouchers);
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

  const mk = (kind, setter) => ({
    add: async (r) => {
      try {
        const saved = await insertOne(kind, r);
        setter((prev) => [saved, ...prev]);
        setProviderCount(getProviderCount());
        flash("已新增");
      } catch (ex) { flash("新增失敗：" + (ex.message || "")); }
    },
    update: async (id, patch) => {
      let merged;
      setter((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        merged = { ...r, ...patch };
        return merged;
      }));
      try {
        await updateOne(kind, id, merged);
        setProviderCount(getProviderCount());
        flash("已更新");
      } catch (ex) { flash("更新失敗：" + (ex.message || "")); loadData(); }
    },
    del: async (id) => {
      setter((prev) => prev.filter((r) => r.id !== id));
      try { await deleteOne(kind, id); flash("已刪除"); }
      catch (ex) { flash("刪除失敗：" + (ex.message || "")); loadData(); }
    },
  });

  const spendH = mk("spending", setSpending);
  const quoteH = mk("quotes", setQuotes);
  const noteH = mk("notes", setNotes);
  const voucherH = mk("vouchers", setVouchers);

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
