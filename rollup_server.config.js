import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import plug_json from '@rollup/plugin-json'

export default {
  input: 'public/server/index.js', // 你的入口文件
  output: {
    dir: 'dist/server',
    format: 'esm', // ESM 输出
    sourcemap: true,
    entryFileNames: '[name].js', // 输出文件名
  },
  external: [
    'node:events',
    'node:http',
    'node:https',
    'node:path',
    'node:net',
    'node:fs',
    'node:zlib',
    'path',
    'fs',
    'http',
    'https',
    'url',
    'util',
    'stream',
    'crypto',
    'node:stream',
    'node:crypto',
    'node:util',
    'node:url',
    'node:os',
    'node:buffer',
    'node:child_process',
    'node:tls',
    'node:dns',
    'node:readline',
    'node:timers',
    'node:async_hooks',
    'node:punycode',
    'node:tty',
    'node:string_decoder',
    'querystring',
    'assert',
    'os',
    'buffer',
    'child_process',
    'tls',
    'dns',
    'readline',
    'timers',
    'zlib',
    'async_hooks',
    'punycode',
    'events',
    'tty',
    'string_decoder',
  ],
  plugins: [
    resolve({
      preferBuiltins: true, // 优先使用 Node.js 内置模块
      exportConditions: ['node'] // 使用 Node.js 条件导出
    }),
    commonjs(), // 将 CommonJS 转为 ESM
    plug_json(), // 处理 JSON 文件
    copy({
      targets: [
        // 复制 assets 目录到输出目录
        { src: 'public/server/web/*', dest: 'dist/server/web' },
      ],
      hook: 'writeBundle' // 在打包完成后执行
    }),
  ]
};