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
