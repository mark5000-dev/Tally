// The browser origins this API answers to. `WEB_ORIGIN` is a comma-separated
// allowlist; an entry may contain a "*" standing for exactly one hostname
// label, which is what makes a per-branch preview deployment usable:
// "https://tally-web-git-feature-mark.vercel.app" cannot be listed ahead of
// time, but "https://*.vercel.app" covers it.
//
// "*" deliberately stops at a dot, so a pattern can never reach past the domain
// it names and match a hostname somebody else controls.
const PATTERN_ESCAPE = /[.+?^${}()|[\]\\]/g;

const LOCAL_WEB_ORIGIN = "http://localhost:3000";

export interface OriginAllowlist {
  /** Every configured entry, wildcards included. */
  entries: string[];
  /** Whether a browser-supplied Origin header may call the API. */
  allows: (origin: string) => boolean;
  /**
   * The origin account emails should link back to. A wildcard is not a usable
   * link target, so the first literal entry is used instead.
   */
  linkOrigin: string;
}

function toPattern(entry: string) {
  const escaped = entry
    .replace(PATTERN_ESCAPE, "\\$&")
    .replaceAll("*", "[^.]*");
  return new RegExp(`^${escaped}$`, "i");
}

export function createOriginAllowlist(
  value = process.env.WEB_ORIGIN,
): OriginAllowlist {
  const entries = (value ?? LOCAL_WEB_ORIGIN)
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const literal = new Set(entries.filter((entry) => !entry.includes("*")));
  const patterns = entries
    .filter((entry) => entry.includes("*"))
    .map(toPattern);
  const linkOrigin =
    entries.find((entry) => !entry.includes("*")) ?? LOCAL_WEB_ORIGIN;
  return {
    entries,
    allows: (origin) =>
      literal.has(origin.replace(/\/+$/, "")) ||
      patterns.some((pattern) => pattern.test(origin)),
    linkOrigin,
  };
}
