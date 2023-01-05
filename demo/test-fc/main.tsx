import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	console.log('%c Line:6 🍇 num', 'color:#ed9ec7', num);
	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>]
			: [<li key="2">2</li>, <li key="1">1</li>];

	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
}

function Child() {
	return <span>big_react</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
