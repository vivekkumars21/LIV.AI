"use client";

import { Suspense } from "react";
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

export default function Room3DPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <Room3DViewer />
    </Suspense>
  );
}
