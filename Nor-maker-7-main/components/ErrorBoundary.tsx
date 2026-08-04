import * as React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): React.ComponentState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">حدث خطأ غير متوقع</h2>
            <p className="text-zinc-400 mb-6">
              عذراً، واجه التطبيق مشكلة أثناء عرض هذا الجزء. قد يكون ذلك بسبب تلف في بيانات المشروع أو عدم توافق مع هذا الإصدار.
            </p>
            <div className="bg-black p-4 rounded text-left overflow-auto max-h-40 mb-6 font-mono text-xs text-red-400">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
