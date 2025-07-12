const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add polyfills for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "buffer": require.resolve("buffer"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util"),
    "fs": false,
    "net": false,
    "tls": false,
  };
  
  // Fix for MIME type issues and file handling
  config.module.rules.push({
    test: /\.js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  // Add specific rule to handle font files and prevent null buffer MIME issues
  config.module.rules.unshift({
    test: /\.(ttf|eot|woff|woff2)$/,
    type: 'asset/resource',
    generator: {
      filename: 'static/media/fonts/[name].[hash:8][ext]',
    },
  });
  
  // Add rule for images with fallback MIME type
  config.module.rules.unshift({
    test: /\.(png|jpe?g|gif|svg|ico|webp)$/i,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 10000 // 10kb
      }
    },
    generator: {
      filename: 'static/media/images/[name].[hash:8][ext]',
    }
  });
  
  // Filter out potentially conflicting rules
  config.module.rules = config.module.rules.filter((rule, index) => {
    // Skip duplicate asset rules that might conflict
    if (index > 1 && rule.test && rule.type === 'asset/resource') {
      const testStr = rule.test.toString();
      if (testStr.includes('png') || testStr.includes('ttf') || testStr.includes('woff')) {
        return false;
      }
    }
    return true;
  });
  
  // Add resolve extensions
  config.resolve.extensions = [
    '.web.js',
    '.js',
    '.web.ts',
    '.ts',
    '.web.tsx',
    '.tsx',
    '.json',
    ...config.resolve.extensions
  ];
  
  // Add performance hints to ignore large assets
  config.performance = {
    ...config.performance,
    maxAssetSize: 1000000, // 1MB
    maxEntrypointSize: 1000000, // 1MB
  };
  
  // Fix WebSocket connection issues for GitHub Codespaces
  if (config.devServer) {
    config.devServer = {
      ...config.devServer,
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      client: {
        webSocketURL: {
          protocol: 'wss',
          hostname: 'stunning-journey-wv5pxxvw49xh565g.github.dev',
          port: 19007,
          pathname: '/_expo/ws',
        },
        overlay: false, // Disable error overlay to reduce noise
      },
      hot: true,
      liveReload: true,
    };
  }
  
  return config;
};
