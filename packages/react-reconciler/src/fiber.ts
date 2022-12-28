import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';

import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	ref: Ref;
	memoizedProps: Props | null;
	// 用来存储在上次渲染过程中最终获得的节点的`state`的
	memoizedState: any;
	// 用于两颗filbreNode 树之间的切换（current 与 workInProgress）
	alternate: FiberNode | null;
	// 标识插入删除的标识
	flags: Flags;
	// 子树中存在的flags
	subtreeFlags: Flags;
	updateQueue: unknown;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例
		this.tag = tag;
		this.key = key;

		// HostComponent <div>  div DOM
		this.stateNode = null;
		// FunctionComponent的类型
		this.type = null;

		/**
		 * 构成树状结构
		 */
		// 指向父fiberNode
		this.return = null;
		// 指向右边兄弟节点
		this.sibling = null;
		// 指向子节点
		this.child = null;
		this.index = 0;

		this.ref = null;

		/**
		 * 作为工作单元
		 */
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;
		this.alternate = null;

		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
	}
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	// 更新完成之后的FiberNode
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

// 创建WorkInProgress
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount挂载
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
	}
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		// <div/> type: 'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}
