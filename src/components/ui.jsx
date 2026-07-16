import React, { useState, useEffect } from "react";
import { renderMD } from "../lib/markdown";

export function Tag({ children, color }) {
  return (
    <span
      style={{
        display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20,
        background: (color || "#8a7f74") + "1f", color: color || "#5a5044",
        border: `1px solid ${(color || "#8a7f74")}55`,
        fontFamily: "'Noto Sans TC',sans-serif", whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 className="serif" style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#8a3b4d" }}>{children}</h2>
      {sub && <div style={{ fontSize: 12, color: "#9a8d80", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid #B5445B", color: "#B5445B", background: "transparent", borderRadius: 8,
        padding: "9px 16px", fontSize: 13, fontWeight: 600, marginBottom: 14,
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
        <button className="iconbtn" onClick={onDelete} style={{ color: "#B5445B", fontWeight: 700 }} title="再按一次確認刪除">確定刪除？</button>
      ) : (
        <button className="iconbtn" onClick={() => setConfirming(true)} title="刪除">✕</button>
      )}
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "搜尋…"}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #EADFD4", fontSize: 13, marginBottom: 12, background: "#fff" }}
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

  function set(k, v) { setVals((prev) => ({ ...prev, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    const out = {};
    fields.forEach((f) => {
      let v = vals[f.key];
      if (f.fallbackKey && (v === "" || v == null)) v = vals[f.fallbackKey];
      if (f.type === "number") v = v === "" || v === null ? null : Number(v);
      if (f.type === "tags") v = (v || "").split(",").map((s) => s.trim()).filter(Boolean);
      out[f.key] = v;
    });
    onSubmit(out);
  }

  const inputStyle = { display: "block", width: "100%", marginTop: 4, padding: "8px 8px", borderRadius: 6, border: "1px solid #EADFD4", fontSize: 13 };

  return (
    <form onSubmit={submit} style={{ border: "1px solid #EADFD4", borderRadius: 10, padding: 14, marginBottom: 14, background: "#FEFBF8" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {fields.map((f) => (
          <label key={f.key} style={{ fontSize: 12, color: "#6b5f54", gridColumn: f.type === "textarea" ? "1 / -1" : "auto" }}>
            {f.label}
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
                <div style={{ ...inputStyle, overflowY: "auto", maxHeight: 260, background: "#fff", fontSize: 13 }}>
                  {vals[f.key] ? renderMD(vals[f.key]) : <span style={{ color: "#9a8d80" }}>預覽</span>}
                </div>
              </div>
            ) : f.type === "textarea" ? (
              <textarea
                value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={8}
                placeholder={f.placeholder || ""} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            ) : (
              <>
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder || ""} style={inputStyle}
                  list={f.suggestions ? `dl-${f.key}` : undefined}
                />
                {f.suggestions && (
                  <datalist id={`dl-${f.key}`}>
                    {f.suggestions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                )}
              </>
            )}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="submit" style={{ background: "#B5445B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600 }}>
          {submitLabel || "儲存"}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: "1px solid #EADFD4", borderRadius: 8, padding: "9px 18px", fontSize: 13 }}>
          取消
        </button>
      </div>
    </form>
  );
}
