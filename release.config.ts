const isDraft = process.env.IS_DRAFT === 'true';

export default {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits'
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits'
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'npm version ${nextRelease.version} --no-git-tag-version && npm run zip'
      }
    ],
    [
      '@semantic-release/github',
      {
        draftRelease: isDraft,
        assets: [
          {
            path: '.output/*.zip',
            label: 'Extension Packages'
          }
        ]
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'package-lock.json'
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
};
