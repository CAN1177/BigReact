import {
	appendChildToContainer,
	commitUpdate,
	Container,
	insertChildToContainer,
	Instance,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

// 指向在一个需要执行的Effect
let nextEffect: FiberNode | null = null;

/**
 * 提交HostComponent的side effect，也就是DOM节点的操作(增删改)
 * 配合第六课的图示代码
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
			// 继续向子节点遍历
			nextEffect = child;
		} else {
			// 向上遍历 DFS， up:为命名
			// 找到底了
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
 * 据flag进行不同的处理。
 * 如 Placement会将Fiber对应的DOM渲染在浏览器上。
 * Update会更新对应的DOM节点。
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
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		// Update
		finishedWork.flags &= ~Update;
	}

	// flags ChildDeletion
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			// deletions 是个数组
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

/**
 * 删除每个节点fiber方法
 * @param childToDelete
 */
function commitDeletion(childToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null;
	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				// TODO 解绑ref
				return;
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				// TODO useEffect unmount 、解绑ref
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unmountFiber);
				}
		}
	});

	// 移除rootHostComponent的DOM
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);

		if (node.child !== null) {
			// 向下遍历
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			// 终止条件
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}
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

	// hostsibling 兄弟节点
	const sibling = getHostSibling(finishedWork);

	// finishedWork ~~ DOM append parentDOM
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

/**
 * React和DOM的那些事-节点新增算法
 * https://juejin.cn/post/6920897301116354574
 * @param fiber
 * @returns
 */
function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;

			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				// 不稳定的Host节点不能作为「目标兄弟Host节点」，所以继续向下
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

/**
 * 获取父级parent DOM
 * @param fiber
 * @returns
 */
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;
		// HostComponent HostRoot的情况下（parent.tag对应的数组环境下的父级节点）
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
function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
	}
	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
