# Tales Runner UMT Map Manager 實作計劃

## 技術選型

建議使用以下架構：

- Desktop shell：Tauri
- Frontend：React + TypeScript
- Backend：Rust
- Styling：CSS Modules 或 Tailwind CSS
- i18n：i18next
- 本機設定：Tauri app data directory 入面嘅 JSON 檔

目標平台：

- Windows
- macOS

## 專案結構

建議結構：

```text
TalesRunnerUMManager/
  src/
    app/
      App.tsx
      routes.tsx
    components/
      MapTable.tsx
      MapDetails.tsx
      SearchBar.tsx
      StatusBadge.tsx
      SettingsDialog.tsx
    i18n/
      en.json
      zh_HK.json
      zh_TW.json
      kr.json
      index.ts
    lib/
      catalog.ts
      mapStatus.ts
      settings.ts
      tauriCommands.ts
    styles/
      globals.css
  src-tauri/
    src/
      main.rs
      catalog.rs
      downloader.rs
      drive.rs
      installer.rs
      manifest.rs
      settings.rs
      paths.rs
    tauri.conf.json
  README.md
  IMPLEMENTATION_PLAN.md
```

## 資料模型

### MapRecord

Frontend 同 backend 都需要相同概念：

```ts
type MapRecord = {
  id: string;
  rowIndex: number;
  name: string;
  downloadUrl: string;
  rawColumns: Record<string, string>;
};
```

`id` 建議由以下資料產生：

- Google Sheets row index
- download URL
- map name

初期可以用穩定 hash，例如 `sha256(rowIndex + downloadUrl + name)`。

### InstalledMap

```ts
type InstalledMap = {
  id: string;
  name: string;
  sourceUrl: string;
  installedAt: string;
  installRoot: string;
  files: string[];
};
```

`files` 必須儲存相對於 UMT folder 嘅路徑，避免 manifest 寫死完整路徑。

### Settings

```ts
type Settings = {
  language: "en" | "zh_HK" | "zh_TW" | "kr";
  installDir: string;
  sheetCsvUrl: string;
};
```

預設 `installDir`：

- Windows：`%USERPROFILE%\Documents\跑Online\UMT`
- macOS：`~/Documents/跑Online/UMT`

## Google Sheets Catalog

### CSV URL

Google Sheets 可以嘗試使用 CSV export URL：

```text
https://docs.google.com/spreadsheets/d/1z_-X1XgfZ8sgXkeSk_d_vjMNXVV_YAeNvnAk1naRmeA/export?format=csv&gid=1384848327
```

### 讀取策略

1. Backend 下載 CSV。
2. 用 CSV parser 讀取 header 同 rows。
3. 第 D 欄固定視為 download URL。
4. 如果 header 存在，rawColumns 使用 header 作 key。
5. 如果 header 缺失，使用 `Column A`、`Column B` 等 fallback key。
6. 地圖名稱優先順序：
   - 常見 name header，例如 `name`、`map name`、`地圖名稱`
   - 第一欄
   - `.upk` 檔名

## Google Drive 下載

### 支援連結格式

需要支援：

```text
https://drive.google.com/file/d/<FILE_ID>/view
https://drive.google.com/open?id=<FILE_ID>
https://drive.google.com/uc?id=<FILE_ID>
https://drive.google.com/uc?export=download&id=<FILE_ID>
```

### 下載流程

1. 解析 Google Drive file id。
2. 建立 direct download URL。
3. 下載到暫存資料夾。
4. 如果 Google Drive 回傳 virus scan / confirm page，需要解析 confirm token 後再下載。
5. 檢查下載結果：
   - 檔案存在
   - 大小大於 0
   - 副檔名係 `.upk`
6. 回傳暫存檔案路徑同建議檔名。

## 安裝流程

Backend command：`install_map(record: MapRecord)`

流程：

1. 載入 settings。
2. 確認 installDir 存在，不存在就建立。
3. 下載 `.upk` 到暫存資料夾。
4. 決定目的檔名：
   - 優先使用 Google Drive 下載檔名。
   - 如果無法取得，使用 map name 清理成安全檔名並加 `.upk`。
5. 如果目的檔案已存在：
   - 前端需要提示使用者選擇取消、覆蓋、改名。
6. 將 `.upk` 移到 installDir。
7. 更新 manifest。
8. 回傳安裝成功狀態。

安全要求：

- 實際寫入路徑必須 canonicalize。
- 寫入目的地必須位於 installDir 之內。
- 不接受含 `..` 嘅目的檔名。

## 移除流程

Backend command：`uninstall_map(mapId: string)`

流程：

1. 讀取 manifest。
2. 找出指定 mapId。
3. 對 manifest 入面每個 relative path 組合完整路徑。
4. canonicalize 並確認仍然位於 installDir 之內。
5. 只刪除 manifest 記錄嘅檔案。
6. 更新 manifest。
7. 回傳移除成功狀態。

初期只支援移除由本程式安裝嘅地圖。手動安裝嘅 `.upk` 只顯示為 detected，不提供直接刪除，避免誤刪。

## 掃描已安裝地圖

Backend command：`scan_installed_maps()`

流程：

1. 掃描 installDir 內 `.upk` 檔案。
2. 讀取 manifest。
3. 將 catalog maps 同 manifest 做比對。
4. 將 catalog maps 同現有 `.upk` 檔名做弱比對。
5. 回傳每張地圖狀態：
   - `installedManaged`
   - `installedDetected`
   - `notInstalled`

## Tauri Commands

建議 backend 暴露以下 commands：

```text
get_settings()
save_settings(settings)
load_catalog()
refresh_catalog()
scan_installed_maps()
install_map(map_id)
uninstall_map(map_id)
open_install_dir_picker()
open_install_dir()
clear_download_cache()
```

初期可先做：

```text
get_settings()
save_settings(settings)
load_catalog()
scan_installed_maps()
install_map(map_id)
uninstall_map(map_id)
```

## Frontend 頁面

### Main View

包含：

- 搜尋框
- 安裝狀態 filter
- 地圖表格
- 地圖詳情 panel
- install / uninstall button
- refresh button
- settings button

### Settings Dialog

包含：

- install folder path
- browse button
- language selector
- sheet URL 顯示或 advanced edit
- save button

### Loading / Error State

需要處理：

- Catalog 載入中
- 無法讀取 Google Sheets
- 無網絡
- 下載失敗
- installDir 不存在或無權限
- Google Drive link 無效

## i18n Key 初稿

```json
{
  "app.title": "Tales Runner UMT Map Manager",
  "action.refresh": "Refresh",
  "action.settings": "Settings",
  "action.install": "Install",
  "action.uninstall": "Uninstall",
  "action.cancel": "Cancel",
  "action.save": "Save",
  "search.placeholder": "Search maps...",
  "filter.all": "All",
  "filter.installed": "Installed",
  "filter.notInstalled": "Not installed",
  "status.installedManaged": "Installed",
  "status.installedDetected": "Detected",
  "status.notInstalled": "Not installed",
  "settings.installDir": "Install folder",
  "settings.language": "Language",
  "error.catalogLoadFailed": "Unable to load map catalog.",
  "error.downloadFailed": "Download failed.",
  "error.invalidUpk": "Downloaded file is not a .upk file."
}
```

## 開發里程碑

### Milestone 1：Scaffold

- 建立 Tauri + React + TypeScript app。
- 加入基本 layout。
- 加入 i18n。
- 建立 settings JSON 讀寫。

驗收：

- App 可以開啟。
- 可以切換語言。
- 可以儲存 install folder。

### Milestone 2：Catalog

- 從 Google Sheets CSV 載入資料。
- 正確讀取第 D 欄 download URL。
- 顯示地圖清單。
- 支援搜尋。

驗收：

- App 顯示 sheet 入面嘅 maps。
- 搜尋可以即時過濾。
- CSV 讀取失敗時有錯誤訊息。

### Milestone 3：Local Scan

- 掃描 UMT folder。
- 顯示 installed / not installed。
- 建立 manifest。

驗收：

- 已存在 `.upk` 會顯示 detected。
- 由 manifest 記錄嘅 map 會顯示 installed。

### Milestone 4：Install

- 支援 Google Drive link 下載 `.upk`。
- 安裝到 UMT folder。
- 記錄 manifest。

驗收：

- 按 Install 後 `.upk` 出現在 UMT folder。
- App 狀態即時變成 installed。
- 重開 app 後仍然知道該 map 已安裝。

### Milestone 5：Uninstall

- 根據 manifest 移除 `.upk`。
- 加入確認提示。
- 加入路徑安全檢查。

驗收：

- 按 Uninstall 後只刪除該 map 嘅 `.upk`。
- 不會刪除 UMT folder 以外檔案。

### Milestone 6：Packaging

- Windows build。
- macOS build。
- 基本 smoke test。

驗收：

- Windows 可正常安裝同開啟。
- macOS 可正常開啟。
- 主要功能喺兩個平台都可用。

## 測試清單

### Catalog

- Google Sheets 正常讀取。
- Google Sheets 無法連線。
- D 欄空白。
- D 欄唔係 Google Drive link。
- Header 改名仍然可以顯示資料。

### Download

- Google Drive file link。
- Google Drive open id link。
- 下載檔名有空格。
- 下載檔名有中文。
- 下載結果唔係 `.upk`。
- 網絡中斷。

### Install

- UMT folder 不存在。
- UMT folder 已存在。
- `.upk` 已存在。
- 檔名包含不安全字元。

### Uninstall

- Manifest 正常。
- Manifest missing。
- Manifest 記錄檔案已不存在。
- Path traversal 嘗試。
- 手動放入嘅 `.upk` 不會被誤刪。

### i18n

- `en`
- `zh_HK`
- `zh_TW`
- `kr`
- 切換語言後 UI 即時更新。

## 建議下一步

下一步可以直接建立 Tauri + React 專案骨架，然後先完成 Milestone 1 同 Milestone 2。完成之後，就可以實際睇到 Google Sheets 地圖清單，亦可以確認資料欄位同下載 link 格式。
