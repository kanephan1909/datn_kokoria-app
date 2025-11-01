const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const baseConfig = getDefaultConfig(__dirname);
const customConfig = {};

const mergedConfig = mergeConfig(baseConfig, customConfig);

module.exports = withNativeWind(mergedConfig, {
  input: './global.css',
});
