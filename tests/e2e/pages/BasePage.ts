import { Page, Locator, ElementHandle } from '@playwright/test';

/**
 * Base Page Object class with common functionality
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch user by setting X-User-Id header
   * Note: This requires page context to be recreated or API calls to include the header
   */
  async switchUser(userId: number): Promise<void> {
    await this.page.route('**/*', async (route) => {
      const headers = await route.request().headers();
      headers['X-User-Id'] = userId.toString();
      await route.continue({ headers });
    });
  }

  /**
   * Get text content from an element
   */
  async getTextContent(selector: string): Promise<string | null> {
    return await this.page.textContent(selector);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * Wait for element to be visible
   */
  async waitForSelector(selector: string, timeout: number = 5000): Promise<ElementHandle | null> {
    return await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
