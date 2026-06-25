import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(rootDir, "../");

export default {
  resolve: {
    alias: [
      {
        find: /^neptune\/control$/,
        replacement: resolve(repoRoot, "src/control/index.ts"),
      },
      {
        find: /^neptune\/core$/,
        replacement: resolve(repoRoot, "src/core/index.ts"),
      },
      {
        find: /^neptune\/reactive$/,
        replacement: resolve(repoRoot, "src/reactive/index.ts"),
      },
      {
        find: /^neptune\/html$/,
        replacement: resolve(repoRoot, "src/html/index.ts"),
      },
      {
        find: /^neptune\/modifiers$/,
        replacement: resolve(repoRoot, "src/modifiers/index.ts"),
      },
      {
        find: /^neptune\/navigator$/,
        replacement: resolve(repoRoot, "src/navigator/index.ts"),
      },
      {
        find: /^neptune\/svg$/,
        replacement: resolve(repoRoot, "src/svg/index.ts"),
      },
      {
        find: /^neptune\/unit$/,
        replacement: resolve(repoRoot, "src/unit/index.ts"),
      },
      {
        find: /^neptune\/validator$/,
        replacement: resolve(repoRoot, "src/validator/index.ts"),
      },
      { find: /^neptune$/, replacement: resolve(repoRoot, "src/index.ts") },
    ],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
};
