"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  elementId: string;
  onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
    if (this.props.onCatch) {
      this.props.onCatch(error, errorInfo);
    }
    
    // Log to our internal audit system (Imperative Live Mode)
    fetch("/api/audit/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        elementId: this.props.elementId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }),
    }).catch(console.error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-lg flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="text-red-500" size={24} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Render Crash Detected</p>
            <p className="text-sm text-zinc-300 font-mono break-all">{this.state.error?.message}</p>
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors"
          >
            <RefreshCcw size={14} />
            Reset Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
