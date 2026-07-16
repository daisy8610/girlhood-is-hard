export const fmt = (n) =>
  n == null ? "—" : (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("zh-TW");

export const MAIN_COLORS = {
  "醫美": "#B5445B",
  "頭髮": "#5C7A8A",
  "美容": "#B08D57",
  "指甲": "#6E8E76",
};

export const num = (v) => (v == null || v === "" ? null : Number(v));

export function download(filename, text, type) {
  try {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return true;
  } catch (e) {
    return false;
  }
}

export function toCSV(rows, headers) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map((h) => esc(h.label)).join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => esc(r[h.key])).join(",")));
  return "\ufeff" + lines.join("\n");
}
