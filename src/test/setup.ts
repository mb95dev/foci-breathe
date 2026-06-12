import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-cleanup only registers itself when Vitest globals are enabled;
// we run without globals, so register it explicitly.
afterEach(cleanup);
