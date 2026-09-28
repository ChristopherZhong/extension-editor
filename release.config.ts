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
        prepareCmd: 'npm pkg set version=${nextRelease.version} && npm run zip'
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
    ]
  ]
};
