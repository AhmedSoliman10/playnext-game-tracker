import { describe, expect, it } from "vitest";
import { buildPasswordResetEmail } from "@/lib/server/password-reset-service";

describe("password reset email", () => {
  it("builds a branded reset email with the secure action link", () => {
    const message = buildPasswordResetEmail({
      email: "player@example.com",
      actionLink: "https://example.supabase.co/auth/v1/verify?token=abc",
    });

    expect(message.subject).toBe("Reset your Playnira password");
    expect(message.text).toContain("player@example.com");
    expect(message.text).toContain(
      "https://example.supabase.co/auth/v1/verify?token=abc",
    );
    expect(message.text).toContain("junk or spam folder");
    expect(message.html).toContain("Reset password");
    expect(message.html).toContain("Playnira");
  });
});
