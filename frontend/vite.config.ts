import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser DOM environment for React component tests
    environment: 'jsdom',
    // Register @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
    // before each test file runs
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
})
