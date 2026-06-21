import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSettings,
  installMap,
  loadCatalog,
  mergeStatuses,
  saveSettings,
  scanInstalledMaps,
  uninstallMap,
  deactivateMap,
  activateMap,
} from "../lib/tauriCommands";
import type { InstallStatus, MapWithStatus, Settings } from "../lib/types";

type StatusFilter = "all" | "installed" | "notInstalled";

export default function App() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [maps, setMaps] = useState<MapWithStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = maps.find((map) => map.id === selectedId) ?? null;

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [catalog, installed] = await Promise.all([loadCatalog(), scanInstalledMaps()]);
      const nextMaps = mergeStatuses(catalog, installed);
      setMaps(nextMaps);
      setSelectedId((current) => current ?? nextMaps[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        i18n.changeLanguage(nextSettings.language);
      })
      .catch(() => setError(t("error.generic")))
      .finally(refresh);
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return maps.filter((map) => {
      const statusMatch =
        filter === "all" ||
        (filter === "installed" && map.status !== "notInstalled") ||
        (filter === "notInstalled" && map.status === "notInstalled");

      if (!statusMatch) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        map.name,
        map.downloadUrl,
        ...Object.values(map.rawColumns),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, maps, query]);

  async function handleInstall(map: MapWithStatus) {
    setError(null);
    try {
      await installMap(map);
      await refresh();
      setSelectedId(map.id);
    } catch (err: any) {
      setError(err?.message ?? err?.toString?.() ?? JSON.stringify(err));
    }
  }

  async function handleDeactivate(map: MapWithStatus) {
    setError(null);
    try {
      await deactivateMap(map.id, map.installedFile);
      await refresh();
      setSelectedId(map.id);
    } catch (err: any) {
      setError(err?.message ?? err?.toString?.() ?? JSON.stringify(err));
    }
  }

  async function handleActivate(map: MapWithStatus) {
    setError(null);
    try {
      await activateMap(map.id);
      await refresh();
      setSelectedId(map.id);
    } catch (err: any) {
      setError(err?.message ?? err?.toString?.() ?? JSON.stringify(err));
    }
  }

  async function handleUninstall(map: MapWithStatus) {
    setError(null);
    try {
      await uninstallMap(map.id, map.installedFile);
      await refresh();
      setSelectedId(map.id);
    } catch (err: any) {
      setError(err?.message ?? err?.toString?.() ?? JSON.stringify(err));
    }
  }

  async function handleSaveSettings(nextSettings: Settings) {
    const saved = await saveSettings(nextSettings);
    setSettings(saved);
    i18n.changeLanguage(saved.language);
    setSettingsOpen(false);
    await refresh();
  }

  // Get all available columns from the maps
  const allColumns = useMemo(() => {
    const cols = new Set<string>();
    for (const map of maps) {
      for (const key of Object.keys(map.rawColumns)) {
        cols.add(key);
      }
    }
    return Array.from(cols);
  }, [maps]);

  const visibleColumns = settings?.visibleColumns?.length
    ? settings.visibleColumns.filter((c) => allColumns.includes(c))
    : ["顯示名稱"];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{t("app.title")}</h1>
          <p>{settings?.installDir || "Documents\\跑Online\\UMT"}</p>
        </div>
        <div className="topbar-actions">
          <button className="button secondary" onClick={refresh}>
            {t("action.refresh")}
          </button>
          <button className="button primary" onClick={() => setSettingsOpen(true)}>
            {t("action.settings")}
          </button>
        </div>
      </header>

      <section className="toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
        />
        <div className="segmented">
          {(["all", "installed", "notInstalled"] as const).map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {t(`filter.${item}`)}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <section className="content-grid">
        <div className="map-list">
          <div className="table-head" style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr)) 100px 140px` }}>
            {visibleColumns.map((col) => (
              <span key={col}>{col}</span>
            ))}
            <span>{t("table.status")}</span>
            <span>{t("table.action")}</span>
          </div>

          {loading ? <div className="empty">{t("message.loading")}</div> : null}
          {!loading && filtered.length === 0 ? <div className="empty">{t("message.noResults")}</div> : null}

          {filtered.map((map) => (
            <button
              className={`map-row ${selectedId === map.id ? "selected" : ""}`}
              key={map.id}
              style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr)) 100px 140px` }}
              onClick={() => setSelectedId(map.id)}
            >
              {visibleColumns.map((col) => (
                <span key={col} className="map-cell" title={map.rawColumns[col] || ""}>
                  {map.rawColumns[col] || "-"}
                </span>
              ))}
              <StatusBadge status={map.status} />
              <span className="row-action" onClick={(event) => event.stopPropagation()}>
                {(map.status === "installedManaged" || map.status === "installedDetected") ? (
                  <>
                    <button className="button secondary" onClick={() => handleDeactivate(map)}>
                      {t("action.deactivate")}
                    </button>
                    <button className="button danger" onClick={() => handleUninstall(map)}>
                      {t("action.uninstall")}
                    </button>
                  </>
                ) : map.status === "deactivated" ? (
                  <button className="button primary" onClick={() => handleActivate(map)}>
                    {t("action.activate")}
                  </button>
                ) : map.status === "notInstalled" ? (
                  <button className="button primary" onClick={() => handleInstall(map)}>
                    {t("action.install")}
                  </button>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        <aside className="details-panel">
          <h2>{t("details.title")}</h2>
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <dl>
                <dt>{t("table.status")}</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
                <dt>{t("details.downloadUrl")}</dt>
                <dd className="break">{selected.downloadUrl}</dd>
                {selected.installedFile ? (
                  <>
                    <dt>{t("details.localFile")}</dt>
                    <dd>{selected.installedFile}</dd>
                  </>
                ) : null}
              </dl>
              <div className="raw-data">
                {Object.entries(selected.rawColumns).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value || "-"}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>{t("details.empty")}</p>
          )}
        </aside>
      </section>

      {settingsOpen && settings ? (
        <SettingsDialog
          settings={settings}
          allColumns={allColumns}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      ) : null}

      <footer className="credits">
        <p>
          Developed by <strong>Porygon</strong>
        </p>
        <p>
          Map Craft 資料來源：
          <a href="https://docs.google.com/document/d/1A58tWn9h94VHtBmlC5YpmSG1ve42pg4zH4vHZghJiuk/edit?tab=t.0" target="_blank" rel="noopener noreferrer">
            幻紫OAO (WaanJiOAO)、puihong62871 及 TaiwanPro
          </a>
        </p>
        <p className="credits-disclaimer">
          本應用程式不擁有地圖資料庫。可於設定中更改資料來源。
        </p>
        <p>
          想新增地圖？
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScLfPEDOoMfQj9bKD6E0JB-YNDS-HN2YCmUu323kz312acwFQ/viewform" target="_blank" rel="noopener noreferrer">
            填寫表單提交新地圖 →
          </a>
        </p>
      </footer>
    </main>
  );
}

function StatusBadge({ status }: { status: InstallStatus }) {
  const { t } = useTranslation();
  return <span className={`status ${status}`}>{t(`status.${status}`)}</span>;
}

function SettingsDialog({
  settings,
  allColumns,
  onClose,
  onSave,
}: {
  settings: Settings;
  allColumns: string[];
  onClose: () => void;
  onSave: (settings: Settings) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const visibleList = draft.visibleColumns || [];
  const visibleSet = new Set(visibleList);
  const hiddenCols = allColumns.filter((c) => !visibleSet.has(c));

  function toggleColumn(col: string) {
    if (visibleSet.has(col)) {
      setDraft({ ...draft, visibleColumns: visibleList.filter((c) => c !== col) });
    } else {
      setDraft({ ...draft, visibleColumns: [...visibleList, col] });
    }
  }

  function moveColumn(index: number, direction: -1 | 1) {
    const newList = [...visibleList];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setDraft({ ...draft, visibleColumns: newList });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="settings-modal" onSubmit={submit}>
        <header>
          <h2>{t("settings.title")}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t("action.close")}>
            x
          </button>
        </header>
        <label>
          {t("settings.installDir")}
          <input
            value={draft.installDir}
            onChange={(event) => setDraft({ ...draft, installDir: event.target.value })}
            placeholder="Documents\\跑Online\\UMT"
          />
        </label>
        <label>
          {t("settings.sheetUrl")}
          <input
            value={draft.sheetCsvUrl}
            onChange={(event) => setDraft({ ...draft, sheetCsvUrl: event.target.value })}
          />
        </label>
        <label>
          {t("settings.language")}
          <select
            value={draft.language}
            onChange={(event) => setDraft({ ...draft, language: event.target.value as Settings["language"] })}
          >
            <option value="en">English</option>
            <option value="zh_HK">繁體中文（香港）</option>
            <option value="zh_TW">繁體中文（台灣）</option>
            <option value="kr">한국어</option>
          </select>
        </label>
        <fieldset className="column-picker">
          <legend>顯示欄位 (Visible Columns)</legend>
          <div className="column-selected">
            {visibleList.map((col, i) => (
              <div key={col} className="column-ordered">
                <span className="col-name">{col}</span>
                <span className="col-arrows">
                  <button type="button" className="col-btn" disabled={i === 0} onClick={() => moveColumn(i, -1)}>▲</button>
                  <button type="button" className="col-btn" disabled={i === visibleList.length - 1} onClick={() => moveColumn(i, 1)}>▼</button>
                  <button type="button" className="col-btn remove" onClick={() => toggleColumn(col)}>✕</button>
                </span>
              </div>
            ))}
            {visibleList.length === 0 && <span className="column-empty">尚未選取欄位</span>}
          </div>
          {hiddenCols.length > 0 && (
            <>
              <div className="column-divider">可新增欄位</div>
              <div className="column-available">
                {hiddenCols.map((col) => (
                  <button type="button" key={col} className="column-add" onClick={() => toggleColumn(col)}>
                    + {col}
                  </button>
                ))}
              </div>
            </>
          )}
        </fieldset>
        <footer>
          <button type="button" className="button secondary" onClick={onClose}>
            {t("action.close")}
          </button>
          <button className="button primary" disabled={saving}>
            {t("action.save")}
          </button>
        </footer>
      </form>
    </div>
  );
}
