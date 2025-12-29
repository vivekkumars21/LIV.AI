import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ARPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">AR Experience</h1>
        <p className="text-muted-foreground text-lg">
          Our Augmented Reality features are currently optimized for mobile devices.
          Please access this page on your phone to visualize furniture in your space.
        </p>
        <div className="p-8 bg-muted rounded-xl border-2 border-dashed">
          <p className="font-mono text-sm">AR Module Loading...</p>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
