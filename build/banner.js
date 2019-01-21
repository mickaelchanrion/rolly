import pkg from '../package.json';

export const getBanner = (
  name,
  version,
  author,
  license = 'MIT',
  date = new Date().getFullYear(),
) => `/*!
    * ${name} v${version}
    * (c) ${date} ${author}
    * Released under the ${license} license
    */
  `;

export default getBanner(pkg.name, pkg.version, pkg.author);
