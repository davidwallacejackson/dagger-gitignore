"use strict";
import { join } from "path";
export default async function withGitignore(client, {
  gitRoot = client.host().directory(""),
  path = "."
} = {}) {
  const gitOutput = await client.container().from("alpine/git").withWorkdir("/workdir").withMountedDirectory(".", gitRoot).withWorkdir(join("/workdir", path)).withExec([
    "ls-files",
    "--ignored",
    "--exclude-standard",
    "--others",
    "--directory"
  ]).stdout();
  const gitignoredPaths = gitOutput.split("\n").filter((path2) => path2 !== "");
  return client.host().directory(path, {
    exclude: gitignoredPaths
  });
}
