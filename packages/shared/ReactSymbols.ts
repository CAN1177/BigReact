// 为了防止滥用react,所以定义为symbol类型 https://zhuanlan.zhihu.com/p/297923315
const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.elememt')
	: 0xeac7;
