import { defineConfig } from 'vitest/config';

// unit tests only: nothing here touches the real database
export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
	},
});
