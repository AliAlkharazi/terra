const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('html', 'glb', 'gltf', 'obj', 'mtl');

const shims = {
  NativeMicrotasks: path.resolve(__dirname, 'shims/NativeMicrotasks.js'),
  NativeIdleCallbacks: path.resolve(__dirname, 'shims/NativeIdleCallbacks.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('webapis/microtasks/specs/NativeMicrotasks')) {
    return { type: 'sourceFile', filePath: shims.NativeMicrotasks };
  }
  if (moduleName.includes('webapis/idlecallbacks/specs/NativeIdleCallbacks')) {
    return { type: 'sourceFile', filePath: shims.NativeIdleCallbacks };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
