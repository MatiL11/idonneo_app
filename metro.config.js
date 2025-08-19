const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Configuración personalizada para resolver módulos
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
  // Agregar alias para las rutas
  alias: {
    '@': resolve(__dirname, './src')
  },
  extraNodeModules: new Proxy({}, {
    get: (target, name) => resolve(__dirname, `node_modules/${name}`)
  })
};

module.exports = config;
