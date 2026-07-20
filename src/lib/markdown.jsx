import React from "react";

function inlineMD(text, key) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <React.Fragment key={key}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </React.Fragment>
  );
}

// 支援：## / ### 標題、---分隔線、> 引言、| 表格 |、- 清單、1. 編號清單、**粗體**
export function renderMD(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (line.trim() === "---") {
      blocks.push(<hr key={i} style={{ border: "none", borderTop: "1px dashed #F3DCDF", margin: "16px 0" }} />);
      i++; continue;
    }
    if (/^#{2,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push(
        <div key={i} className="serif" style={{ fontSize: level === 2 ? 17 : 15, fontWeight: 700, color: "#AD455E", margin: "14px 0 8px" }}>
          {inlineMD(line.replace(/^#+\s/, ""))}
        </div>
      );
      i++; continue;
    }
    if (line.trim().startsWith(">")) {
      blocks.push(
        <div key={i} style={{ borderLeft: "3px solid #F3DCDF", paddingLeft: 10, color: "#9C8288", fontSize: 13, margin: "8px 0" }}>
          {inlineMD(line.replace(/^>\s?/, ""))}
        </div>
      );
      i++; continue;
    }
    if (line.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        if (!/^\|[\s:-]+\|/.test(lines[i].trim())) {
          rows.push(lines[i].trim().slice(1, -1).split("|").map((c) => c.trim()));
        }
        i++;
      }
      blocks.push(
        <div key={i + "-tbl"} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
            <thead>
              <tr>
                {rows[0].map((c, ci) => (
                  <th key={ci} style={{ textAlign: "left", padding: "6px 10px", background: "#FBF3EE", borderBottom: "2px solid #F3DCDF", whiteSpace: "nowrap" }}>
                    {inlineMD(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} style={{ padding: "6px 10px", borderBottom: "1px solid #FBE8ED", verticalAlign: "top" }}>
                      {inlineMD(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul key={i + "-ul"} style={{ margin: "6px 0", paddingLeft: 20 }}>
          {items.map((it, ii) => <li key={ii} style={{ fontSize: 13.5, lineHeight: 1.7 }}>{inlineMD(it)}</li>)}
        </ul>
      );
      continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol key={i + "-ol"} style={{ margin: "6px 0", paddingLeft: 20 }}>
          {items.map((it, ii) => <li key={ii} style={{ fontSize: 13.5, lineHeight: 1.7 }}>{inlineMD(it)}</li>)}
        </ol>
      );
      continue;
    }
    blocks.push(<p key={i} style={{ fontSize: 13.5, lineHeight: 1.8, margin: "6px 0" }}>{inlineMD(line)}</p>);
    i++;
  }
  return blocks;
}
