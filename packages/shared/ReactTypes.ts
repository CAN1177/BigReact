// 类型单独定义

export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}

// 创建Update 实例 所需要的类型
export type Action<State> = State | ((prevState: State) => State);
