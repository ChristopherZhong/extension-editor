import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  '*.{ts,tsx}': () => 'tsc --noEmit',
  '*.{js,ts,tsx}': 'vitest related --run',
});
