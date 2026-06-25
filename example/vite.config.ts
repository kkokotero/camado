import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(rootDir, "../");

export default {
  resolve: {
    alias: [
      {
        find: /^miora\/control$/,
        replacement: resolve(repoRoot, "src/control/index.ts"),
      },
      {
        find: /^miora\/core$/,
        replacement: resolve(repoRoot, "src/core/index.ts"),
      },
      {
        find: /^miora\/reactive$/,
        replacement: resolve(repoRoot, "src/reactive/index.ts"),
      },
      {
        find: /^miora\/html$/,
        replacement: resolve(repoRoot, "src/html/index.ts"),
      },
      {
        find: /^miora\/modifiers$/,
        replacement: resolve(repoRoot, "src/modifiers/index.ts"),
      },
      {
        find: /^miora\/navigator$/,
        replacement: resolve(repoRoot, "src/navigator/index.ts"),
      },
      {
        find: /^miora\/svg$/,
        replacement: resolve(repoRoot, "src/svg/index.ts"),
      },
      {
        find: /^miora\/unit$/,
        replacement: resolve(repoRoot, "src/unit/index.ts"),
      },
      {
        find: /^miora\/validator$/,
        replacement: resolve(repoRoot, "src/validator/index.ts"),
      },
      { find: /^miora$/, replacement: resolve(repoRoot, "src/index.ts") },
    ],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
};
