import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  // Apply to specific file patterns
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
  },
  
  // Base JavaScript configuration
  js.configs.recommended,
  
  // TypeScript configuration
  ...tseslint.configs.recommended,
  
  // React configuration
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // React specific rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // General rules
      "no-console": "warn",
      "no-debugger": "error",
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "build/**", 
      "node_modules/**",
      "**/*.d.ts",
      "vite.config.ts",
    ],
  },
];
