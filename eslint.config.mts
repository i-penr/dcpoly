import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: {
			globals: globals.browser,
			parser: '@typescript-eslint/parser',
			parserOptions: { project: './tsconfig.json', tsconfigRootDir: __dirname },
		},
	},
	tseslint.configs.recommended,
	tseslint.configs.stylistic,
]);
