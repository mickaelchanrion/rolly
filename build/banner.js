import pkg from '../package.json';

const banner = `/*!
 * ${pkg.name}.js v${pkg.version}
 * (c) 2018-${new Date().getFullYear()} Mickael Chanrion
 * Released under the MIT license
 */
`;

export default banner;
