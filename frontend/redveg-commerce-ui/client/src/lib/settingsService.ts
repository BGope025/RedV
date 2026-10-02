// ──────────────────────────────────────────────────────────────────────────────
// Settings Service — Abstraction over backend settings persistence.
//
// ⚠️  DEVELOPMENT FALLBACK: This implementation uses localStorage, which only
// affects the current browser. For production, replace the body of each
// function with calls to:
//   GET  /api/v1/settings/header-theme   → { themeId: string }
//   PUT  /api/v1/settings/header-theme   → body { themeId: string }  (admin only)
//   DELETE /api/v1/settings/header-theme → resets to "default"       (admin only)
//
// The backend should enforce admin-role authorization on PUT and DELETE.
// ──────────────────────────────────────────────────────────────────────────────

import type { HeaderThemeId } from "@/themes/headerThemes";

const STORAGE_KEY = "redveg_header_theme";

/**
 * Fetch the currently active header-theme ID.
 * Returns "default" when no theme has been saved.
 */
export async function getActiveHeaderThemeId(): Promise<HeaderThemeId> {
  try {
    // TODO (production): Replace with authenticated GET request
    // const res = await fetch(`${import.meta.env.VITE_API_URL}/settings/header-theme`);
    // const data = await res.json();
    // return data.themeId ?? "default";

    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as HeaderThemeId) ?? "default";
  } catch {
    console.warn("[settingsService] Failed to load header theme, using default.");
    return "default";
  }
}

/**
 * Persist the active header-theme ID.
 * In production this must require admin authorization.
 */
export async function saveActiveHeaderThemeId(themeId: HeaderThemeId): Promise<void> {
  try {
    // TODO (production): Replace with authenticated PUT request
    // await fetch(`${import.meta.env.VITE_API_URL}/settings/header-theme`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    //   body: JSON.stringify({ themeId }),
    // });

    localStorage.setItem(STORAGE_KEY, themeId);
  } catch (err) {
    console.error("[settingsService] Failed to save header theme:", err);
    throw err;
  }
}

/**
 * Reset to default by removing the stored theme.
 * In production this must require admin authorization.
 */
export async function resetActiveHeaderThemeId(): Promise<void> {
  try {
    // TODO (production): Replace with authenticated DELETE request
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("[settingsService] Failed to reset header theme:", err);
    throw err;
  }
}