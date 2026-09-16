import React, { useState, useEffect, useMemo } from "react";
import { supa } from "./lib/supabaseClient";
import { download, toCSV } from "./lib/format";
import { BACKUP_LABELS } from "./lib/backup";
import {
  fetchAll, insertOne, updateOne, deleteOne, bulkInsert, deleteAllData, getProviderCount,
} from "./lib/db";

import { AuthScreen } from "./components/AuthScreen";
import { Overview } from "./components/Overview";
import { SpendingTab } from "./components/SpendingTab";
import { QuotesTab } from "./components/QuotesTab";
import { NotesTab } from "./components/NotesTab";
import { SettingsPage } from "./components/SettingsPage";

const DEFAULT_SETTINGS = { cap: 50000 };

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("overview");

  const [spending, setSpending] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [providerCount, setProviderCount] = useState(0);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [missingKinds, setMissingKinds] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    if (!supa) return;
    supa.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

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

  useEffect(() => {
    if (!session) return;
    supa.from("google_calendar_tokens").select("user_id").maybeSingle()
      .then(({ data }) => setGoogleLinked(!!data))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("calendar");
    if (!status) return;
    if (status === "connected") { setGoogleLinked(true); flash("已連結 Google 日曆"); }
    else if (status === "error") flash("連結 Google 日曆失敗，請重試");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

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

  async function clearAllData_() {
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

  async function connectGoogleCalendar() {
    const { data } = await supa.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) return;
    window.location.href = `${window.SUPA_CFG.url}/functions/v1/google-oauth-start?state=${encodeURIComponent(token)}`;
  }

  async function disconnectGoogleCalendar() {
    const { data: u } = await supa.auth.getUser();
    try {
      const { error } = await supa.from("google_calendar_tokens").delete().eq("user_id", u.user.id);
      if (error) throw error;
      setGoogleLinked(false);
      flash("已解除 Google 日曆連結");
    } catch (ex) { flash("解除失敗：" + (ex.message || "")); }
  }

  async function syncToCalendar(r) {
    if (!googleLinked || !r.date) return;
    try {
      const { data, error } = await supa.functions.invoke("google-calendar-sync", {
        body: { item: r.item, date: r.date, time: r.time, place: r.place, note: r.note, amount: r.amount },
      });
      if (error) { flash("同步日曆失敗：" + (error.message || "")); return; }
      if (data && data.ok) { flash("已同步到 Google 日曆"); return; }
      if (data && data.reason === "refresh_failed") {
        const { data: u } = await supa.auth.getUser();
        if (u.user) await supa.from("google_calendar_tokens").delete().eq("user_id", u.user.id);
        setGoogleLinked(false);
        flash("Google 日曆授權已過期，請重新連結");
        return;
      }
      if (data) flash("同步日曆失敗：" + (data.reason || "未知原因"));
    } catch (ex) { flash("同步日曆失敗：" + (ex.message || "")); }
  }

  async function addExpenseItem(r) {
    await spendH.add(r);
    if (r.syncCalendar) syncToCalendar(r);
  }

  async function logout() { await supa.auth.signOut(); }

  // ---------- 畫面 ----------
  if (!supa) {
    return (
      <>
        <div className="ed-sans fullscreen-msg fullscreen-msg--setup">
          還沒設定 Supabase 連線。<br />請打開網站資料夾裡的 config.js，填入你的 Project URL 和 anon key。
        </div>
      </>
    );
  }
  if (session === undefined) {
    return (
      <>
        <div className="serif fullscreen-msg">存摺開啟中…</div>
      </>
    );
  }
  if (session === null) return <AuthScreen />;
  if (!ready) {
    return (
      <>
        <div className="serif fullscreen-msg">資料同步中…</div>
      </>
    );
  }

  const counts = { spending: spending.length, quotes: quotes.length, notes: notes.length, vouchers: vouchers.length };
  const NAV = [
    { key: "overview", label: "總覽", icon: "📔" },
    { key: "spending", label: "紀錄", icon: "🧾" },
    { key: "quotes", label: "詢價", icon: "💉" },
    { key: "notes", label: "筆記", icon: "🩺" },
    { key: "settings", label: "設定", icon: "⚙️" },
  ];

  function goTab(k) {
    setTab(k);
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  const pageTitle = tab === "overview" ? "總覽" : tab === "spending" ? "消費紀錄" : tab === "quotes" ? "詢價比較"
    : tab === "notes" ? "筆記區" : "設定";

  return (
    <div className="ed-sans app">

      <div className="app-shell">
        <nav className="app-sidebar">
          <div className="app-sidebar__brand">
            <div className="brand-kicker">PASSBOOK</div>
            <div className="serif app-sidebar__title">當女生好難</div>
          </div>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => goTab(n.key)} className={"side-nav-btn" + (tab === n.key ? " is-active" : "")}>
              <span className="side-nav-btn__icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="app-main-col">
          <div className="app-header">
            <div className="hide-md-up">
              <span className="serif app-header__title">當女生好難</span>
              <span className="app-header__kicker">PASSBOOK</span>
            </div>
            <div className="app-header__page">{pageTitle}</div>
          </div>

        <div className="content-col">
          {loadErr && (
            <div className="notice">
              ⚠️ {loadErr}
              <button onClick={loadData} className="link-btn notice__retry">重試</button>
              {/vouchers|annual_budget_cap|category|tags/.test(loadErr) && (
                <div className="notice__hint">看起來 PATCH.sql 還沒跑完，請到 Supabase 的 SQL Editor 執行一次。</div>
              )}
            </div>
          )}
          {missingKinds.length > 0 && !seeding && (
            <div className="notice-card">
              目前雲端還缺這些資料：<strong>{missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
              <div className="notice-card__sub">
                請到 Supabase SQL Editor 執行一次性匯入腳本（不經過這個網頁），或到「設定」用 JSON 備份匯入。
              </div>
            </div>
          )}
          {seeding && <div className="seeding-msg">資料寫入中，請稍等…</div>}

          {tab === "overview" && (
            <Overview totals={totals} cap={settings.cap} spending={spending} vouchers={vouchers} voucherH={voucherH} />
          )}
          {tab === "spending" && <SpendingTab data={spending} h={spendH} onAdd={addExpenseItem} />}
          {tab === "quotes" && <QuotesTab data={quotes} h={quoteH} />}
          {tab === "notes" && <NotesTab data={notes} h={noteH} />}
          {tab === "settings" && (
            <SettingsPage
              settings={settings} saveCap={saveCap} exportJSON={exportJSON} exportCSV={exportCSV}
              applyImport={applyImport} clearAllData={clearAllData_} counts={counts} providerCount={providerCount}
              userEmail={session.user && session.user.email} logout={logout}
              googleLinked={googleLinked} connectGoogleCalendar={connectGoogleCalendar} disconnectGoogleCalendar={disconnectGoogleCalendar}
            />
          )}
        </div>
        </div>

        <div className="app-bottom-nav">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => goTab(n.key)} className={"bottom-nav-btn" + (tab === n.key ? " is-active" : "")}>
              <span className="bottom-nav-btn__icon">{n.icon}</span>
              <span className="bottom-nav-btn__label">{n.label}</span>
            </button>
          ))}
        </div>

        {toast && (
          <div className="toast">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
