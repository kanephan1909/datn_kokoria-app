module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['babel.config.js', 'metro.config.js', 'App.tsx', '.eslintrc.js'],
      parserOptions: {
        requireConfigFile: false,
      },
      rules: {
        'unicorn/prefer-module': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
