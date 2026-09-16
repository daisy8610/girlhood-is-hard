import React, { useState, useEffect } from "react";
import { renderMD } from "../lib/markdown";

export function Tag({ children, color }) {
  return (
    <span
      style={{
        display: "inline-block", fontSize: "var(--fs-xs)", padding: "2px 9px", borderRadius: 9999,
        background: "var(--ed-surface)", color: "var(--ed-ink)",
        border: "1px solid var(--ed-stone)", whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 className="serif" style={{ fontSize: "var(--fs-3xl)", fontWeight: 500, margin: 0, color: "var(--ed-ink)" }}>{children}</h2>
      {sub && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ed-smoke)", marginTop: 3, fontWeight: 400 }}>{sub}</div>}
    </div>
  );
}

export function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid var(--ed-ink)", color: "var(--ed-ink)", background: "transparent", borderRadius: 9999,
        padding: "9px 18px", fontSize: "var(--fs-md)", fontWeight: 500, marginBottom: 14,
      }}
    >
      + {label || "新增一筆"}
    </button>
  );
}

// 刪除需要「再按一次」確認，避免手滑誤刪
export function RowActions({ onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);
  return (
    <span style={{ display: "inline-flex", gap: 2, marginLeft: 6, flexShrink: 0 }}>
      <button className="iconbtn" onClick={onEdit} title="編輯">✎</button>
      {confirming ? (
        <button className="iconbtn" onClick={onDelete} style={{ color: "var(--ed-ink)", fontWeight: 700 }} title="再按一次確認刪除">確定刪除？</button>
      ) : (
        <button className="iconbtn" onClick={() => setConfirming(true)} title="刪除">✕</button>
      )}
    </span>
  );
}

// 藥丸形切換按鈕：選中是黑底白字
export function Chip({ active, onClick, small, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "3px 11px" : "6px 14px", borderRadius: 9999, fontSize: small ? "var(--fs-xs)" : "var(--fs-sm)",
        border: "1px solid " + (active ? "var(--ed-ink)" : "var(--ed-stone)"),
        background: active ? "var(--ed-ink)" : "transparent", color: active ? "#fff" : "var(--ed-smoke)",
      }}
    >
      {children}
    </button>
  );
}

export function CategoryChips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {options.map((c) => (
        <Chip key={c} active={value === c} onClick={() => onChange(c)}>{c}</Chip>
      ))}
    </div>
  );
}

// 下拉建議輸入框：電腦、手機行為一致，取代原生 datalist（手機瀏覽器支援不一）
function SuggestInput({ value, onChange, suggestions, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const q = String(value || "").toLowerCase();
  const matches = suggestions.filter((s) => !q || s.toLowerCase().includes(q));

  return (
    <div style={{ position: "relative", marginTop: 4 }}>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || ""}
        style={{ ...style, marginTop: 0 }}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 10,
          background: "#fff", border: "1px solid var(--ed-stone)", borderRadius: "var(--r-md)",
          maxHeight: 160, overflowY: "auto", boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}>
          {matches.map((s) => (
            <div
              key={s} className="row-hover"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: "var(--fs-md)", cursor: "pointer" }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "搜尋…"}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 9999, border: "1px solid var(--ed-stone)", fontSize: "var(--fs-md)", marginBottom: 14, background: "#fff" }}
    />
  );
}

// 通用表單：依 fields 定義動態產生欄位，新增/編輯共用
export function RecordForm({ fields, initial, onSubmit, onCancel, submitLabel }) {
  const [vals, setVals] = useState(() => {
    const base = {};
    fields.forEach((f) => {
      let v = initial ? initial[f.key] : undefined;
      if (v === undefined || v === null) v = f.default ?? "";
      if (f.type === "tags" && Array.isArray(v)) v = v.join(", ");
      base[f.key] = v;
    });
    return base;
  });

  const [err, setErr] = useState("");

  function set(k, v) { setVals((prev) => ({ ...prev, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    const out = {};
    fields.forEach((f) => {
      let v = vals[f.key];
      if (f.fallbackFn && (v === "" || v == null)) v = f.fallbackFn(vals);
      else if (f.fallbackKey && (v === "" || v == null)) v = vals[f.fallbackKey];
      if (f.type === "number") v = v === "" || v === null ? null : Number(v);
      if (f.type === "tags") v = (v || "").split(",").map((s) => s.trim()).filter(Boolean);
      out[f.key] = v;
    });
    const missing = fields.filter((f) => f.required && (out[f.key] === "" || out[f.key] == null));
    if (missing.length) {
      setErr(missing.map((f) => f.label).join("、") + " 是必填欄位");
      return;
    }
    setErr("");
    onSubmit(out);
  }

  const inputStyle = { display: "block", width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: "var(--r-md)", border: "1px solid var(--ed-stone)", fontSize: "var(--fs-md)", background: "#fff" };

  return (
    <form onSubmit={submit} style={{ border: "1px solid var(--ed-stone)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 14, background: "#fff" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {fields.map((f) => (
          <label key={f.key} style={{ fontSize: "var(--fs-sm)", color: "var(--ed-smoke)", gridColumn: f.type === "textarea" || f.type === "date" ? "1 / -1" : "auto" }}>
            {f.label}{f.required && <span style={{ color: "var(--ed-ink)", fontWeight: 700 }}> *</span>}
            {f.type === "select" ? (
              <select value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "textarea" && f.livePreview ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                <textarea
                  value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={10}
                  placeholder={f.placeholder || ""} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                />
                <div style={{ ...inputStyle, overflowY: "auto", maxHeight: 260, background: "var(--ed-surface)", fontSize: "var(--fs-md)" }}>
                  {vals[f.key] ? renderMD(vals[f.key]) : <span style={{ color: "var(--ed-ash)" }}>預覽</span>}
                </div>
              </div>
            ) : f.type === "textarea" ? (
              <textarea
                value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={8}
                placeholder={f.placeholder || ""} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            ) : f.suggestions ? (
              <SuggestInput
                value={vals[f.key]} onChange={(v) => set(f.key, v)}
                suggestions={typeof f.suggestions === "function" ? f.suggestions(vals) : f.suggestions}
                placeholder={f.placeholder} style={inputStyle}
              />
            ) : f.type === "checkbox" ? (
              <div style={{ marginTop: 8 }}>
                <input
                  type="checkbox" checked={!!vals[f.key]} onChange={(e) => set(f.key, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--ed-ink)", verticalAlign: "middle" }}
                />
              </div>
            ) : f.type === "date" || f.type === "time" ? (
              // iOS Safari 的 input[type=date] 渲染寬度有時會忽略 CSS 設定值、超出外框，
              // 用 overflow:hidden 的容器裁掉超出部分，點擊行為不受影響；time 欄位一併套用同樣的外框
              <div style={{ ...inputStyle, padding: 0, overflow: "hidden", background: "#fff" }}>
                <input
                  type={f.type}
                  value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                  className="mono"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "none", borderRadius: "var(--r-md)", background: "#fff", fontSize: "var(--fs-lg)", color: "var(--ed-ink)" }}
                />
              </div>
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder || ""} style={inputStyle}
              />
            )}
          </label>
        ))}
      </div>
      {err && <div style={{ marginTop: 10, fontSize: "var(--fs-sm)", color: "var(--ed-ink)", background: "var(--ed-surface)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>⚠️ {err}</div>}
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <button type="submit" style={{ background: "var(--ed-ink)", color: "#fff", border: "none", borderRadius: 9999, padding: "9px 20px", fontSize: "var(--fs-md)", fontWeight: 500 }}>
          {submitLabel || "儲存"}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: "1px solid var(--ed-stone)", borderRadius: 9999, padding: "9px 20px", fontSize: "var(--fs-md)", color: "var(--ed-smoke)" }}>
          取消
        </button>
      </div>
    </form>
  );
}
