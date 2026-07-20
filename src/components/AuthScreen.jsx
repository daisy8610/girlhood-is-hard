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

  const inputStyle = { display: "block", width: "100%", marginTop: 4, padding: "11px 12px", borderRadius: 8, border: "1px solid #F3DCDF", fontSize: 15, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "#FBF3EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans TC', sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#C58A9A", fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#AD455E", fontFamily: "'Noto Serif TC',serif" }}>當女生好難</div>
          <div style={{ fontSize: 13, color: "#A88690", marginTop: 4 }}>美容・醫美・預算 一本通</div>
        </div>
        <form onSubmit={go} style={{ background: "#FFF9F6", border: "1px solid #F3DCDF", borderRadius: 14, padding: 20 }}>
          <label style={{ fontSize: 12, color: "#7A5560" }}>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
          </label>
          <label style={{ fontSize: 12, color: "#7A5560", display: "block", marginTop: 12 }}>
            密碼（至少 6 碼）
            <input
              type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {err && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#AD455E", background: "#D9718A14", border: "1px solid #D9718A55", borderRadius: 8, padding: "8px 12px" }}>
              ⚠️ {err}
            </div>
          )}
          {info && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#5a6e5f", background: "#6E8E7614", border: "1px solid #6E8E7655", borderRadius: 8, padding: "8px 12px" }}>
              {info}
            </div>
          )}
          <button
            type="submit" disabled={busy}
            style={{ width: "100%", marginTop: 16, background: "#D9718A", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 700, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "請稍等…" : mode === "login" ? "登入" : "註冊"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#7A5560" }}>
          {mode === "login" ? (
            <>
              第一次用？
              <button onClick={() => { setMode("signup"); setErr(null); }} style={{ border: "none", background: "none", color: "#AD455E", fontWeight: 600, fontSize: 13, textDecoration: "underline" }}>
                註冊帳號
              </button>
            </>
          ) : (
            <>
              已有帳號？
              <button onClick={() => { setMode("login"); setErr(null); }} style={{ border: "none", background: "none", color: "#AD455E", fontWeight: 600, fontSize: 13, textDecoration: "underline" }}>
                回登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
