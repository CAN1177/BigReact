import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;

/**
 * 提交HostComponent的side effect，也就是DOM节点的操作(增删改)
 * @param finishedWork
 */
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 向上遍历 DFS， up:为命名
			up: while (nextEffect !== null) {
				commitMutaitonEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				// 赋值为它的父节点
				nextEffect = nextEffect.return;
			}
		}
	}
};

/**
 *
 * @param finishedWork
 */
const commitMutaitonEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	// 按位与（&）运算符在两个操作数对应的二进位都为 1 时，该位的结果值才为 1。https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Bitwise_AND
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 删除对应Placement
		finishedWork.flags &= ~Placement;
	}
	// flags Update
	// flags ChildDeletion
};

/**
 *
 * @param finishedWork
 */
const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}
	// 获取父级parent DOM
	const hostParent = getHostParent(finishedWork);
	// finishedWork ~~ DOM append parent DOM
	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

/**
 * 获取父级parent DOM
 * @param fiber
 * @returns
 */
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;
		// HostComponent HostRoot的情况下
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}

/**
 *
 * @param finishedWork
 * @param hostParent
 * @returns
 */
function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	// fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		return;
	}
	const child = finishedWork.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
