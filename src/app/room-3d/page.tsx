"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import to prevent SSR for Three.js
const Room3DViewer = dynamic(
  () => import("@/components/features/room-3d").then((mod) => mod.Room3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <h2 className="text-xl font-semibold text-foreground">Loading 3D Engine...</h2>
          <p className="mt-2 text-sm text-muted-foreground">Initializing WebGL renderer and scene</p>
        </div>
      </div>
    ),
  }
);

class Room3DErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="max-w-lg rounded-3xl border border-red-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">3D Engine Error</h2>
            <p className="mt-3 text-sm text-muted-foreground">{this.state.errorMessage}</p>
            <div className="mt-6 space-y-2 rounded-2xl bg-gray-50 p-4 text-left text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Troubleshooting:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Enable <strong>hardware acceleration</strong> in browser settings</li>
                <li>Update your graphics drivers</li>
                <li>Try a different browser (Chrome, Edge, or Firefox)</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Room3DPage() {
  return (
    <Room3DErrorBoundary>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-background">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        }
      >
        <Room3DViewer />
      </Suspense>
    </Room3DErrorBoundary>
  );
}
