# 當女生好難 · 美容存摺

個人的美容／醫美消費追蹤 App。手機加到主畫面後，使用起來就像一個原生 App。

🔗 **網址**：https://daisy8610.github.io/girlhood-is-hard/

---

## 這是什麼

一個記錄美容、醫美消費，順便做詢價比較的私人小工具。原本資料放在 Notion，
覺得 Notion 在手機上不夠直覺，所以做成獨立的網頁 App。

### 功能
- 📔 **總覽**：今年／歷年支出、年度預算使用進度（今年累積支出 ÷ 預算上限）、分類支出統計、年度支出比較圖（點柱子看明細）、子分類佔比排行、儲值金與剩餘堂數
- 🧾 **消費紀錄**：搜尋、分類篩選、新增／編輯／複製／刪除，可選填時間、勾選同步到 Google 日曆
- 💉 **詢價比較**：自動算單位價，同一產品近半年最便宜的標「最划算」；可依療程類別篩選，並切換「依產品／依診所／依日期列表」三種檢視；超過半年的報價會變淡
- 🩺 **筆記區**：保養／健康相關的長文筆記，支援簡單 markdown（表格、清單、粗體）
- ⚙️ **設定**：年度預算上限、備份／還原（JSON）、清空資料、Google 日曆連結
- 📅 **Google 日曆同步**：新增消費紀錄時勾選「同步到 Google 日曆」，就會依填的日期/時間建一筆行程（有時間就是 1 小時定時行程，沒填就是全天事件），說明欄自動帶入備註、金額，並固定加上 `#漂亮` 標籤方便日後搜尋

---

## 專案結構

```
├── index.html          網頁入口（也在這裡載入 Google Fonts）
├── app.js              打包後的執行檔（GitHub Pages 實際載入這個）
├── app.css             打包後的樣式檔（由 src/styles.css 產生）
├── config.js            Supabase 連線設定（url + anon key）
├── manifest.json        PWA 設定，讓手機能「加到主畫面」
├── icon-*.png            App 圖示
├── package.json
├── CHANGELOG.md         變更紀錄（每天一筆）
├── .github/workflows/
│   └── keep-alive.yml    每 4 小時查一次資料庫，避免 Supabase 免費方案自動暫停
├── supabase/
│   ├── config.toml       Edge Function 設定（哪幾支不驗證 JWT）
│   └── functions/
│       ├── google-oauth-start/      導向 Google 授權畫面
│       ├── google-oauth-callback/   收授權碼、換 token、存起來
│       └── google-calendar-sync/    實際呼叫 Calendar API 新增事件
└── src/                  原始碼
    ├── main.jsx          進入點
    ├── styles.css        全站樣式（字級、圓角、主題色變數在最上面）
    ├── App.jsx           組合各部分：登入狀態、toast、分頁切換
    ├── lib/
    │   ├── supabaseClient.js   Supabase client 初始化
    │   ├── useAppData.js       全站資料讀寫、備份匯出匯入
    │   ├── useGoogleCalendar.js Google 日曆連結與同步
    │   ├── db.js               資料層：App 欄位 <-> 資料庫 schema 轉換、CRUD
    │   ├── format.js           格式化、下載、CSV 工具
    │   ├── backup.js           JSON 備份格式驗證
    │   └── markdown.jsx        筆記內文的輕量 markdown 渲染器
    └── components/
        ├── AppShell.jsx          外框：側邊欄、頁首、底部導覽、toast
        ├── ui.jsx                共用小元件（Tag、表單、按鈕…）
        ├── AuthScreen.jsx        登入/註冊
        ├── Overview.jsx          總覽頁
        ├── TrendChart.jsx        趨勢圖表
        ├── SubcategoryRanking.jsx 子分類佔比排行
        ├── VouchersPanel.jsx     儲值金／堂數面板
        ├── SpendingTab.jsx       消費紀錄
        ├── QuotesTab.jsx         詢價比較
        ├── NotesTab.jsx          筆記區
        └── SettingsPage.jsx      設定頁
```

---

## 技術架構

- **前端**：React 18，esbuild 打包成 `app.js` 和 `app.css`
- **後端／資料庫**：[Supabase](https://supabase.com)（PostgreSQL + Auth + Edge Functions）
- **部署**：GitHub Pages（純靜態網站，這個 repo 本身）
- **Google 日曆整合**：Supabase Edge Functions 處理 OAuth 授權與 Calendar API 呼叫，
  Client ID/Secret 等敏感資訊存在 Supabase Function Secrets，不進 repo

### 外觀

- 樣式都在 `src/styles.css`，最上面的 `:root` 集中了字級（`--fs-*`）、圓角（`--r-*`）、主題色（`--ed-*`），想調整外觀先改這裡
- 字體：英文與數字用 Inter（金額用等寬數字 `tabular-nums`，上下對齊），中文內文用思源黑體（Noto Sans TC），標題用昭源環方（Chiron GoRound TC）
- 分類識別色在 `src/lib/format.js` 的 `MAIN_COLORS`（醫美、頭髮、美容、指甲），會隨資料變動，所以不放在 CSS

### 資料庫

資料表：`expenses`（消費）、`quotes`（詢價）、
`notes`（筆記）、`vouchers`（儲值金堂數）、`providers`（店家／診所）、`profiles`（個人設定）、
`google_calendar_tokens`（Google 日曆授權，只有 Edge Function 用 service role 讀寫）。
全部啟用 Row Level Security，只有登入本人能讀寫自己的資料。

---

## 隱私

這個 repo 是 Public，但**不含任何個人資料**：
- 原始碼與打包後的 `app.js` 只是純粹的介面邏輯，不夾帶任何消費紀錄、筆記內容
- 所有實際資料只存在 Supabase 後台，受帳號登入與 Row Level Security 保護
- `config.js` 裡的 `anonKey` 設計上就是給前端公開使用的值，搭配 RLS 沒有安全疑慮

---

## 本機開發／更新

```bash
npm install       # 安裝依賴
npm run dev       # 本機預覽：開 http://localhost:8000，改程式碼會自動重新打包
npm run build     # 打包成 app.js 和 app.css（正式上線用，會壓縮）
```

改完程式碼、`npm run build` 之後，把新的 `app.js`、`app.css` 連同改過的 `src/` 一起
commit、push 上去即可，GitHub Pages 會自動重新部署，網址不會變。
沒有自動 build 的流程，**push 前一定要先跑 `npm run build`**，不然網站上還是舊的 `app.js`／`app.css`。
每次改動記得同步更新 `CHANGELOG.md`。

如果改到 `supabase/functions/` 底下的 Edge Function，前端的 push 不會自動部署它，
要另外手動跑（哪支改了就跑哪支）：

```bash
supabase functions deploy google-oauth-start
supabase functions deploy google-oauth-callback
supabase functions deploy google-calendar-sync
```

---

*個人專案，非公開服務。*
