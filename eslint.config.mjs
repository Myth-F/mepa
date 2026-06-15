// eslint-config-next v16 ships a native flat config array, so it can be spread
// directly without the eslintrc FlatCompat shim.
import next from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["src/generated/**", ".next/**", "node_modules/**", ".devdata/**"],
  },
  ...next,
  {
    // French copy uses literal apostrophes throughout; this stylistic rule is noise here.
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
