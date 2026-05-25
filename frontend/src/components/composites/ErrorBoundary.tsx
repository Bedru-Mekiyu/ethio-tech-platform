import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { captureException } from "@/lib/monitoring";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, {
      componentStack: errorInfo.componentStack ?? "unknown",
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              An unexpected error occurred. You can try refreshing the page or
              going back.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-[var(--bg-base)] p-3 text-left text-xs text-danger">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={this.handleReset}>
                Try again
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
