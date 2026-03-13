module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin (which re-exports react-native-worklets/plugin)
    // MUST be the last plugin entry so it can correctly transform worklets.
    plugins: ['react-native-reanimated/plugin'],
    overrides: [
      {
        // Include @fastshot/* packages for env var inlining
        // babel-preset-expo skips node_modules, so we need this override
        include: /node_modules\/@fastshot\/(ai|auth)/,
        plugins: [
          [
            'transform-inline-environment-variables',
            {
              include: [
                'EXPO_PUBLIC_PROJECT_ID',
                'EXPO_PUBLIC_NEWELL_API_KEY',
                'EXPO_PUBLIC_NEWELL_API_URL',
                'EXPO_PUBLIC_AUTH_BROKER_URL',
              ],
            },
          ],
        ],
      },
    ],
  };
};
