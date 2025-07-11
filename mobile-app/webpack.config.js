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
  
  // Fix for MIME type issues and file handling
  config.module.rules.push({
    test: /\.js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  // Fix for vector icons and asset handling
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|svg|ttf|woff|woff2|eot)$/,
    type: 'asset/resource',
  });
  
  // Handle null buffer issues
  config.module.rules.push({
    test: /\.node$/,
    use: 'node-loader',
  });
  
  return config;
};
