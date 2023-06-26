import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createWorkInProgress,
	createFiberFromElement
} from './fiber';
import { Placement, ChildDeletion } from './fiberFlags';
import { HostText } from './workTags';

type ExistingChildren = Map<string | number, FiberNode>;

/**
 * 生成子节点与标记副作用
 * @param shouldTrackEffects 是否追踪副作用
 * @returns
 */
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

	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	/**
	 * 处理单节点的更新流程（目前） 单节点
	 * @param returnFiber 父亲fiber
	 * @param currentFiber 当前fiber
	 * @param element ReactElement
	 * @returns
	 */
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// type 相同，可复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						// 当前节点可复用，需要删除其他剩余节点
						deleteRemainingChildren(returnFiber, currentFiber);
						return existing;
					}
					// key 相同，type不同也需要删除旧的(所有旧的)
					// deleteChild(returnFiber, currentFiber);
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.log(
							'%c Line:25 🥃 element',
							'color:#93c0a4',
							'还未实现的react 类型',
							element
						);
						break;
					}
				}
			} else {
				// key 不相同，删除旧的
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
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
		while (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				// 当前节点可复用，需要删除其他剩余节点
				deleteRemainingChildren(returnFiber, currentFiber);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
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

	/**
	 * 多看看文档，还没掌握🌟
	 * 对于同级多节点的diff
	 * @param returnFiber
	 * @param currentFirstChild
	 * @param newChild
	 * @returns
	 */
	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null;

		// 1.将current保存在map中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 2.遍历newChild，寻找是否可复用
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			// 父级
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			// 不追踪副作用
			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动， 更新下标
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount， 插入
				newFiber.flags |= Placement;
			}
		}
		// 4. 将Map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}

	/**
	 * 判断是否可服用
	 * @param returnFiber
	 * @param existingChildren
	 * @param index
	 * @param element
	 * @returns
	 */
	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		// 更新前对应的fiber节点
		const before = existingChildren.get(keyToUse);

		// HostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				// 更新之前如果是HostText的话
				if (before.tag === HostText) {
					// 直接删除之前的，直接复用
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			// 如果不能复用 返回新的节点
			return new FiberNode(HostText, { content: element + '' }, null);
		}

		// 判断是否为ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}

			// TODO 数组类型， 看文档解析
			if (Array.isArray(element) && __DEV__) {
				console.warn('还未实现数组类型的child');
			}
		}
		return null;
	}

	// 形成闭包， 在beginwork 中调用
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: //代表当前节点是ReactElement
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
		// 多节点情况 ul*li*3
		if (Array.isArray(newChild)) {
			return reconcileChildrenArray(returnFiber, currentFiber, newChild);
		}

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

// update 时 需要追踪副作用
export const reconcileChildFibers = ChildReconciler(true);
// mount 时 不需要追踪副作用
export const mountChildFibers = ChildReconciler(false);
