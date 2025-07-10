const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file types
config.resolver.assetExts.push(
  'txt',
  'xml',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'mp4',
  'webm',
  'wav',
  'mp3',
  'aac',
  'pdf'
);

// Add support for TypeScript
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js', 'json');

module.exports = config;
