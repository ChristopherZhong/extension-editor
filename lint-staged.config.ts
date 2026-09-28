import type { Configuration } from 'lint-staged';

const config: Configuration = {
  '*.{ts,tsx}': () => 'tsc --noEmit',
  '*.{js,ts,tsx}': 'vitest related --run',
};

export default config;
