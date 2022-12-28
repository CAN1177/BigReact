import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

// 全局指针， 标识正在工作的fiberNode
let workInProgress: FiberNode | null = null;

/**
 * 初始化,让workInProgress指向第一个fiberNode
 * @param root
 */
function prepareFreshStacks(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

/**
 * 在fiber中调度update任务
 * @param fiber
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// TODO 调度功能
	// fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

/**
 *
 * @param fiber
 * @returns
 */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStacks(root);

	// 初始化完成之后就需要递归
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop 发生错误', e);
			}
			// 重置workInProgress
			workInProgress = null;
		}
	} while (true);

	// 整个更新流程完成之后生成wip fiberNode树
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// wip fiberNode树 树中的flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit阶段开始', finishedWork);
	}

	// 重置
	root.finishedWork = null;

	// 判断是否存在3个子阶段需要执行的操作
	// root flags root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork);

		root.current = finishedWork;

		// layout
	} else {
		root.current = finishedWork;
	}
}

/**
 * workLoop 完整的工作循环
 * 也就是DF遍历ReactElement的过程，其中递阶段对应beginWork方法， 归阶段对应completeWork方法
 */
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

/**
 * 循环执行performUnitOfWork并赋值给workInProgress，直到workInProgress值为空，则中止循环
 * 调用beginWork，从父至子，进行组件（节点）更新；
 * 调用completeUnitOfWork，从子至父，根据 effectTag，对节点进行一些处理
 * @param fiber
 */
function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

/**
 * 归阶段，继续向下遍历
 * 完成当前节点的work，并赋值Effect链，然后移动到兄弟节点，重复该操作，当没有更多兄弟节点时，返回至父节点，最终返回至root节点
 * @param fiber
 * @returns
 */
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
