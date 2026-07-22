import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList } from "@/components/charts/bar-list";

describe("BarList", () => {
  it("renders labeled chart values accessibly", () => {
    render(
      <BarList
        label="Rating distribution"
        items={[
          { label: "8", value: 2 },
          { label: "9", value: 4 },
        ]}
      />,
    );

    expect(screen.getByLabelText("Rating distribution")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
