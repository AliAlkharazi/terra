import React from 'react';

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError?: (error: Error) => void;
}
interface State { hasError: boolean; }

export class Scene3DBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.warn('[Terra] 3D scene failed, falling back to flat view:', error.message);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
