import { jsx, jsxDEV, isValidElement as isValidElementFn } from './src/jsx';
import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
// 在react中暴露出去useState方法
export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享层（内部神秘属性，不要乱用！否则你会被炒鱿鱼。）
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0';
export const createElement = jsx;
export const isValidElement = isValidElementFn;

// export default {
// 	version: '0.0.0',
// 	createElement: jsxDEV
// };
