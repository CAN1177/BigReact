import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';

import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

/**
 * 存放FiberNode的数据结构
 */
export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	// 指向父fiberNode
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
	// 标识插入删除的标记
	flags: Flags;
	// 子树中存在的flags
	subtreeFlags: Flags;
	updateQueue: unknown;

	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例属性
		this.tag = tag;
		this.key = key;
		// 对于HostComponent 来说<div>，  stateNode就是div的DOM
		this.stateNode = null;
		// FiberNode的类型
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
		// 标记相同节点的顺序
		this.index = 0;

		this.ref = null;

		/**
		 * 作为工作单元
		 */
		// 工作单元刚开始工作时的props
		this.pendingProps = pendingProps;
		// 工作单元完成之后的props
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;
		this.alternate = null;

		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;

		this.deletions = null;
	}
}

export class FiberRootNode {
	// 对应数组环境挂载的节点，比如RootElement
	container: Container;
	// 指向hostRootFiber的指针，看那个图示
	current: FiberNode;
	// 更新完成之后的hostRootFiber的指针，看那个图示
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

/**
 * 创建WorkInProgress
 * 双缓存机制： wip 后区缓存 current 前区缓冲，然后二者直接在内存中切换（交换）
 * @param current
 * @param pendingProps
 * @returns
 */
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount挂载，也就是首屏渲染的时候
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;

		//清除副作用，有可能是上次遗留下来的
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
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
