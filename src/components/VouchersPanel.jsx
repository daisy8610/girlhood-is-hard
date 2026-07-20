import React, { useState } from "react";
import { fmt } from "../lib/format";
import { RecordForm, RowActions } from "./ui";

const VOUCHER_FIELDS = [
  { key: "name", label: "名稱", type: "text" },
  { key: "value", label: "剩餘數值", type: "number" },
  { key: "unit", label: "單位", type: "select", options: ["元", "堂", "次"] },
  { key: "updated", label: "更新日期", type: "date", default: new Date().toISOString().slice(0, 10) },
  { key: "note", label: "備註", type: "text" },
];

export function VouchersPanel({ data, h }) {
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#7A5560" }}>儲值金與剩餘堂數</div>
        {!adding && (
          <button className="iconbtn" style={{ color: "#AD455E", fontWeight: 600 }} onClick={() => setAdding(true)}>
            + 新增
          </button>
        )}
      </div>
      {adding && (
        <RecordForm fields={VOUCHER_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { h.add(r); setAdding(false); }} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
        {data.map((r) =>
          editingId === r.id ? (
            <div key={r.id} style={{ gridColumn: "1 / -1" }}>
              <RecordForm fields={VOUCHER_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
                onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
            </div>
          ) : (
            <div key={r.id} style={{ border: "1px solid #F3DCDF", borderRadius: 10, padding: "12px 14px", background: "#FFFCFA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                <div style={{ fontSize: 13, color: "#7A5560" }}>{r.name}</div>
                <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <div className="mono" style={{ fontSize: 21, fontWeight: 600, marginTop: 4, color: "#AD455E" }}>
                  {r.value == null ? "？" : r.unit === "元" ? fmt(r.value) : r.value}
                  {r.unit !== "元" && r.value != null && <span style={{ fontSize: 13, marginLeft: 3, color: "#7A5560" }}>{r.unit}</span>}
                </div>
                {r.value != null && r.value > 0 && r.unit !== "元" && (
                  <button
                    className="iconbtn"
                    title="扣一次"
                    onClick={() => h.update(r.id, { value: r.value - 1, updated: new Date().toISOString().slice(0, 10) })}
                    style={{ border: "1px solid #F3DCDF", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}
                  >
                    − 用一次
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#A88690", marginTop: 4 }}>{r.updated || "—"}{r.note ? ` · ${r.note}` : ""}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
