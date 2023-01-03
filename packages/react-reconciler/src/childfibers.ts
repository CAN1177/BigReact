import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createWorkInProgress,
	createFiberFromElement
} from './fiber';
import { Placement, ChildDeletion } from './fiberFlags';
import { HostText } from './workTags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	/**
	 * 处理单节点的更新流程（目前）
	 * @param returnFiber
	 * @param currentFiber
	 * @param element
	 * @returns
	 */
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		work: if (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// type 相同
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// key 相同，type不同也需要删除旧的
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.log(
							'%c Line:25 🥃 element',
							'color:#93c0a4',
							'还未实现的react 类型',
							element
						);
						break work;
					}
				}
			} else {
				// key 不相同，删除旧的
				deleteChild(returnFiber, currentFiber);
			}
		}

		// 根据element创建fiber
		const fiber = createFiberFromElement(element);
		// 父节点执向returnFiber
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number //保存文本内容
	) {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	/**
	 * 插入单一节点
	 * @param fiber
	 * @returns
	 */
	function placeSingleChild(fiber: FiberNode) {
		// 应该追踪副作用 && 首屏渲染情况
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);

				default:
					if (__DEV__) {
						console.log('%c Line:18 🥛', '未实现的reconcile类型', newChild);
					}
					break;
			}
		}
		// 多节点情况（暂时不处理）TODO

		// HostText 文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber !== null) {
			// 继续删除，这里是兜底的情况
			deleteChild(returnFiber, currentFiber);
		}

		// 以上情况都不满足
		if (__DEV__) {
			console.log('%c Line:18 🥛', '未实现的reconcile类型', newChild);
		}

		return null;
	};
}

/**
 * 处理复用情况
 * @param fiber
 * @param pendingProps
 */
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
