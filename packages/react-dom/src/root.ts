import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from './hostConfig';
import { initEvent } from './SyntheticEvent';

// ReactDOM.creatRoot(root).render(<App/>)
export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
