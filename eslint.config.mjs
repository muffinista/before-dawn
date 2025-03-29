import mocha from "eslint-plugin-mocha";
import globals from "globals";
import js from "@eslint/js";
import svelte from 'eslint-plugin-svelte';


/** @type {import('eslint').Linter.Config[]} */
export default [
  mocha.configs.flat.recommended,
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Add this if you are using SvelteKit in non-SPA mode
      },
      ecmaVersion: "latest",
      sourceType: "module",
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        // We recommend importing and specifying svelte.config.js.
        // By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
        // While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
        // explicitly specifying it ensures better compatibility and functionality.
        //          svelteConfig
      }
    },
    plugins: {
      "plugin:svelte/recommended": svelte
    }
  },
  {
    files: ['test/**/*.js'],
    plugins: {
      "plugin:mocha/recommended": mocha
    },
    languageOptions: {
      globals: {
        ...globals.mocha
      },
    },
  },
  {
    ignores: [
      "output/*",
      "data/*"
    ],
    
    rules: {
      // Override or add rule settings here, such as:
      // 'svelte/rule-name': 'error'
    }
  }
];
