import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { NoFlags } from './fiberFlags';
import { HostRoot, HostText, HostComponent } from './workTags';

/**
 * 递归中的归
 * @param wip
 * @returns
 */
export const completeWork = (wip: FiberNode) => {
	// 递归中的归
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1. 构建DOM
				// const instance = createInstance(wip.type, newProps);
				const instance = createInstance(wip.type);

				// 2. 将DOM插入到DOM树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			// 将子fiberNode的flags冒泡到父fiberNode
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1. 构建DOM
				const instance = createTextInstance(newProps.content);
				// 2.不需要插入，HostText不存在childen
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
			bubbleProperties(wip);
			return null;

		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
			break;
	}
};

/**
 *
 * @param parent
 * @param wip
 * @returns
 */
function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			// 插入方法
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		// 向上归的阶段
		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

/**
 * 将子fiberNode的flags冒泡到父fiberNode
 * @param wip
 */
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		// 按位“或”赋值运算符 (|=)
		/**
		 * 或等符号
				例如a |= 5
				等价于 a = a|5
				或运算（位运算）的方法：
				1|1=1
				1|0=1
				0|1=1
				0|0=0
		 */
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
