import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("popular carousel moves automatically on the landing page", async ({
  page,
}) => {
  await page.goto("/");
  const rail = page.getByTestId("popular-carousel-rail").first();
  const firstCard = page.locator("[data-carousel-card]").first();
  await expect(rail).toBeVisible();
  await expect(firstCard).toBeVisible();

  const track = page.getByTestId("popular-carousel-track").first();
  const initialBox = await firstCard.boundingBox();
  expect(initialBox).not.toBeNull();
  await expect
    .poll(
      async () => {
        const box = await firstCard.boundingBox();
        return box?.x ?? initialBox!.x;
      },
      {
        message: "popular carousel card should visibly move without a click",
        timeout: 5_000,
      },
    )
    .toBeLessThan(initialBox!.x - 20);

  await expect
    .poll(
      () =>
        track.evaluate((element) => getComputedStyle(element).animationName),
      {
        message: "popular carousel track should keep auto-scrolling",
        timeout: 5_000,
      },
    )
    .toContain("popular-carousel-scroll");

  await expect(
    page.getByRole("heading", {
      name: /See what players are saying before you choose tonight's game/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("Community pulse")).toBeVisible();
});

test("landing page stays within basic performance budgets", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const lcpEntry = performance
      .getEntriesByType("largest-contentful-paint")
      .at(-1);

    return {
      domContentLoaded: navigation
        ? navigation.domContentLoadedEventEnd - navigation.startTime
        : 0,
      load: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
      lcp: lcpEntry ? lcpEntry.startTime : 0,
    };
  });

  expect(metrics.domContentLoaded).toBeLessThan(4_000);
  expect(metrics.load).toBeLessThan(7_000);
  if (metrics.lcp > 0) {
    expect(metrics.lcp).toBeLessThan(4_000);
  }
});

test("critical game tracking journey works with keyboard-accessible discovery", async ({
  page,
}) => {
  const email = `demo-${Date.now()}@playnira.local`;

  await page.goto("/login");
  const emailInput = page.getByLabel("Email");
  await expect(emailInput).toHaveValue("demo@playnira.local");
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);
  await page.getByLabel("Password").fill("playnira-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await Promise.all([
    page.waitForURL(/\/discover/),
    page.getByRole("link", { name: "Discover", exact: true }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Have you played this game?" }),
  ).toBeVisible();
  const firstGameTitle = await page
    .locator("[data-testid='discovery-card'] h2")
    .first()
    .innerText();

  const playedResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/user-games") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Yes, I played it" }).click();
  expect((await playedResponse).ok()).toBe(true);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.locator("[data-testid='discovery-card'] h2").first(),
  ).toHaveText(firstGameTitle);
  await expect(
    page.getByRole("heading", { name: `Rate ${firstGameTitle}` }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByRole("radio", { name: "8.5" }).click();

  for (let step = 0; step < 5; step += 1) {
    await page.getByRole("button", { name: "Skip question" }).click();
  }

  await page.getByRole("button", { name: "Yes" }).click();
  await expect(page.getByLabel("Short review")).toBeVisible();
  const saveRatingButton = page.getByRole("button", { name: "Save rating" });
  await expect(saveRatingButton).toBeEnabled();
  await saveRatingButton.click();

  await expect(
    page.getByText(
      new RegExp(`You rated ${escapeRegExp(firstGameTitle)} an 8.5/10`),
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Show (next game|recommendation)/ })
    .click();

  await page.goto("/library/played");
  await expect(page.getByText(firstGameTitle)).toBeVisible();
  await page.getByRole("link", { name: "View details" }).first().click();
  await expect(page.getByText("8.5/10")).toBeVisible();

  await page.goto("/discover");
  const backlogTitle = await page
    .locator("[data-testid='discovery-card'] h2")
    .first()
    .innerText();
  const backlogResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/user-games") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "I want to play it" }).click();
  expect((await backlogResponse).ok()).toBe(true);
  await page.goto("/library/want-to-play");
  await expect(page.getByText(backlogTitle)).toBeVisible();

  await page.goto("/discover");
  const skippedTitle = await page
    .locator("[data-testid='discovery-card'] h2")
    .first()
    .innerText();
  const skipButton = page.getByRole("button", { name: "Skip for now" });
  await skipButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/moved to skip for now/i)).toBeVisible();
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: skippedTitle, exact: true }),
  ).toHaveCount(0);
  await page.goto("/discover");
  await expect(
    page.locator("[data-testid='discovery-card'] h2").first(),
  ).not.toHaveText(skippedTitle);

  const hiddenTitle = await page
    .locator("[data-testid='discovery-card'] h2")
    .first()
    .innerText();
  await page.getByRole("button", { name: "I am not interested" }).click();
  await expect(page.getByText(/moved to i am not interested/i)).toBeVisible();
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: hiddenTitle, exact: true }),
  ).toHaveCount(0);
  await page.goto("/library/hidden");
  await expect(page.getByText(hiddenTitle)).toBeVisible();
  await page
    .getByRole("button", {
      name: "Hidden. Press again to unhide this game.",
    })
    .click();
  await expect(page.getByText(hiddenTitle)).toHaveCount(0);
});

test("rating dialog opens inside a mobile viewport after marking played", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `mobile-${Date.now()}@playnira.local`;

  await page.goto("/login");
  const emailInput = page.getByLabel("Email");
  await emailInput.clear();
  await emailInput.fill(email);
  await page.getByLabel("Password").fill("playnira-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/discover");
  const firstGameTitle = await page
    .locator("[data-testid='discovery-card'] h2")
    .first()
    .innerText();
  await page.getByRole("button", { name: "Yes, I played it" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("heading", { name: `Rate ${firstGameTitle}` }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Yes" })).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.height).toBeLessThanOrEqual(844);
});

test("community hub renders the social feed after sign-in", async ({
  page,
}) => {
  const email = `community-${Date.now()}@playnira.local`;

  await page.goto("/login");
  const emailInput = page.getByLabel("Email");
  await emailInput.clear();
  await emailInput.fill(email);
  await page.getByLabel("Password").fill("playnira-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/community");
  await expect(
    page.getByRole("heading", {
      name: "Talk games with people who actually play them",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Create a post")).toBeVisible();
  await expect(page.getByRole("button", { name: "For you" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Game talk" })).toBeVisible();
  await expect(page.getByText(/weekend list/i)).toBeVisible();
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
