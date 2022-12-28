import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');
export function resolvePkgPath(pkgName, isDist) {
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
}

export function getPackageJSON(pkgName) {
	// 包路径
	const path = `${resolvePkgPath(pkgName)}/package.json`;
	const str = fs.readFileSync(path, 'utf8');
	return JSON.parse(str);
}

// 获取所有公用plugins
export function getBaseRollupPlugins({
	// 为开发环境增加__DEV__标识，方便Dev包打印更多信息
	alias = {
		__DEV__: true,
		preventAssignment: true
	},
	typescript = {}
} = {}) {
	return [replace(alias), cjs(), ts(typescript)];
}
