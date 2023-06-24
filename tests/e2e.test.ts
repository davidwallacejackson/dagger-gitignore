import url from "url";
import { writeFile, unlink } from "fs/promises";
import { describe, it, expect, beforeEach } from "vitest";
import { connect } from "@dagger.io/dagger";
import { join } from "path";

import withGitignore from "../src/index.js";

const repoRoot = join(url.fileURLToPath(new URL(".", import.meta.url)), "..");

describe("dagger-gitignore", () => {
  beforeEach(async () => {
    await writeFile(join(repoRoot, "garbage.js"), "garbage");
    await writeFile(join(repoRoot, "tests/garbage", "garbage.js"), "garbage");
  });
  it(
    "should work",
    async () => {
      console.log("starting test");
      await connect(
        async (client) => {
          const directoryWithoutGitignore = await client.host().directory("");

          expect(await directoryWithoutGitignore.entries()).toEqual([
            ".git",
            ".gitignore",
            "garbage.js",
            "node_modules",
            "package.json",
            "pnpm-lock.yaml",
            "src",
            "tests",
            "tsconfig.json",
          ]);

          expect(
            await directoryWithoutGitignore.directory("tests/garbage").entries()
          ).toEqual([".gitkeep", "garbage.js"]);

          const directory = await withGitignore(client);

          expect(await directory.entries()).toEqual([
            ".git",
            ".gitignore",
            "package.json",
            "pnpm-lock.yaml",
            "src",
            "tests",
            "tsconfig.json",
          ]);

          expect(await directory.directory("tests/garbage").entries()).toEqual([
            ".gitkeep",
          ]);
        },
        {
          LogOutput: process.stdout,
          Workdir: repoRoot,
        }
      );
    },
    {
      timeout: 60000,
    }
  );
});
