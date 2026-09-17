import React, { useState, useEffect } from "react";
import { supa } from "./lib/supabaseClient";
import { BACKUP_LABELS } from "./lib/backup";
import { useAppData } from "./lib/useAppData";
import { useGoogleCalendar } from "./lib/useGoogleCalendar";

import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import { Overview } from "./components/Overview";
import { SpendingTab } from "./components/SpendingTab";
import { QuotesTab } from "./components/QuotesTab";
import { NotesTab } from "./components/NotesTab";
import { SettingsPage } from "./components/SettingsPage";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!supa) return;
    supa.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  const d = useAppData({ session, flash });
  const cal = useGoogleCalendar({ session, flash });

  async function addExpenseItem(r) {
    await d.spendH.add(r);
    if (r.syncCalendar) cal.syncToCalendar(r);
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
        <div className="title-font fullscreen-msg">存摺開啟中…</div>
      </>
    );
  }
  if (session === null) return <AuthScreen />;
  if (!d.ready) {
    return (
      <>
        <div className="title-font fullscreen-msg">資料同步中…</div>
      </>
    );
  }

  return (
    <AppShell tab={tab} onTab={setTab} toast={toast}>
      {d.loadErr && (
        <div className="notice">
          ⚠️ {d.loadErr}
          <button onClick={d.loadData} className="link-btn notice__retry">重試</button>
        </div>
      )}
      {d.missingKinds.length > 0 && !d.seeding && (
        <div className="notice-card">
          目前雲端還缺這些資料：<strong>{d.missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
          <div className="notice-card__sub">
            如果有之前下載的備份，可以到「設定」用「匯入備份還原」放回來。
          </div>
        </div>
      )}
      {d.seeding && <div className="seeding-msg">資料寫入中，請稍等…</div>}

      {tab === "overview" && (
        <Overview totals={d.totals} cap={d.settings.cap} spending={d.spending} vouchers={d.vouchers} voucherH={d.voucherH} />
      )}
      {tab === "spending" && <SpendingTab data={d.spending} h={d.spendH} onAdd={addExpenseItem} />}
      {tab === "quotes" && <QuotesTab data={d.quotes} h={d.quoteH} />}
      {tab === "notes" && <NotesTab data={d.notes} h={d.noteH} />}
      {tab === "settings" && (
        <SettingsPage
          settings={d.settings} saveCap={d.saveCap} exportJSON={d.exportJSON} exportCSV={d.exportCSV}
          applyImport={d.applyImport} clearAllData={d.clearAllData} counts={d.counts} providerCount={d.providerCount}
          userEmail={session.user && session.user.email} logout={logout}
          googleLinked={cal.googleLinked} connectGoogleCalendar={cal.connectGoogleCalendar} disconnectGoogleCalendar={cal.disconnectGoogleCalendar}
        />
      )}
    </AppShell>
  );
}
