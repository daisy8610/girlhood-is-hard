# CHANGELOG

## 2026-07-16
- 修正 Overview、BudgetTab 標題寫死 2026 的問題，改成自動取當年年份
- 移除 quotes 的 `treatment_name` 殘留欄位（寫入後從未被讀回，屬未使用欄位）
- BudgetTab 的年度策略區塊改成可編輯：內容不再寫死在程式碼裡，改存到 `profiles.annual_strategy`，透過畫面上的「編輯」按鈕修改（markdown 格式，跟筆記區一樣的渲染方式）
