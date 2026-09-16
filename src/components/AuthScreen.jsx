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

  const inputStyle = {
    display: "block", width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10,
    border: "1px solid #EBE8E4", fontSize: 16, boxSizing: "border-box", background: "#fff",
  };

  return (
    <div className="ed-sans" style={{ minHeight: "100vh", background: "#FDFCFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, color: "#7D776F", fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</div>
          <div className="serif" style={{ fontSize: 27, fontWeight: 500, color: "#000", marginTop: 4 }}>當女生好難</div>
          <div style={{ fontSize: 14, color: "#777169", marginTop: 4, fontWeight: 400 }}>美容・醫美・花費 一本通</div>
        </div>
        <form onSubmit={go} style={{ background: "#fff", border: "1px solid #EBE8E4", borderRadius: 16, padding: 22 }}>
          <label style={{ fontSize: 13, color: "#777169" }}>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
          </label>
          <label style={{ fontSize: 13, color: "#777169", display: "block", marginTop: 14 }}>
            密碼（至少 6 碼）
            <input
              type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {err && (
            <div style={{ marginTop: 12, fontSize: 14, color: "#000", background: "#F5F3F1", borderRadius: 10, padding: "10px 12px" }}>
              ⚠️ {err}
            </div>
          )}
          {info && (
            <div style={{ marginTop: 12, fontSize: 14, color: "#000", background: "#F5F3F1", borderRadius: 10, padding: "10px 12px" }}>
              {info}
            </div>
          )}
          <button
            type="submit" disabled={busy}
            style={{
              width: "100%", marginTop: 18, background: "#000", color: "#fff", border: "none",
              borderRadius: 9999, padding: "13px", fontSize: 16, fontWeight: 500, opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? "請稍等…" : mode === "login" ? "登入" : "註冊"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#777169" }}>
          {mode === "login" ? (
            <>
              第一次用？
              <button onClick={() => { setMode("signup"); setErr(null); }} style={{ border: "none", background: "none", color: "#000", fontWeight: 500, fontSize: 14, textDecoration: "underline" }}>
                註冊帳號
              </button>
            </>
          ) : (
            <>
              已有帳號？
              <button onClick={() => { setMode("login"); setErr(null); }} style={{ border: "none", background: "none", color: "#000", fontWeight: 500, fontSize: 14, textDecoration: "underline" }}>
                回登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
