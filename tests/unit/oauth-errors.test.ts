import { describe, expect, it } from "vitest";
import { getDiscordAuthErrorReason } from "@/lib/auth/oauth-errors";

describe("Discord OAuth error mapping", () => {
  it("detects duplicate identities", () => {
    expect(
      getDiscordAuthErrorReason("identity_already_exists for this provider"),
    ).toBe("already-linked");
  });

  it("detects disabled manual linking", () => {
    expect(
      getDiscordAuthErrorReason(
        "Enable manual linking before calling linkIdentity",
      ),
    ).toBe("manual-linking-disabled");
  });

  it("detects redirect URL configuration problems", () => {
    expect(getDiscordAuthErrorReason("redirect_uri is not allowed")).toBe(
      "redirect-url",
    );
  });

  it("falls back to a generic Discord error", () => {
    expect(getDiscordAuthErrorReason("unexpected oauth failure")).toBe(
      "discord",
    );
  });
});
