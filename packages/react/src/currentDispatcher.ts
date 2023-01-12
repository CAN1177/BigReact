import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
}

export type Dispatch<State> = (action: Action<State>) => void;
/**
 * 当前使用hooks的集合
 * 包含了 hooks 函数的共享对象
 */
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

/**
 * 获取dispatcher中的useState
 * 实际上执行的是 dispatcher.useState()，这里面会通过执行 resolveDispatcher() 得到一个 dispatcher，然后调用该对象上的 useState() 方法。
 * @returns
 */
export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw new Error('hooks 只能在函数组件中使用');
	}

	return dispatcher;
};

export default currentDispatcher;
