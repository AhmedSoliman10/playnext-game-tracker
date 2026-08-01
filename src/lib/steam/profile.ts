export type SteamProfileInput =
  { kind: "profiles"; value: string } | { kind: "id"; value: string };

export function parseSteamProfileInput(input: string): SteamProfileInput {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i,
  );
  if (urlMatch) {
    return {
      kind: urlMatch[1]?.toLowerCase() === "profiles" ? "profiles" : "id",
      value: decodeURIComponent(urlMatch[2] ?? "").replace(/\/+$/, ""),
    };
  }

  if (/^\d{15,20}$/.test(trimmed)) {
    return { kind: "profiles", value: trimmed };
  }

  return {
    kind: "id",
    value: trimmed
      .replace(/^@/, "")
      .replace(/^https?:\/\//i, "")
      .replace(/^steamcommunity\.com\/id\//i, "")
      .replace(/\/+$/, ""),
  };
}
