export default {
  branches: ["main"],
  mangle: false,
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/git",
      {
        message:
          "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}",
      },
    ],
  ],
};
