import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusButtons } from "@/components/games/status-buttons";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function mockFetchResponse(payload: unknown) {
  const fetchMock = vi.fn(async () => {
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("StatusButtons", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("clears active played status without opening the rating flow", async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      gameSlug: "the-witcher-3-wild-hunt",
    });
    const onPlayed = vi.fn();
    const onRemoved = vi.fn();

    render(
      <StatusButtons
        gameSlug="the-witcher-3-wild-hunt"
        currentStatus="played"
        onPlayed={onPlayed}
        onRemoved={onRemoved}
        compact
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Remove played status" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user-games",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    expect(onPlayed).not.toHaveBeenCalled();
    expect(onRemoved).toHaveBeenCalledWith("the-witcher-3-wild-hunt");
  });

  it("keeps inactive status buttons neutral until a status is selected", () => {
    render(<StatusButtons gameSlug="hades" />);

    const playedButton = screen.getByRole("button", {
      name: "Yes, I played it",
    });
    const playingButton = screen.getByRole("button", {
      name: "I am currently playing it",
    });
    const hiddenButton = screen.getByRole("button", {
      name: "I am not interested",
    });

    expect(playedButton).toHaveAttribute("aria-pressed", "false");
    expect(playingButton).toHaveAttribute("aria-pressed", "false");
    expect(hiddenButton).toHaveAttribute("aria-pressed", "false");
    expect(playedButton.className).not.toContain("bg-[#35d07f]");
    expect(playingButton.className).not.toContain("bg-[#2b3742]");
    expect(hiddenButton.className).not.toContain("bg-[#ef6461]");
  });

  it("uses the active hidden status button as an unhide action", async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      gameSlug: "hidden-game",
      entry: null,
    });
    const onRemoved = vi.fn();

    render(
      <StatusButtons
        gameSlug="hidden-game"
        currentStatus="not_interested"
        onRemoved={onRemoved}
        compact
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Unhide from library" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user-games",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(onRemoved).toHaveBeenCalledWith("hidden-game");
  });
});
