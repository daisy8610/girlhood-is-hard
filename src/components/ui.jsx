import React, { useState, useEffect } from "react";
import { renderMD } from "../lib/markdown";

export function Tag({ children, color }) {
  return (
    <span
      style={{
        display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20,
        background: (color || "#9C8288") + "1f", color: color || "#5a5044",
        border: `1px solid ${(color || "#9C8288")}55`,
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
      <h2 className="serif" style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#AD455E" }}>{children}</h2>
      {sub && <div style={{ fontSize: 12, color: "#A88690", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid #D9718A", color: "#AD455E", background: "transparent", borderRadius: 8,
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
        <button className="iconbtn" onClick={onDelete} style={{ color: "#AD455E", fontWeight: 700 }} title="再按一次確認刪除">確定刪除？</button>
      ) : (
        <button className="iconbtn" onClick={() => setConfirming(true)} title="刪除">✕</button>
      )}
    </span>
  );
}

export function CategoryChips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {options.map((c) => (
        <button
          key={c} onClick={() => onChange(c)}
          style={{
            padding: "6px 13px", borderRadius: 20, fontSize: 12, border: "1px solid #F3DCDF",
            background: value === c ? "#C25B72" : "transparent", color: value === c ? "#fff" : "#7A5560",
          }}
        >
          {c}
        </button>
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
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 2, zIndex: 10,
          background: "#fff", border: "1px solid #F3DCDF", borderRadius: 6,
          maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 12px rgba(90,60,50,0.12)",
        }}>
          {matches.map((s) => (
            <div
              key={s} className="row-hover"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{ padding: "7px 10px", fontSize: 13, cursor: "pointer" }}
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
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #F3DCDF", fontSize: 13, marginBottom: 12, background: "#fff" }}
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
      if (f.fallbackKey && (v === "" || v == null)) v = vals[f.fallbackKey];
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

  const inputStyle = { display: "block", width: "100%", marginTop: 4, padding: "8px 8px", borderRadius: 6, border: "1px solid #F3DCDF", fontSize: 13 };

  return (
    <form onSubmit={submit} style={{ border: "1px solid #F3DCDF", borderRadius: 10, padding: 14, marginBottom: 14, background: "#FFFCFA" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {fields.map((f) => (
          <label key={f.key} style={{ fontSize: 12, color: "#7A5560", gridColumn: f.type === "textarea" || f.type === "date" ? "1 / -1" : "auto" }}>
            {f.label}{f.required && <span style={{ color: "#AD455E" }}> *</span>}
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
                  {vals[f.key] ? renderMD(vals[f.key]) : <span style={{ color: "#A88690" }}>預覽</span>}
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
                suggestions={f.suggestions} placeholder={f.placeholder} style={inputStyle}
              />
            ) : f.type === "date" ? (
              // iOS Safari 的 input[type=date] 渲染寬度有時會忽略 CSS 設定值、超出外框，
              // 用 overflow:hidden 的容器裁掉超出部分，點擊行為不受影響
              <div style={{ ...inputStyle, padding: 0, overflow: "hidden" }}>
                <input
                  type="date"
                  value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 8px", border: "none", borderRadius: 6 }}
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
      {err && <div style={{ marginTop: 10, fontSize: 12, color: "#AD455E" }}>⚠️ {err}</div>}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="submit" style={{ background: "#D9718A", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600 }}>
          {submitLabel || "儲存"}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: "1px solid #F3DCDF", borderRadius: 8, padding: "9px 18px", fontSize: 13 }}>
          取消
        </button>
      </div>
    </form>
  );
}
