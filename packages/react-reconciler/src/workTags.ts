/**
 * 对应FiberNode 是什么类型的节点
 */

// 暴露出总的类型
export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

export const FunctionComponent = 0;
// 项目挂载根节点 就是 ReactDOM.render()
export const HostRoot = 3;
// 比如<div>标签
export const HostComponent = 5;
// 文本
export const HostText = 6;
