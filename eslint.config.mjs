import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/jest.config.js",
      "**/jest.setup.js",
      "coverage/**"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { 
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true
      }],
      "@typescript-eslint/no-empty-object-type": "off",
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;
