import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Box, Camera } from 'lucide-react';

export default function ARPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-20 top-20 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="max-w-lg space-y-6 rounded-3xl border border-white/20 bg-white/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-white/20">          <Box className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">AR & 3D Experience</h1>
        <p className="text-muted-foreground text-lg">
          Explore your room in an immersive 3D walkthrough. Upload a photo to reconstruct
          your space, walk inside it, and place furniture with realistic scaling.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            <Link href="/room-3d">
              <Camera className="mr-2 h-5 w-5" />
              Launch 3D Walkthrough
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-4">
          Works on desktop and mobile · WebGL required · Best on Chrome or Edge
        </p>
      </div>
    </div>
  );
}
