import React, { useState, useEffect, useRef } from "react";
import { BACKUP_KEYS, BACKUP_LABELS, validateBackup } from "../lib/backup";
import { SectionTitle } from "./ui";

function SettingsCard({ title, sub, children }) {
  return (
    <div className="settings-card">
      <div className="settings-card__title">{title}</div>
      {sub && <div className="settings-card__sub">{sub}</div>}
      {children}
    </div>
  );
}

export function SettingsPage({
  settings, saveCap, exportJSON, exportCSV, applyImport, clearAllData,
  counts, userEmail, logout, providerCount,
  googleLinked, connectGoogleCalendar, disconnectGoogleCalendar,
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

  return (
    <div>
      <SectionTitle>設定</SectionTitle>

      <SettingsCard title="帳號" sub={userEmail}>
        <button onClick={logout} className="btn-outline">登出</button>
      </SettingsCard>

      <SettingsCard title="Google 日曆" sub="連結後，新增消費紀錄時勾選「同步到 Google 日曆」，就會在你的日曆建一筆行程">
        {googleLinked ? (
          <div className="settings__row">
            <span className="settings__status">✓ 已連結</span>
            <button onClick={disconnectGoogleCalendar} className="btn-outline">解除連結</button>
          </div>
        ) : (
          <button onClick={connectGoogleCalendar} className="btn-outline is-primary">連結 Google 日曆</button>
        )}
      </SettingsCard>

      <SettingsCard title="年度預算上限" sub="總覽的進度條會以這個數字計算">
        <div className="settings__row">
          <span className="settings__currency">NT$</span>
          <input
            type="number" value={capInput} onChange={(e) => setCapInput(e.target.value)}
            className="num settings__cap-input"
          />
          <button onClick={() => { const v = Number(capInput); if (v > 0) saveCap(v); }} className="btn-outline is-primary">儲存</button>
        </div>
      </SettingsCard>

      <SettingsCard title="備份與還原" sub="資料存在你的 Supabase 雲端資料庫；仍建議偶爾下載一份備份">
        <div className="settings__buttons">
          <button onClick={exportJSON} className="btn-outline is-primary">下載完整備份（JSON）</button>
          <button onClick={exportCSV} className="btn-outline">下載消費紀錄（CSV）</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} className="btn-outline">匯入備份還原…</button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFilePicked} className="hidden-input" />
        </div>

        {importErr && (
          <div className="settings__error">
            ⚠️ 無法匯入：{importErr}
          </div>
        )}

        {pending && (
          <div className="restore">
            <div className="restore__title">
              還原預覽{pending.exportedAt ? `（備份於 ${String(pending.exportedAt).slice(0, 10)}）` : "（備份日期不明）"}
            </div>
            <div className="scroll-x">
              <table className="restore__table">
                <thead>
                  <tr>
                    <th></th>
                    {BACKUP_KEYS.map((k) => (
                      <th key={k}>{BACKUP_LABELS[k]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="restore__rowname">目前</td>
                    {BACKUP_KEYS.map((k) => (
                      <td key={k} className="num">{counts[k]}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="restore__rowname">備份檔</td>
                    {BACKUP_KEYS.map((k) => (
                      <td key={k} className={"num is-backup" + (pending.payload[k].length !== counts[k] ? " is-changed" : "")}>
                        {pending.payload[k].length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="restore__warn">
              確認後，雲端的消費/詢價/筆記/儲值資料會<strong>整份被備份檔取代</strong>（店家清單保留）；取代前會自動先下載一份現況備份。
              <br />⚠️ 還原過程中如果網路中斷或寫入失敗，雲端資料可能會處於「舊資料已清空、新資料沒補齊」的中間狀態；建議在網路穩定時操作，還原後可到各頁面確認筆數是否正確，若不對可用剛下載的現況備份再還原一次。
            </div>
            <div className="settings__buttons">
              <button onClick={() => { applyImport(pending.payload); setPending(null); }} className="btn-outline is-primary">
                確認還原
              </button>
              <button onClick={() => setPending(null)} className="btn-outline">取消</button>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="清空所有資料" sub="清空後雲端會是空的；要重新放資料請用上方匯入或執行 SEED_DATA.sql（清空前會自動下載備份）">
        {clearConfirm ? (
          <div className="settings__row settings__row--wrap">
            <span className="settings__status settings__status--strong">確定要清空嗎？</span>
            <button onClick={() => { clearAllData(); setClearConfirm(false); }} className="btn-outline is-primary">
              確定清空
            </button>
            <button onClick={() => setClearConfirm(false)} className="btn-outline">取消</button>
          </div>
        ) : (
          <button onClick={() => setClearConfirm(true)} className="btn-outline">清空所有資料…</button>
        )}
      </SettingsCard>

      <SettingsCard title="關於">
        <div className="settings__about">
          「當女生好難」美容存摺・原始資料於 2026-07 從 Notion 匯出。<br />
          資料表：expenses / quotes / notes / vouchers / providers（目前 {providerCount} 家店家）。<br />
          全部受 Row Level Security 保護，只有你的登入身分讀得到。
        </div>
      </SettingsCard>

      <div className="settings__footer">
        資料只存在 Supabase，這個網頁不含任何資料副本。<br />記得偶爾用上面的「下載完整備份」存一份。
      </div>
    </div>
  );
}
