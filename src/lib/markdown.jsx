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
      blocks.push(<hr key={i} className="md-hr" />);
      i++; continue;
    }
    if (/^#{2,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push(
        <div key={i} className={"title-font md-h md-h--" + level}>
          {inlineMD(line.replace(/^#+\s/, ""))}
        </div>
      );
      i++; continue;
    }
    if (line.trim().startsWith(">")) {
      blocks.push(
        <div key={i} className="md-quote">
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
        <div key={i + "-tbl"} className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                {rows[0].map((c, ci) => (
                  <th key={ci}>
                    {inlineMD(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci}>
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
        <ul key={i + "-ul"} className="md-list">
          {items.map((it, ii) => <li key={ii}>{inlineMD(it)}</li>)}
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
        <ol key={i + "-ol"} className="md-list">
          {items.map((it, ii) => <li key={ii}>{inlineMD(it)}</li>)}
        </ol>
      );
      continue;
    }
    blocks.push(<p key={i} className="md-p">{inlineMD(line)}</p>);
    i++;
  }
  return blocks;
}
