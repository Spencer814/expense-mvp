import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Role Switcher component
 * Handles switching between different user roles (Employee, Manager, Finance)
 */
export class RoleSwitcherPage extends BasePage {
  readonly roleDropdown: Locator;
  readonly currentRoleDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.roleDropdown = page.locator('select[name="user"], select:has-text("Employee"), select:has-text("Manager")');
    this.currentRoleDisplay = page.locator('.current-role, [data-testid="current-role"]');
  }

  /**
   * Switch to a specific user role
   * User IDs: 1=Employee, 2=Manager, 3=Finance
   */
  async switchToRole(role: 'Employee' | 'Manager' | 'Finance'): Promise<void> {
    const userId = this.getRoleUserId(role);

    // Try switching via dropdown if available
    try {
      await this.roleDropdown.waitFor({ timeout: 2000 });
      await this.roleDropdown.selectOption({ value: userId.toString() });
      await this.page.waitForTimeout(500); // Wait for role switch
    } catch (error) {
      // If dropdown not available, use API route interception
      await this.page.route('**/api/**', async (route) => {
        const headers = route.request().headers();
        headers['X-User-Id'] = userId.toString();
        await route.continue({ headers });
      });

      // Reload page to apply new role
      await this.page.reload();
      await this.waitForPageLoad();
    }
  }

  /**
   * Switch to Employee role (User ID: 1)
   */
  async switchToEmployee(): Promise<void> {
    await this.switchToRole('Employee');
  }

  /**
   * Switch to Manager role (User ID: 2)
   */
  async switchToManager(): Promise<void> {
    await this.switchToRole('Manager');
  }

  /**
   * Switch to Finance role (User ID: 3)
   */
  async switchToFinance(): Promise<void> {
    await this.switchToRole('Finance');
  }

  /**
   * Get user ID for a role
   */
  private getRoleUserId(role: 'Employee' | 'Manager' | 'Finance'): number {
    switch (role) {
      case 'Employee':
        return 1;
      case 'Manager':
        return 2;
      case 'Finance':
        return 3;
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  /**
   * Setup API interception for a specific user
   * This ensures all API calls use the correct X-User-Id header
   */
  async setupAPIInterception(userId: number): Promise<void> {
    await this.page.route('**/api/**', async (route) => {
      const headers = route.request().headers();
      headers['X-User-Id'] = userId.toString();
      await route.continue({ headers });
    });
  }

  /**
   * Create a new page context with specific user ID
   * More reliable than route interception for role switching
   */
  static async createContextWithRole(
    page: Page,
    role: 'Employee' | 'Manager' | 'Finance'
  ): Promise<void> {
    const userId = new RoleSwitcherPage(page)['getRoleUserId'](role);

    await page.route('**/api/**', async (route) => {
      const headers = route.request().headers();
      headers['X-User-Id'] = userId.toString();
      await route.continue({ headers });
    });
  }
}
