/**
 * Test setup file for vitest
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { webcrypto } from 'node:crypto';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Setup crypto polyfill for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

// Cleanup after each test case
afterEach(() => {
  cleanup();
});