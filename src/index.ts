import { join, normalize } from "path";
import { mkdtemp, rmdir } from "fs/promises";
import { tmpdir } from "os";

import { Repository, Ignore } from "nodegit";
import Client, { Directory } from "@dagger.io/dagger";

async function getIgnoredPaths(
  directory: Directory,
  gitignoreRepo: Repository,
  directoryPathInRepo: string
): Promise<string[]> {
  directoryPathInRepo = normalize(directoryPathInRepo);

  if (directoryPathInRepo.endsWith("/")) {
    directoryPathInRepo = directoryPathInRepo.slice(
      0,
      directoryPathInRepo.length - 1
    );
  }

  const ignoredPaths = await getIgnoredPathsInner(
    directory,
    gitignoreRepo,
    directoryPathInRepo
  );

  // inner will return a list of ignored paths relative to the root of the repo
  // we need to convert them to be relative to the directory we're looking at
  return ignoredPaths.map((path) =>
    directoryPathInRepo === "."
      ? path
      : // +1 to remove the trailing slash
        path.slice(directoryPathInRepo.length + 1)
  );
}

async function getIgnoredPathsInner(
  directory: Directory,
  gitignoreRepo: Repository,
  directoryPathInRepo: string
): Promise<string[]> {
  let ignoredPaths: string[] = [];
  const entries = await directory.entries();

  for (const entry of entries) {
    const shouldBeIgnored =
      (await Ignore.pathIsIgnored(gitignoreRepo, entry)) === 1;

    if (shouldBeIgnored) {
      ignoredPaths.push(join(directoryPathInRepo, entry));
      continue;
    }

    try {
      ignoredPaths = ignoredPaths.concat(
        await getIgnoredPathsInner(
          directory.directory(entry),
          gitignoreRepo,
          join(directoryPathInRepo, entry)
        )
      );
    } catch (e) {
      if (!((e as any).message || "").includes(": not a directory")) {
        throw e;
      }
    }
  }

  return ignoredPaths;
}

export interface WithGitignoreOptions {
  /**
   * Path to directory containing .git. Defaults to '.'
   */
  gitRoot: string;

  /**
   * Path relative to the workdir to return as a Directory, omitting any files ignored by git. Defaults to '.'
   */
  path: string;
}
export default async function withGitignore(
  client: Client,
  { gitRoot = ".", path = "." }: Partial<WithGitignoreOptions> = {}
): Promise<Directory> {
  const gitignoresOnly = client.host().directory(gitRoot, {
    include: ["**/.gitignore"],
  });

  const tmpdr = await mkdtemp(join(tmpdir(), "dagger-gitignore"));

  await gitignoresOnly.export(tmpdr);

  const gitignoreRepo = await Repository.init(tmpdr, 0);
  const everything = client.host().directory(gitRoot).directory(path);

  const ignoredPaths = await getIgnoredPaths(
    everything,
    gitignoreRepo,
    normalize(path)
  );
  await rmdir(tmpdr, { recursive: true });

  console.log("ignoredPaths", ignoredPaths);

  return client.host().directory(path, {
    exclude: ignoredPaths,
  });
}
