import { describe, expect, it } from "vitest";
import { parseSteamProfileInput } from "@/lib/steam/profile";

describe("Steam library import profile parsing", () => {
  it("parses custom Steam profile URLs", () => {
    expect(
      parseSteamProfileInput("https://steamcommunity.com/id/KiloPower/"),
    ).toEqual({ kind: "id", value: "KiloPower" });
  });

  it("parses SteamID64 profile URLs", () => {
    expect(
      parseSteamProfileInput(
        "https://steamcommunity.com/profiles/76561198000000000/games/",
      ),
    ).toEqual({ kind: "profiles", value: "76561198000000000" });
  });

  it("accepts shorthand custom IDs and raw SteamID64 values", () => {
    expect(parseSteamProfileInput("@KiloPower")).toEqual({
      kind: "id",
      value: "KiloPower",
    });
    expect(parseSteamProfileInput("76561198000000000")).toEqual({
      kind: "profiles",
      value: "76561198000000000",
    });
  });
});
