import 'react';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'model-viewer': {
				src?: string;
				alt?: string;
				'auto-rotate'?: boolean;
				'camera-controls'?: boolean;
				'shadow-intensity'?: string;
				exposure?: string;
				style?: React.CSSProperties;
				'aria-label'?: string;
			};
		}
	}
}
