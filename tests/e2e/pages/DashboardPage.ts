import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Finance Dashboard
 */
export class DashboardPage extends BasePage {
  readonly dashboardTitle: Locator;
  readonly statusCards: Locator;
  readonly categoryTable: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.locator('h1:has-text("Dashboard"), h1:has-text("Finance")');
    this.statusCards = page.locator('[data-testid="status-card"], .status-card, .card');
    this.categoryTable = page.locator('table');
  }

  /**
   * Navigate to dashboard
   */
  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Get status card by status name
   */
  getStatusCard(status: string): Locator {
    return this.page.locator(`text=/.*${status}.*/i`).locator('..');
  }

  /**
   * Get count from status card
   */
  async getStatusCount(status: string): Promise<number> {
    const card = this.getStatusCard(status);
    const countText = await card.locator('text=/\\d+/').first().textContent();
    return countText ? parseInt(countText, 10) : 0;
  }

  /**
   * Get total from status card
   */
  async getStatusTotal(status: string): Promise<number> {
    const card = this.getStatusCard(status);
    const totalText = await card.locator('text=/\\$[\\d,.]+/').first().textContent();
    if (!totalText) return 0;

    const cleanedTotal = totalText.replace(/[$,]/g, '');
    return parseFloat(cleanedTotal);
  }

  /**
   * Verify dashboard loads correctly
   */
  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.dashboardTitle).toBeVisible();
  }

  /**
   * Verify status cards are visible
   */
  async verifyStatusCardsVisible(): Promise<void> {
    const cards = await this.statusCards.all();
    expect(cards.length).toBeGreaterThan(0);
  }

  /**
   * Verify category totals table is visible
   */
  async verifyCategoryTableVisible(): Promise<void> {
    await expect(this.categoryTable).toBeVisible();
  }

  /**
   * Get category row
   */
  getCategoryRow(category: string): Locator {
    return this.page.locator(`tr:has-text("${category}")`);
  }

  /**
   * Get category count
   */
  async getCategoryCount(category: string): Promise<number> {
    const row = this.getCategoryRow(category);
    const countText = await row.locator('td').nth(1).textContent();
    return countText ? parseInt(countText, 10) : 0;
  }

  /**
   * Get category total
   */
  async getCategoryTotal(category: string): Promise<number> {
    const row = this.getCategoryRow(category);
    const totalText = await row.locator('td').last().textContent();
    if (!totalText) return 0;

    const cleanedTotal = totalText.replace(/[$,]/g, '');
    return parseFloat(cleanedTotal);
  }

  /**
   * Verify category exists in table
   */
  async verifyCategoryExists(category: string): Promise<void> {
    const row = this.getCategoryRow(category);
    await expect(row).toBeVisible();
  }

  /**
   * Get all status metrics
   */
  async getAllStatusMetrics(): Promise<{
    [status: string]: { count: number; total: number };
  }> {
    const statuses = ['draft', 'submitted', 'approved', 'rejected', 'paid'];
    const metrics: { [status: string]: { count: number; total: number } } = {};

    for (const status of statuses) {
      try {
        const count = await this.getStatusCount(status);
        const total = await this.getStatusTotal(status);
        metrics[status] = { count, total };
      } catch (error) {
        // Status card might not exist if count is 0
        metrics[status] = { count: 0, total: 0 };
      }
    }

    return metrics;
  }

  /**
   * Verify dashboard updates after action
   */
  async verifyDashboardUpdated(
    previousMetrics: { [status: string]: { count: number; total: number } },
    expectedChanges: { status: string; countChange: number; totalChange?: number }
  ): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();

    const newCount = await this.getStatusCount(expectedChanges.status);
    const expectedCount = previousMetrics[expectedChanges.status].count + expectedChanges.countChange;

    expect(newCount).toBe(expectedCount);

    if (expectedChanges.totalChange !== undefined) {
      const newTotal = await this.getStatusTotal(expectedChanges.status);
      const expectedTotal = previousMetrics[expectedChanges.status].total + expectedChanges.totalChange;

      expect(Math.abs(newTotal - expectedTotal)).toBeLessThan(0.01); // Allow for floating point errors
    }
  }
}
