import React, { useState, useEffect } from "react";
import { renderMD } from "../lib/markdown";

export function Tag({ children, color }) {
  return (
    <span className="tag">{children}</span>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div className="section-title">
      <h2 className="title-font">{children}</h2>
      {sub && <div className="section-title__sub">{sub}</div>}
    </div>
  );
}

export function AddButton({ onClick, label }) {
  return (
    <button className="add-btn" onClick={onClick}>
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
    <span className="row-actions">
      <button className="iconbtn" onClick={onEdit} title="編輯">✎</button>
      {confirming ? (
        <button className="iconbtn is-confirm" onClick={onDelete} title="再按一次確認刪除">確定刪除？</button>
      ) : (
        <button className="iconbtn" onClick={() => setConfirming(true)} title="刪除">✕</button>
      )}
    </span>
  );
}

// 藥丸形切換按鈕：選中是黑底白字
export function Chip({ active, onClick, small, children }) {
  return (
    <button className={"chip" + (small ? " chip--small" : "") + (active ? " is-active" : "")} onClick={onClick}>
      {children}
    </button>
  );
}

export function CategoryChips({ options, value, onChange }) {
  return (
    <div className="chip-row category-chips">
      {options.map((c) => (
        <Chip key={c} active={value === c} onClick={() => onChange(c)}>{c}</Chip>
      ))}
    </div>
  );
}

// 下拉建議輸入框：電腦、手機行為一致，取代原生 datalist（手機瀏覽器支援不一）
function SuggestInput({ value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const q = String(value || "").toLowerCase();
  const matches = suggestions.filter((s) => !q || s.toLowerCase().includes(q));

  return (
    <div className="suggest">
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || ""}
        className="field"
      />
      {open && matches.length > 0 && (
        <div className="suggest__menu">
          {matches.map((s) => (
            <div
              key={s} className="row-hover suggest__item"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false); }}
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
      className="search-box"
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

  return (
    <form onSubmit={submit} className="form">
      <div className="form__grid">
        {fields.map((f) => (
          <label key={f.key} className={"form__label" + (f.type === "textarea" || f.type === "date" ? " form__label--full" : "")}>
            {f.label}{f.required && <span className="form__req"> *</span>}
            {f.type === "select" ? (
              <select value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} className="field">
                <option value="">—</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "textarea" && f.livePreview ? (
              <div className="form__md-grid">
                <textarea
                  value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={10}
                  placeholder={f.placeholder || ""} className="field"
                />
                <div className="field form__md-preview">
                  {vals[f.key] ? renderMD(vals[f.key]) : <span className="form__placeholder">預覽</span>}
                </div>
              </div>
            ) : f.type === "textarea" ? (
              <textarea
                value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={8}
                placeholder={f.placeholder || ""} className="field"
              />
            ) : f.suggestions ? (
              <SuggestInput
                value={vals[f.key]} onChange={(v) => set(f.key, v)}
                suggestions={typeof f.suggestions === "function" ? f.suggestions(vals) : f.suggestions}
                placeholder={f.placeholder}
              />
            ) : f.type === "checkbox" ? (
              <div className="form__check">
                <input
                  type="checkbox" checked={!!vals[f.key]} onChange={(e) => set(f.key, e.target.checked)}
                />
              </div>
            ) : f.type === "date" || f.type === "time" ? (
              // iOS Safari 的 date 輸入框會超出外框，外框裁切的原因見 styles.css 的 .field--date；time 欄位一併套用
              <div className="field field--date">
                <input
                  type={f.type}
                  value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                  className="num"
                />
              </div>
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder || ""} className="field"
              />
            )}
          </label>
        ))}
      </div>
      {err && <div className="form__err">⚠️ {err}</div>}
      <div className="form__actions">
        <button type="submit" className="btn-primary">
          {submitLabel || "儲存"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          取消
        </button>
      </div>
    </form>
  );
}
