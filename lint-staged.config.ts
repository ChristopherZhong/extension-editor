export default {
  '*.{js,ts,tsx}': [
    () => 'tsc --noEmit',
    'vitest related --run'
  ]
};
