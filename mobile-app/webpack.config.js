const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add polyfills for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "buffer": require.resolve("buffer"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util"),
  };
  
  // Fix for MIME type issues
  config.module.rules.push({
    test: /\.js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  return config;
};
