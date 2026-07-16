import React, { useState, useEffect, useRef } from "react";
import { BACKUP_KEYS, BACKUP_LABELS, validateBackup } from "../lib/backup";
import { SectionTitle } from "./ui";

function SettingsCard({ title, sub, children }) {
  return (
    <div style={{ background: "#FBF7F2", border: "1px solid #EADFD4", borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#8a3b4d" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#9a8d80", marginTop: 2, marginBottom: 10 }}>{sub}</div>}
      {children}
    </div>
  );
}

export function SettingsPage({
  settings, saveCap, exportJSON, exportCSV, applyImport, clearAllData,
  counts, userEmail, logout, providerCount,
}) {
  const [capInput, setCapInput] = useState(String(settings.cap || 50000));
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [importErr, setImportErr] = useState(null);

  useEffect(() => {
    if (!clearConfirm) return;
    const t = setTimeout(() => setClearConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [clearConfirm]);

  function onFilePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImportErr(null); setPending(null);
    const reader = new FileReader();
    reader.onerror = () => setImportErr("讀取檔案失敗，請再試一次");
    reader.onload = () => {
      let payload;
      try { payload = JSON.parse(reader.result); }
      catch { setImportErr("這不是有效的 JSON 檔案"); return; }
      const err = validateBackup(payload);
      if (err) { setImportErr(err); return; }
      setPending({ payload, exportedAt: payload.exportedAt || null });
    };
    reader.readAsText(file);
  }

  const btn = { border: "1px solid #EADFD4", color: "#6b5f54", background: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13 };
  const btnPrimary = { ...btn, border: "1px solid #B5445B", color: "#B5445B", fontWeight: 600 };

  return (
    <div>
      <SectionTitle>設定</SectionTitle>

      <SettingsCard title="帳號" sub={userEmail}>
        <button onClick={logout} style={btn}>登出</button>
      </SettingsCard>

      <SettingsCard title="年度預算上限" sub="總覽的進度條會以這個數字計算">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#6b5f54" }}>NT$</span>
          <input
            type="number" value={capInput} onChange={(e) => setCapInput(e.target.value)}
            style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: "1px solid #EADFD4", fontSize: 15, minWidth: 0 }} className="mono"
          />
          <button onClick={() => { const v = Number(capInput); if (v > 0) saveCap(v); }} style={btnPrimary}>儲存</button>
        </div>
      </SettingsCard>

      <SettingsCard title="備份與還原" sub="資料存在你的 Supabase 雲端資料庫；仍建議偶爾下載一份備份">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={exportJSON} style={btnPrimary}>下載完整備份（JSON）</button>
          <button onClick={exportCSV} style={btn}>下載消費紀錄（CSV）</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} style={btn}>匯入備份還原…</button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFilePicked} style={{ display: "none" }} />
        </div>

        {importErr && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#B5445B14", border: "1px solid #B5445B55", color: "#8a3b4d", fontSize: 13 }}>
            ⚠️ 無法匯入：{importErr}
          </div>
        )}

        {pending && (
          <div style={{ marginTop: 12, border: "1px solid #EADFD4", borderRadius: 10, padding: 14, background: "#FEFBF8" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#8a3b4d", marginBottom: 8 }}>
              還原預覽{pending.exportedAt ? `（備份於 ${String(pending.exportedAt).slice(0, 10)}）` : "（備份日期不明）"}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #EADFD4" }}></th>
                    {BACKUP_KEYS.map((k) => (
                      <th key={k} style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #EADFD4", whiteSpace: "nowrap" }}>{BACKUP_LABELS[k]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 8px", color: "#9a8d80", whiteSpace: "nowrap" }}>目前</td>
                    {BACKUP_KEYS.map((k) => (
                      <td key={k} className="mono" style={{ textAlign: "right", padding: "4px 8px" }}>{counts[k]}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 8px", color: "#9a8d80", whiteSpace: "nowrap" }}>備份檔</td>
                    {BACKUP_KEYS.map((k) => (
                      <td key={k} className="mono" style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600, color: pending.payload[k].length !== counts[k] ? "#8a3b4d" : "inherit" }}>
                        {pending.payload[k].length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 12, color: "#9a8d80", margin: "10px 0" }}>
              確認後，雲端的消費/詢價/預算/筆記/儲值資料會<strong>整份被備份檔取代</strong>（店家清單保留）；取代前會自動先下載一份現況備份。
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { applyImport(pending.payload); setPending(null); }}
                style={{ background: "#B5445B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600 }}
              >
                確認還原
              </button>
              <button onClick={() => setPending(null)} style={btn}>取消</button>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="清空所有資料" sub="清空後雲端會是空的；要重新放資料請用上方匯入或執行 SEED_DATA.sql（清空前會自動下載備份）">
        {clearConfirm ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#8a3b4d", fontWeight: 600 }}>確定要清空嗎？</span>
            <button
              onClick={() => { clearAllData(); setClearConfirm(false); }}
              style={{ background: "#B5445B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600 }}
            >
              確定清空
            </button>
            <button onClick={() => setClearConfirm(false)} style={btn}>取消</button>
          </div>
        ) : (
          <button onClick={() => setClearConfirm(true)} style={btn}>清空所有資料…</button>
        )}
      </SettingsCard>

      <SettingsCard title="關於">
        <div style={{ fontSize: 12.5, color: "#6b5f54", lineHeight: 1.8 }}>
          「當女生好難」美容存摺・原始資料於 2026-07 從 Notion 匯出。<br />
          資料表：expenses / quotes / budget_plans / notes / vouchers / providers（目前 {providerCount} 家店家）。<br />
          全部受 Row Level Security 保護，只有你的登入身分讀得到。
        </div>
      </SettingsCard>
    </div>
  );
}
