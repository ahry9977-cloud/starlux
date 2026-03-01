import React, { Component, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // ✅ تصفية أخطاء removeChild غير الحرجة
    // هذه الأخطاء عادة تحدث بسبب race conditions في الروتينج
    // ولا تحتاج إلى عرض صفحة خطأ للمستخدم
    if (
      error.message?.includes("removeChild") ||
      error.message?.includes("Failed to execute 'removeChild'") ||
      error.message?.includes("The node to be removed is not a child")
    ) {
      console.warn("[ErrorBoundary] Non-critical DOM error (ignored):", error.message);
      return { hasError: false, error: null };
    }

    // أخطاء حقيقية تحتاج إلى عرض
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل الأخطاء الحقيقية فقط
    if (
      !error.message?.includes("removeChild") &&
      !error.message?.includes("Failed to execute 'removeChild'") &&
      !error.message?.includes("The node to be removed is not a child")
    ) {
      console.error("[Error Boundary] Caught error:", error);
      console.error("[Error Boundary] Error info:", errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4 font-semibold">حدث خطأ غير متوقع</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-48">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces break-words">
                {this.state.error?.stack || this.state.error?.message}
              </pre>
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer transition-opacity"
              )}
            >
              <RotateCcw size={16} />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// مكون للأخطاء الصغيرة داخل الصفحات
export function InlineError({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
      <p className="text-red-300 text-sm mb-3">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-3 py-1 text-sm border border-red-500/30 text-red-300 hover:bg-red-500/10 rounded"
        >
          <RotateCcw className="w-3 h-3 inline ml-1" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// مكون للتحميل مع timeout
export function LoadingWithTimeout({ 
  timeout = 10000,
  onTimeout,
  message = 'جاري التحميل...'
}: { 
  timeout?: number;
  onTimeout?: () => void;
  message?: string;
}) {
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (timedOut) {
    return (
      <InlineError 
        message="استغرق التحميل وقتاً طويلاً. يرجى المحاولة مرة أخرى."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/70 text-sm">{message}</p>
      </div>
    </div>
  );
}

