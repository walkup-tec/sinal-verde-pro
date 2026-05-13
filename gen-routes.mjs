import { generator } from '@tanstack/router-generator';
const root = process.cwd();
await generator({
  routesDirectory: './src/routes',
  generatedRouteTree: './src/routeTree.gen.ts',
  routeFileIgnorePrefix: '-',
  quoteStyle: 'single',
  semicolons: false,
  disableTypes: false,
  addExtensions: false,
  disableLogging: false,
  disableManifestGeneration: false,
  apiBase: '/api',
  routeTreeFileHeader: ['/* eslint-disable */', '// @ts-nocheck'],
  routeTreeFileFooter: [],
  autoCodeSplitting: true,
  experimental: {},
  enableRouteTreeFormatting: false,
  customScaffolding: {},
  indexToken: 'index',
  routeToken: 'route',
}, root);
console.log('done');
