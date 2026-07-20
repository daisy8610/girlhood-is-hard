import { useState } from "react";

// 消費/預算分頁共用：依主分類篩選 + 關鍵字搜尋
export function useCategoryFilter(data, { catKey = "main", searchKeys }) {
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");

  const cats = ["全部", ...Array.from(new Set(data.map((r) => r[catKey]).filter(Boolean)))];
  const q = search.trim().toLowerCase();
  const filtered = data.filter(
    (r) =>
      (filter === "全部" || r[catKey] === filter) &&
      (!q || searchKeys.some((k) => r[k] && String(r[k]).toLowerCase().includes(q)))
  );

  return { filter, setFilter, search, setSearch, cats, filtered };
}
