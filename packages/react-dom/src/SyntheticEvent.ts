/**
 * 合成事件文件
 */

import { Container } from 'hostConfig';

import { Props } from 'shared/ReactTypes';

// dom key的标识
export const elementPropsKey = '__props';

// 支持的事件类型
const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

interface Paths {
	capture: EventCallback[];

	bubble: EventCallback[];
}

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

// dom[xxx] = reactElemnt props

/**
 * 更新fiber props
 * @param node
 * @param props
 */
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

// 初始化事件
export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
		return;
	}

	if (__DEV__) {
		console.log('初始化事件：', eventType);
	}

	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

/**
 * 创建合成事件
 */
function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;

	// 阻止事件传递
	syntheticEvent.__stopPropagation = false;

	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;

		if (originStopPropagation) {
			originStopPropagation();
		}
	};

	return syntheticEvent;
}

// 触发事件 统一派发
function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target;

	if (targetElement === null) {
		console.warn('事件不存在target', e);

		return;
	}

	// 1. 收集沿途的事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);

	// 2. 创建合成事件
	const se = createSyntheticEvent(e);

	// 3. 遍历captue 捕获阶段的事件 onclickCapture
	triggerEventFlow(capture, se);

	if (!se.__stopPropagation) {
		// 4. 遍历bubble 冒泡阶段的事件 onclick
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];

		callback.call(null, se);

		// 阻止事件继续传播
		if (se.__stopPropagation) {
			break;
		}
	}
}

// 获取事件的回调名
function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		// 收集

		const elementProps = targetElement[elementPropsKey];

		if (elementProps) {
			// click -> onClick onClickCapture

			const callbackNameList = getEventCallbackNameFromEventType(eventType);

			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];

					if (eventCallback) {
						if (i === 0) {
							// capture, 这里是反向插入（从上往下）
							paths.capture.unshift(eventCallback);
						} else {
							// bubble, 这里是同步插入（从下去上），这样就可以保证顺序了
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}

		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
}
