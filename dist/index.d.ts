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
export default function withGitignore(client: Client, { gitRoot, path, }?: Partial<WithGitignoreOptions>): Promise<Directory>;
