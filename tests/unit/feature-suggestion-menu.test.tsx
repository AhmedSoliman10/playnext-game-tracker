import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FeatureSuggestionMenu } from "@/components/layout/feature-suggestion-menu";

describe("FeatureSuggestionMenu", () => {
  it("opens a feature suggestion pane with the support email", async () => {
    render(<FeatureSuggestionMenu />);

    await userEvent.click(
      screen.getByRole("button", { name: "Suggest a Playnira feature" }),
    );

    expect(screen.getByText("Suggest a feature")).toBeInTheDocument();
    expect(screen.getByText("playnira.app.mail@gmail.com")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Email suggestion" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:playnira.app.mail@gmail.com"),
    );
  });
});
