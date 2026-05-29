const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// allow `require('*.onnx')` for onnxruntime-react-native
config.resolver.assetExts.push('onnx', 'ort');

module.exports = config;
