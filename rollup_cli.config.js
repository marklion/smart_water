import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import plug_json from '@rollup/plugin-json'

export default {
  input: 'public/cli/index.js', // 你的入口文件
  output: {
    dir: 'dist/cli',
    format: 'esm', // ESM 输出
    sourcemap: true,
    entryFileNames: '[name].js', // 输出文件名
  },
  external: [
    'node:bufferutil',
    'node:stream/promises',
    'node:timers/promises',
    'node:v8',
    'node:process',
    'node:events',
    'node:http',
    'node:https',
    'node:path',
    'node:net',
    'node:fs',
    'node:zlib',
    'node:dgram',
    'node:worker_threads',
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
    'path',
    'fs',
    'http',
    'https',
    'url',
    'util',
    'stream',
    'crypto',
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
    'net',
    'dgram',
    'worker_threads',
    'get-stream',
    'unicorn-magic',
    'bufferutil',
    'utf-8-validate',
  ],
  plugins: [
    resolve({
      preferBuiltins: true, // 优先使用 Node.js 内置模块
      exportConditions: ['node'] // 使用 Node.js 条件导出
    }),
    commonjs(), // 将 CommonJS 转为 ESM
    plug_json(), // 处理 JSON 文件
  ]
};