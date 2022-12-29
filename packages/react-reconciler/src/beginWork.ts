import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

/**
 * 递归中的递阶段 递：对应beginWork
 * @param wip
 * @returns 返回子fiberNode
 */
export const beginWork = (wip: FiberNode) => {
	// 比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			// 没有子节点
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip);
		default:
			// 在开发环境__DEV__会被编译为true
			if (__DEV__) {
				console.warn('beginWork未实现的类型');
			}
			break;
	}
	return null;
};

/**
 *
 * @param wip
 */
function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip);

	reconcileChildren(wip, nextChildren);
	return wip.child;
}

/**
 * 计算状态最新值
 * 创造子fiberNode
 * @param wip
 * @returns
 */
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

/**
 * 如果是首次渲染，则会把已经处理好的fiber树进行挂载。
 * 如果不是首次渲染则调用reconcileChildFibers进行下一步处理。
 * @param wip
 * @param children
 */
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
}
