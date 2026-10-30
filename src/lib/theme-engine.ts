/**
 * Scoped theme engine for public Profile Hubs (pure, browser-safe).
 *
 * Global glass tokens live on the design prefs (`glass*` fields = theme.global);
 * a component scope may override them in `themeOverrides[scope]`. Rendering
 * merges global + override and turns the result into inline CSS.
 */

export const THEME_SCOPES = ["all", "links", "booking", "board", "presence", "socials"] as const;
export type ThemeScope = (typeof THEME_SCOPES)[number];
export type ComponentScope = Exclude<ThemeScope, "all">;
export const COMPONENT_SCOPES: ComponentScope[] = ["links", "booking", "board", "presence", "socials"];

export const GLASS_STYLES = ["solid", "frosted-light", "frosted-dark", "obsidian", "prism"] as const;
export type GlassStyle = (typeof GLASS_STYLES)[number];
export const GLASS_BORDERS = ["subtle", "bright", "off"] as const;
export type GlassBorder = (typeof GLASS_BORDERS)[number];

export type GlassTokens = {
  glassStyle: GlassStyle;
  /** Glass opacity in percent, 5–50. */
  glassOpacity: number;
  /** Blur radius in px, 4–32. */
  glassBlur: number;
  glassBorder: GlassBorder;
};

export type GlassTargets = Record<"links" | "presence" | "board" | "booking", boolean>;

export type ThemeOverrides = Partial<Record<ComponentScope, Partial<GlassTokens>>>;

export const DEFAULT_GLASS: GlassTokens = {
  glassStyle: "solid",
  glassOpacity: 12,
  glassBlur: 16,
  glassBorder: "subtle",
};
export const DEFAULT_GLASS_TARGETS: GlassTargets = { links: true, presence: true, board: true, booking: true };

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

export function normalizeGlassTokens(r: Record<string, unknown>): GlassTokens {
  return {
    glassStyle: pick(r["glassStyle"], GLASS_STYLES, DEFAULT_GLASS.glassStyle),
    glassOpacity: clamp(r["glassOpacity"], 5, 50, DEFAULT_GLASS.glassOpacity),
    glassBlur: clamp(r["glassBlur"], 4, 32, DEFAULT_GLASS.glassBlur),
    glassBorder: pick(r["glassBorder"], GLASS_BORDERS, DEFAULT_GLASS.glassBorder),
  };
}

/** Keeps only valid keys; an override never stores a key equal to nothing. */
function normalizePartial(raw: unknown): Partial<GlassTokens> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<GlassTokens> = {};
  if (GLASS_STYLES.includes(r["glassStyle"] as GlassStyle)) out.glassStyle = r["glassStyle"] as GlassStyle;
  if (r["glassOpacity"] !== undefined) out.glassOpacity = clamp(r["glassOpacity"], 5, 50, DEFAULT_GLASS.glassOpacity);
  if (r["glassBlur"] !== undefined) out.glassBlur = clamp(r["glassBlur"], 4, 32, DEFAULT_GLASS.glassBlur);
  if (GLASS_BORDERS.includes(r["glassBorder"] as GlassBorder)) out.glassBorder = r["glassBorder"] as GlassBorder;
  return out;
}

export function normalizeThemeOverrides(raw: unknown): ThemeOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: ThemeOverrides = {};
  for (const scope of COMPONENT_SCOPES) {
    const o = normalizePartial((raw as Record<string, unknown>)[scope]);
    if (Object.keys(o).length) out[scope] = o;
  }
  return out;
}

export function normalizeGlassTargets(raw: unknown): GlassTargets {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    links: r["links"] === undefined ? true : Boolean(r["links"]),
    presence: r["presence"] === undefined ? true : Boolean(r["presence"]),
    board: r["board"] === undefined ? true : Boolean(r["board"]),
    booking: r["booking"] === undefined ? true : Boolean(r["booking"]),
  };
}

/** Global tokens merged with the scope's override ("all" = global only). */
export function resolveScopedTokens(global: GlassTokens, overrides: ThemeOverrides, scope: ThemeScope): GlassTokens {
  return scope === "all" ? global : { ...global, ...(overrides[scope] ?? {}) };
}

/** Effective style for one component type: its override merged over the global defaults. */
export function getEffectiveComponentStyle(
  theme: { global: GlassTokens; overrides: ThemeOverrides },
  componentType: ThemeScope,
): GlassTokens {
  return resolveScopedTokens(theme.global, theme.overrides, componentType);
}

/** True when a component scope deviates from the global style. */
export function hasUniqueStyle(global: GlassTokens, overrides: ThemeOverrides, scope: ThemeScope): boolean {
  if (scope === "all") return false;
  const o = overrides[scope];
  if (!o) return false;
  return (Object.keys(o) as (keyof GlassTokens)[]).some((k) => o[k] !== global[k]);
}

/** Writes a patch to the global tokens or to one scope's override. */
export function applyScopedPatch(
  global: GlassTokens,
  overrides: ThemeOverrides,
  scope: ThemeScope,
  patch: Partial<GlassTokens>,
): { global: GlassTokens; overrides: ThemeOverrides } {
  if (scope === "all") return { global: { ...global, ...patch }, overrides };
  return { global, overrides: { ...overrides, [scope]: { ...(overrides[scope] ?? {}), ...patch } } };
}

export function resetScope(overrides: ThemeOverrides, scope: ComponentScope): ThemeOverrides {
  const next = { ...overrides };
  delete next[scope];
  return next;
}

/** Which glass target checkbox governs a scope (socials follow links). */
function targetOf(scope: ComponentScope): keyof GlassTargets {
  return scope === "socials" ? "links" : scope;
}

/**
 * Inline CSS for a glass surface, or null for solid / disabled targets.
 * The background alone stays readable when backdrop-filter is unsupported;
 * the `.rout-glass` class adds an opaque fallback via @supports in styles.css.
 */
export function glassSurfaceStyle(
  tokens: GlassTokens,
  scope: ComponentScope,
  targets: GlassTargets,
): Record<string, string> | null {
  if (tokens.glassStyle === "solid" || !targets[targetOf(scope)]) return null;
  const a = tokens.glassOpacity / 100;
  const dark = tokens.glassStyle === "frosted-dark" || tokens.glassStyle === "obsidian";
  const bg = tokens.glassStyle === "obsidian"
    ? `rgba(8, 8, 12, ${Math.min(0.85, a + 0.35).toFixed(2)})`
    : dark
      ? `rgba(0, 0, 0, ${Math.min(0.85, a + 0.2).toFixed(2)})`
      : `rgba(255, 255, 255, ${a.toFixed(2)})`;
  const edge = tokens.glassBorder === "off" ? 0 : tokens.glassBorder === "bright" ? 0.32 : 0.18;
  const top = tokens.glassBorder === "off" ? 0 : tokens.glassBorder === "bright" ? 0.55 : 0.35;
  const filter = `blur(${tokens.glassBlur}px) saturate(180%)`;
  const style: Record<string, string> = {
    background: bg,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: edge ? `1px solid rgba(255, 255, 255, ${edge})` : "1px solid transparent",
    borderTop: top ? `1px solid rgba(255, 255, 255, ${top})` : "1px solid transparent",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
    willChange: "transform",
  };
  if (tokens.glassStyle === "obsidian") {
    style["boxShadow"] = "0 10px 40px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.06)";
  }
  if (tokens.glassStyle === "prism") {
    style["border"] = "1px solid transparent";
    style["borderTop"] = "1px solid transparent";
    style["background"] =
      `linear-gradient(${bg}, ${bg}) padding-box, linear-gradient(135deg, rgba(255,120,200,.7), rgba(120,200,255,.7), rgba(180,255,160,.7)) border-box`;
  }
  return style;
}

/** Maps a profile block kind to the theme scope that styles it. */
export function scopeOfBlockKind(kind: string): ComponentScope {
  if (kind === "booking_request" || kind === "booking") return "booking";
  if (kind === "live") return "presence";
  if (kind === "widget:guestbook" || kind === "live_poll" || kind === "contact_form" || kind === "faq_accordion") return "board";
  if (kind === "social_feed" || kind === "social") return "socials";
  return "links";
}
