import React from 'react';

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<Record<string, unknown>>, State> {
	constructor(props: React.PropsWithChildren<Record<string, unknown>>) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: unknown) {
		// Log to console for now and keep `info` typed safely
		// TODO: send to external monitoring
		console.error(error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center p-6">
					<div className="max-w-xl text-center">
						<h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
						<p className="text-sm text-muted-foreground mb-4">An unexpected error occurred. Please try refreshing the page.</p>
						<details className="text-xs whitespace-pre-wrap text-left p-3 bg-muted rounded">
							{String(this.state.error)}
						</details>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}
