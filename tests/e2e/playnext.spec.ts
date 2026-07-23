import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("critical game tracking journey works with keyboard-accessible discovery", async ({
  page,
}) => {
  const email = `demo-${Date.now()}@playnext.local`;

  await page.goto("/login");
  const emailInput = page.getByLabel("Email");
  await expect(emailInput).toHaveValue("demo@playnext.local");
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);
  await page.getByLabel("Password").fill("playnext-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "Discover", exact: true }).click();
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
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "8.5" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  for (let step = 0; step < 5; step += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }

  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
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
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
