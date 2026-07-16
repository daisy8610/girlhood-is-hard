import React, { useState } from "react";
import { renderMD } from "../lib/markdown";
import { SectionTitle, AddButton, RecordForm, RowActions, Tag } from "./ui";

const NOTE_FIELDS = [
  { key: "title", label: "標題", type: "text" },
  { key: "category", label: "分類", type: "select", options: ["身體狀況", "營養補充品", "皮膚／保養", "醫療檢查解讀", "其他"] },
  { key: "status", label: "狀態", type: "select", options: ["草稿", "已整理", "放棄／暫時不用"] },
  { key: "tags", label: "標籤（逗號分隔）", type: "tags" },
  { key: "content", label: "內文（支援簡單 markdown：## 標題、- 清單、**粗體**、| 表格 |）", type: "textarea", livePreview: true },
];

function NoteCard({ r, h, editingId, setEditingId }) {
  const [open, setOpen] = useState(false);
  if (editingId === r.id) {
    return (
      <RecordForm fields={NOTE_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
        onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
    );
  }
  return (
    <div className="row-hover" style={{ border: "1px solid #EADFD4", borderRadius: 10, overflow: "hidden", background: "#FBF7F2" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "12px 14px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
            <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
            <span style={{ fontSize: 12, color: "#9a8d80" }}>{open ? "▲" : "▼"}</span>
          </div>
        </div>
        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Tag color="#B08D57">{r.category}</Tag>
          <Tag>{r.status}</Tag>
          {(r.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
      </div>
      {open && (
        <div style={{ padding: "4px 16px 16px", borderTop: "1px dashed #EADFD4" }}>
          {r.content ? renderMD(r.content) : <div style={{ fontSize: 13, color: "#9a8d80" }}>（沒有內文）</div>}
        </div>
      )}
    </div>
  );
}

export function NotesTab({ data, h }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <SectionTitle sub="完整內文已從 Notion 搬過來，點筆記可以展開閱讀或編輯">筆記區</SectionTitle>
      {!adding && <AddButton onClick={() => setAdding(true)} label="新增筆記" />}
      {adding && (
        <RecordForm fields={NOTE_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { h.add(r); setAdding(false); }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((r) => <NoteCard key={r.id} r={r} h={h} editingId={editingId} setEditingId={setEditingId} />)}
      </div>
    </div>
  );
}
