import { join } from "path";
import Client, { Directory } from "@dagger.io/dagger";

export interface WithGitignoreOptions {
  /**
   * Directory containing .git. Defaults to the workdir.
   */
  gitRoot: Directory;

  /**
   * Path relative to the workdir to return as a Directory, omitting any files ignored by git. Defaults to '.'
   */
  path: string;
}
export default async function withGitignore(
  client: Client,
  {
    gitRoot = client.host().directory(""),
    path = ".",
  }: Partial<WithGitignoreOptions> = {}
): Promise<Directory> {
  const gitOutput = await client
    .container()
    .from("alpine/git")
    .withWorkdir("/workdir")
    .withMountedDirectory(".", gitRoot)
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
