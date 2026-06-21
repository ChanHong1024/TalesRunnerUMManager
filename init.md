# Tales Runner UMT Map Manager 草稿

## 目標

建立一個支援 Windows 同 macOS 嘅 GUI 程式，用嚟管理《跑 Online / Tales Runner》玩家自製地圖。程式會由指定 Google Sheets 讀取地圖清單，顯示可下載地圖，檢查本機已安裝地圖，並提供安裝、重新安裝、移除功能。

資料來源：

<https://docs.google.com/spreadsheets/d/1z_-X1XgfZ8sgXkeSk_d_vjMNXVV_YAeNvnAk1naRmeA/edit?gid=1384848327#gid=1384848327>

目前已知需求：

- 地圖下載連結位於 Google Sheets 第 D 欄。
- 下載連結係 Google Drive link，目標檔案會直接下載為 `.upk`。
- `.upk` 係 Tales Runner 地圖檔案格式。
- 預設地圖資料夾為 `Documents\跑Online\UMT`。
- 使用者可以自訂地圖資料夾。
- GUI 需要支援搜尋、安裝、移除地圖。
- 需要 i18n：`en`、`zh_HK`、`zh_TW`、`kr`。

## 建議技術方案

建議使用 Tauri + React + TypeScript。

原因：

- 可同時支援 Windows 同 macOS。
- 相比 Electron，Tauri 打包體積較細。
- Rust backend 適合處理檔案掃描、下載、解壓、刪除安全檢查。
- React frontend 方便實作搜尋、表格、設定頁同多語言介面。

## 主要功能

### 1. 地圖清單

程式需要由 Google Sheets 載入地圖資料。

初步規則：

- 第 D 欄視為下載連結欄。
- 其他欄位應盡量自動讀取並顯示，例如地圖名稱、作者、分類、備註、日期等。
- 如果 Google Sheets 欄位名稱日後改變，程式仍應顯示原始欄位資料，避免完全失效。
- 需要提供重新整理按鈕。
- 可加入本機快取，避免每次開 app 都即時依賴網絡。

### 2. 搜尋同篩選

GUI 需要支援：

- 以地圖名稱搜尋。
- 以作者、分類、備註或其他欄位搜尋。
- 篩選已安裝 / 未安裝地圖。
- 可按名稱、作者、安裝狀態或原始表格順序排序。

### 3. 偵測已安裝地圖

預設資料夾：

- Windows：`%USERPROFILE%\Documents\跑Online\UMT`
- macOS：`~/Documents/跑Online/UMT`

使用者可以於設定頁修改資料夾。

程式需要：

- 掃描指定資料夾。
- 比對 Google Sheets 地圖清單。
- 顯示每張地圖是否已安裝。
- 儲存由本程式安裝嘅地圖 manifest，方便日後安全移除。

### 4. 安裝地圖

安裝流程：

1. 使用者按「安裝」。
2. 程式讀取第 D 欄 Google Drive link。
3. 解析 Google Drive 檔案 ID。
4. 下載檔案到暫存位置。
5. 驗證下載結果係 `.upk` 檔案。
6. 將 `.upk` 複製或移動到指定 UMT 資料夾。
7. 記錄安裝 manifest。
8. 更新地圖狀態為已安裝。

需要處理：

- Google Drive 常見分享連結格式。
- 下載進度。
- 下載失敗重試。
- 檔案副檔名唔係 `.upk` 時需要提示使用者。
- 檔案已存在時提示使用者。
- 不應無提示覆蓋玩家現有檔案。

### 5. 移除地圖

移除流程：

1. 使用者按「移除」。
2. 程式讀取安裝 manifest。
3. 只刪除該地圖安裝時建立嘅檔案。
4. 移除空資料夾。
5. 更新狀態為未安裝。

安全要求：

- 只可以刪除設定 UMT 資料夾入面嘅檔案。
- 不可以刪除 UMT 以外嘅路徑。
- 對於非本程式安裝嘅地圖，只在有足夠信心配對時先提供移除。
- 需要有確認提示。

### 6. 設定

設定頁需要包括：

- 地圖資料夾路徑。
- 語言選擇。
- 重新載入 Google Sheets。
- 清除下載快取。
- 顯示 app 版本。

### 7. 多語言

支援語言：

- English：`en`
- 香港繁體中文：`zh_HK`
- 台灣繁體中文：`zh_TW`
- Korean：`kr`

建議使用 JSON translation files：

```text
src/i18n/en.json
src/i18n/zh_HK.json
src/i18n/zh_TW.json
src/i18n/kr.json
```

所有 GUI 文字都應該經 i18n key 顯示。Google Sheets 入面嘅地圖資料則保留原文。

## 初步 UI 草圖

主畫面：

```text
------------------------------------------------------------
 Tales Runner UMT Map Manager       [Refresh] [Settings]
------------------------------------------------------------
 Search maps...             Status: [All / Installed / New]
------------------------------------------------------------
 Map Name        Author        Status        Action
 ----------------------------------------------------------
 Example Map     Someone       Installed     Uninstall
 Example Map 2   Someone       Not installed Install
------------------------------------------------------------
 Details
 - Map name
 - Author
 - Source row data
 - Download link
 - Local install path
 - Last action status
------------------------------------------------------------
```

## 本機資料建議

程式可於 app data 目錄儲存：

```text
settings.json
catalog-cache.json
installed-manifest.json
downloads/
```

`installed-manifest.json` 建議記錄：

```json
{
  "maps": [
    {
      "id": "stable-map-id",
      "name": "Map name",
      "sourceUrl": "Google Drive URL",
      "installedAt": "2026-06-21T00:00:00Z",
      "installRoot": "C:\\Users\\user\\Documents\\跑Online\\UMT",
      "files": [
        "relative/path/file.ext"
      ]
    }
  ]
}
```

## 風險同待確認事項

正式開發前需要確認：

1. UMT 地圖實際安裝後是否只需要放置單一 `.upk` 檔案？
2. `.upk` 檔名是否足夠用嚟識別一張地圖？
3. 如果 Google Sheets 內地圖名稱同 `.upk` 檔名不同，應該以邊個作安裝狀態比對？
4. Google Sheets 是否公開並可用 CSV export 方式讀取？
5. 韓國語言代碼應否用 `ko`，定係照需求使用 `kr` 作 app 內部代碼？

## 建議開發階段

### Phase 1：基礎 GUI

- 建立 Tauri + React 專案。
- 建立主畫面。
- 建立 i18n 架構。
- 建立設定頁。

### Phase 2：Google Sheets Catalog

- 讀取 Google Sheets CSV。
- 將第 D 欄解析為下載連結。
- 顯示地圖清單。
- 支援搜尋同篩選。

### Phase 3：本機掃描

- 設定 UMT 資料夾。
- 掃描資料夾。
- 顯示安裝狀態。
- 建立 manifest 格式。

### Phase 4：下載同安裝

- 支援 Google Drive 下載。
- 驗證 `.upk` 檔案。
- 將 `.upk` 安裝到 UMT 資料夾。
- 記錄 manifest。

### Phase 5：移除同安全檢查

- 根據 manifest 移除地圖。
- 加入刪除確認。
- 加入路徑安全檢查。

### Phase 6：打包同測試

- Windows build。
- macOS build。
- 測試不同語言。
- 測試不同 UMT 路徑。
- 測試下載失敗、重複安裝、移除等情況。
