import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null; // hooks的dispatch
}

// 创建Update 实例
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};

// 初始化创建UpdateQueue 数据结构
export const createUpdateQueue = <State>() => {
	return {
		// 包含shared.pending
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

/**
 * 往UpdateQueue里增加Update
 * @param updateQueue
 * @param update
 */
export const enqueueUpdate = <Action>(
	updateQueue: UpdateQueue<Action>,
	update: Update<Action>
) => {
	updateQueue.shared.pending = update;
};

/**
 * UpdataQueue 消费Update的过程
 * 也是计算状态的最新值
 * @param baseState
 * @param pendingUpdate
 * @returns
 */
export const processUpdateQueue = <State>(
	// 初始状态
	baseState: State,
	// 消费的update
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// baseState为1, update为 x=> x*2 memoizedState结果： 2
			result.memoizedState = action(baseState);
		} else {
			// baseState为1, update为2 ===》 memoizedState结果： 2
			result.memoizedState = action;
		}
	}
	return result;
};
