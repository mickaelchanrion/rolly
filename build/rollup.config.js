import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import { uglify } from 'rollup-plugin-uglify';

import pkg from '../package.json';
import banner from './banner';

const isDev = process.env.BUILD === 'development';

const bubleOptions = {
  exclude: ['node_modules/**'],
  objectAssign: 'Object.assign',
};

const base = {
  input: `./src/${pkg.moduleName}.js`,
};

const umd = {
  ...base,
  output: {
    banner,
    name: pkg.moduleName,
    file: pkg.browser,
    format: 'umd',
  },
  plugins: [
    resolve(),
    commonjs(),
    buble(bubleOptions),
  ],
};

const esm = {
  ...base,
  external: [...Object.keys(pkg.dependencies || {})],
  output: {
    banner,
    file: pkg.module,
    format: 'es',
  },
  plugins: [
    buble(bubleOptions),
  ],
};

const config = [umd, esm];

if (!isDev) {
  config.push({
    ...base,
    output: {
      banner,
      name: pkg.moduleName,
      file: `dist/${pkg.moduleName}.min.js`,
      format: 'iife',
    },
    plugins: [
      ...umd.plugins,
      uglify({
        output: { comments: /!/ },
      }),
    ],
  });
}

export default config;
