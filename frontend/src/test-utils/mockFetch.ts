import { type MockInstance, vi } from 'vitest';

/**
 * Type-safe mock response for fetch operations
 *
 * @interface MockFetchResponse
 * @property {boolean} ok - Whether the response was successful (status 200-299)
 * @property {number} [status] - HTTP status code
 * @property {string} [statusText] - HTTP status text
 * @property {() => Promise<unknown>} json - Function to parse JSON response
 * @property {() => Promise<string>} [text] - Function to get text response
 */
export interface MockFetchResponse {
  readonly ok: boolean;
  readonly status?: number;
  readonly statusText?: string;
  readonly json: () => Promise<unknown>;
  readonly text?: () => Promise<string>;
}

/**
 * Type alias for a mocked fetch function
 */
export type MockFetch = MockInstance<
  [input: RequestInfo | URL, init?: RequestInit],
  Promise<MockFetchResponse>
> & ((input: RequestInfo | URL, init?: RequestInit) => Promise<MockFetchResponse>);

/**
 * Creates a mock fetch function that returns the provided response
 *
 * @param {MockFetchResponse} response - The response the mock should return
 * @returns {MockFetch} A mocked fetch function
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetch({ ok: true, json: () => Promise.resolve({ data: 'test' }) });
 * global.fetch = mockFetch;
 * ```
 */
export function createMockFetch(response: MockFetchResponse): MockFetch {
  return vi.fn(
    () => Promise.resolve(response)
  ) as MockFetch;
}

/**
 * Creates a mock fetch that returns JSON data with configurable status
 *
 * @template T - Type of the JSON data
 * @param {T} data - The data to return as JSON
 * @param {boolean} [ok=true] - Whether the response should be successful
 * @param {number} [status=200] - HTTP status code
 * @returns {MockFetch} A mocked fetch function
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetchJson({ users: [] });
 * global.fetch = mockFetch;
 * ```
 */
export function createMockFetchJson<T>(data: T, ok = true, status = 200): MockFetch {
  return createMockFetch({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

/**
 * Creates a mock fetch that rejects with an error
 *
 * @param {Error | string} error - The error or error message to reject with
 * @returns {MockFetch} A mocked fetch function that always rejects
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetchError('Network error');
 * global.fetch = mockFetch;
 * await expect(fetch('/api/data')).rejects.toThrow('Network error');
 * ```
 */
export function createMockFetchError(error: Error | string): MockFetch {
  const err = typeof error === 'string' ? new Error(error) : error;
  return vi.fn(
    () => Promise.reject(err)
  ) as MockFetch;
}

/**
 * Creates a mock fetch that never resolves (for testing loading states)
 *
 * @returns {MockFetch} A mocked fetch function that never resolves
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetchPending();
 * global.fetch = mockFetch;
 * // Component will stay in loading state
 * ```
 */
export function createMockFetchPending(): MockFetch {
  return vi.fn(
    () => new Promise<MockFetchResponse>(() => {})
  ) as MockFetch;
}

/**
 * Creates a mock fetch that returns a non-OK response
 *
 * @param {number} [status=500] - HTTP error status code
 * @param {string} [statusText='Internal Server Error'] - HTTP status text
 * @returns {MockFetch} A mocked fetch function that returns an error response
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetchFailure(404, 'Not Found');
 * global.fetch = mockFetch;
 * ```
 */
export function createMockFetchFailure(
  status = 500,
  statusText = 'Internal Server Error'
): MockFetch {
  return createMockFetch({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: statusText }),
  });
}

/**
 * Retrieves all call arguments from a MockFetch
 *
 * @param {MockFetch} mockFetch - The mock fetch function
 * @returns {Array<[RequestInfo | URL, RequestInit | undefined]>} Array of call arguments
 */
export function getMockFetchCalls(
  mockFetch: MockFetch
): Array<[RequestInfo | URL, RequestInit | undefined]> {
  return mockFetch.mock.calls as Array<[RequestInfo | URL, RequestInit | undefined]>;
}

/**
 * Retrieves headers from a specific mock fetch call
 *
 * @param {MockFetch} mockFetch - The mock fetch function
 * @param {number} [callIndex=0] - Index of the call to get headers from
 * @returns {Record<string, string>} Headers object from the call
 * @throws {Error} If the call index doesn't exist
 */
export function getMockFetchHeaders(
  mockFetch: MockFetch,
  callIndex = 0
): Record<string, string> {
  const calls = getMockFetchCalls(mockFetch);
  if (callIndex >= calls.length) {
    throw new Error(`No call at index ${callIndex}. Total calls: ${calls.length}`);
  }
  const headers = calls[callIndex][1]?.headers;
  return (headers as Record<string, string> | undefined) ?? {};
}

/**
 * Sets up a mock fetch on the global object
 *
 * @param {MockFetch} mockFetch - The mock fetch function to install
 */
export function setupMockFetch(mockFetch: MockFetch): void {
  global.fetch = mockFetch as unknown as typeof fetch;
}

/**
 * Stores the original fetch function for later restoration
 */
let originalFetch: typeof fetch | undefined;

/**
 * Saves the current global.fetch for later restoration
 * Call this in beforeEach to preserve the original fetch
 */
export function saveFetch(): void {
  originalFetch = global.fetch;
}

/**
 * Restores the original fetch function
 * Call this in afterEach to clean up mock fetch
 */
export function restoreFetch(): void {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}
