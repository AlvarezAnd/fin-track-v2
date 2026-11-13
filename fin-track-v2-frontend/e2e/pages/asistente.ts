import { expect, type Page } from "@playwright/test";

export class Asistente {
  constructor(private readonly page: Page) {}

  async consultarBalance() {
    await this.page.getByRole("button", { name: "Abrir asistente" }).click();
    const dialog = this.page.getByRole("dialog", { name: "Asistente" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Balance del mes" }).click();
    await expect(dialog.getByText(/El balance de .+ es /)).toBeVisible();
  }
}
