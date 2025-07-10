module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@config': './src/config',
            '@context': './src/context',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
          },
        },
      ],
    ],
  };
};
