import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, role: "Citizen" | "Reviewer" | "Admin", next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole("button", { name: new RegExp(`Continue as ${role}`) }).click();
}

test("a citizen submits a message and a reviewer publishes the verdict", async ({ page }) => {
  // A unique message, so the duplicate check never sends us to an old result.
  const message = `Test ${Date.now()}: all polling stations will close at noon on election day this year.`;

  // 1. Citizen submits a message
  await signInAs(page, "Citizen", "/submit");
  await expect(page).toHaveURL(/\/submit$/);
  await page.getByRole("tab", { name: "Text" }).click();
  await page.getByLabel("Message or post text").fill(message);
  await page.getByRole("button", { name: "Submit for checking" }).click();

  // 2. The progress page updates by itself until the evidence is ready
  await expect(page).toHaveURL(/\/s\/[\w-]+\?notice=submitted/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  await expect(page.getByText("Evidence collected, waiting for a reviewer")).toBeVisible({ timeout: 30_000 });

  // 3. Citizens can't open the review screen
  await page.goto(`/review/${id}`);
  await expect(page).toHaveURL(/error=forbidden/);

  // 4. Reviewer reads the evidence and publishes a verdict
  await signInAs(page, "Reviewer", `/review/${id}`);
  await expect(page).toHaveURL(new RegExp(`/review/${id}$`));
  await expect(page.getByText("AI suggestion")).toBeVisible();
  await page.getByRole("radio", { name: "False" }).click();
  await page.getByLabel("Public explanation").fill("The official schedule says polls are open until 5 PM. Nothing has changed.");
  await page.getByRole("button", { name: "Publish verdict" }).click();
  await expect(page).toHaveURL(/\/review\?notice=published/);

  // 5. Anyone can now see the published result
  await page.goto(`/s/${id}`);
  await expect(page.getByText("Reviewed by a human on")).toBeVisible();
  await expect(page.getByText("The official schedule says polls are open until 5 PM.")).toBeVisible();
});

test("signed-out visitors are sent to sign in before the review queue", async ({ page }) => {
  await page.goto("/review");
  await expect(page).toHaveURL(/\/login\?next=%2Freview/);
});

test("links to private addresses are refused by the form", async ({ page }) => {
  await signInAs(page, "Citizen", "/submit");
  await page.getByLabel("News article or web page link").fill("http://localhost:5432/secret");
  await page.getByRole("button", { name: "Submit for checking" }).click();
  await expect(page.getByText("Enter a full link that starts with http:// or https://")).toBeVisible();
  await expect(page).toHaveURL(/\/submit$/);
});

test("a link to a website that doesn't exist fails with a clear message", async ({ page }) => {
  await signInAs(page, "Citizen", "/submit");
  // ".example" names are reserved and never exist, so this always fails the same way.
  await page.getByLabel("News article or web page link").fill(`https://no-such-site-${Date.now()}.example/news`);
  await page.getByRole("button", { name: "Submit for checking" }).click();
  await expect(page.getByText(/We couldn.t finish checking this/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("We couldn't find this website. Check that the link is correct.")).toBeVisible();
});
