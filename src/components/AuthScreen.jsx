import React, { useState } from "react";
import { supa } from "../lib/supabaseClient";

export function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);

  async function go(e) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supa.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { data, error } = await supa.auth.signUp({ email, password: pw });
        if (error) throw error;
        if (!data.session) setInfo("註冊成功！如果 Supabase 有開信箱驗證，請先去收信點確認連結，再回來登入。");
      }
    } catch (ex) {
      setErr(ex.message === "Invalid login credentials" ? "帳號或密碼不對" : (ex.message || "發生錯誤"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ed-sans auth">
      <div className="auth__box">
        <div className="auth__brand">
          <div className="brand-kicker auth__kicker">PASSBOOK</div>
          <div className="serif auth__title">當女生好難</div>
          <div className="auth__tagline">美容・醫美・花費 一本通</div>
        </div>
        <form onSubmit={go} className="auth__form">
          <label className="auth__label">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth__input" autoComplete="email" />
          </label>
          <label className="auth__label auth__label--block">
            密碼（至少 6 碼）
            <input
              type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="auth__input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {err && (
            <div className="auth__msg">
              ⚠️ {err}
            </div>
          )}
          {info && (
            <div className="auth__msg">
              {info}
            </div>
          )}
          <button type="submit" disabled={busy} className="auth__submit">
            {busy ? "請稍等…" : mode === "login" ? "登入" : "註冊"}
          </button>
        </form>
        <div className="auth__switch">
          {mode === "login" ? (
            <>
              第一次用？
              <button onClick={() => { setMode("signup"); setErr(null); }} className="link-btn auth__switch-btn">
                註冊帳號
              </button>
            </>
          ) : (
            <>
              已有帳號？
              <button onClick={() => { setMode("login"); setErr(null); }} className="link-btn auth__switch-btn">
                回登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
