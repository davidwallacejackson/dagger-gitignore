import { join } from "path";
import Client, { Directory } from "@dagger.io/dagger";

export interface WithGitignoreOptions {
  /**
   * Directory relative to the workdir containing .git. Defaults to the workdir.
   */
  gitRoot: string;

  /**
   * Directory relative to the workdir to import, minus any files ignored by git. Defaults to the workdir.
   */
  path: string;
}
export default async function withGitignore(
  client: Client,
  { gitRoot = ".", path = "." }: Partial<WithGitignoreOptions> = {}
): Promise<Directory> {
  const gitOutput = await client
    .container()
    .from("alpine/git")
    .withWorkdir("/workdir")
    .withMountedDirectory(".", client.host().directory(gitRoot))
    .withWorkdir(join("/workdir", path))
    .withExec([
      "ls-files",
      "--ignored",
      "--exclude-standard",
      "--others",
      "--directory",
    ])
    .stdout();

  const gitignoredPaths = gitOutput.split("\n").filter((path) => path !== "");

  return client.host().directory(path, {
    exclude: gitignoredPaths,
  });
}
