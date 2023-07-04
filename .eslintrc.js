module.exports = {
  root: true,
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2022,
    ecmaFeatures: {
      "spread": true
    },
    sourceType: "module"
  },
  env: {
    browser: true,
    node: true,
    mocha: true,
    es6: true
  },
  extends: [
    "eslint:recommended",
    "plugin:svelte/recommended"
  ],
  globals: {
  },
  plugins: [
  ],
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser"
    }
  ],
  "rules": {
    "global-require": 0,
    "import/no-unresolved": 0,
    "no-param-reassign": 0,
    "no-shadow": 0,
    "import/extensions": 0,
    "import/newline-after-import": 0,
    "no-multi-assign": 0,
    "semi": 1,
    "strict": 0,
    "eqeqeq": "off",
    "curly": "warn",
    "quotes": ["warn", "double"],

    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0
  }
};
