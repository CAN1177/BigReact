// 类型单独定义

export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	key: Key;
	ref: Ref;
	props: Props;
	type: ElementType;
	__mark: string;
}

export type Action<State> = State | ((Private: State) => State);
