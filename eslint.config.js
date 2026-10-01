import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: ['packages/db/migrations/**', 'INSTRUCTIONS.md'],
  },
  {
    files: ['apps/*/src/{server,main}.ts', 'packages/db/src/{migrate,seed}.ts'],
    rules: {
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
    },
  },
)
