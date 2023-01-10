import { FiberNode, FiberRootNode } from './fiber';

import { Container } from 'hostConfig';
import { HostRoot } from './workTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

/**
 * ReactDOM.createRoot()执行时，createRoot方法内部执行createContainer
 * @param container
 * @returns
 */
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	// 与之前的更新机制（createUpdateQueue）做关联
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

/**
 *ReactDOM.createRoot()。render执行时，render方法内部执行updateContainer
 * @param element
 * @param root
 * @returns
 */
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	// 结合第四课第二节的图
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType | null>(element);

	// 插入hostRootFiber.updateQueue中 所以执行enqueueUpdate方法
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}
