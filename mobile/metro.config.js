const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('html', 'glb', 'gltf', 'obj', 'mtl');

module.exports = config;
