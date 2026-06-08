import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { captureException } from "@/lib/monitoring";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff, LogOut } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function classifyError(error: Error): "chunk" | "network" | "session" | "generic" {
  if (
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("dynamically imported")
  ) {
    return "chunk";
  }
  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("Network request failed") ||
    error.message.includes("network")
  ) {
    return "network";
  }
  if (
    error.message.includes("401") ||
    error.message.includes("Session expired") ||
    error.message.includes("Unauthorized")
  ) {
    return "session";
  }
  return "generic";
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

  handleReload = () => {
    window.location.reload();
  };

  handleLogin = () => {
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const kind = error ? classifyError(error) : "generic";

      if (kind === "chunk") {
        return (
          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <RefreshCw size={24} />
              </div>
              <h2 className="text-xl font-semibold text-white">Update available</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                A new version of the application was deployed. Please reload to continue.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={this.handleReload}>
                  <RefreshCw size={15} className="mr-1.5" />
                  Reload
                </Button>
              </div>
            </div>
          </div>
        );
      }

      if (kind === "network") {
        return (
          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <WifiOff size={24} />
              </div>
              <h2 className="text-xl font-semibold text-white">Connection issue</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                A network error occurred. Check your connection and try again.
              </p>
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

      if (kind === "session") {
        return (
          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
                <LogOut size={24} />
              </div>
              <h2 className="text-xl font-semibold text-white">Session expired</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Your session has expired. Please sign in again.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={this.handleLogin}>
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        );
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
            {import.meta.env.DEV && error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-[var(--bg-base)] p-3 text-left text-xs text-danger">
                {error.message}
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
