import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

export function Hero() {
  return (
    <section className="relative h-[600px] w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
        <h1 className="text-4xl font-light tracking-tight sm:text-5xl md:text-6xl max-w-4xl">
          Transform Your Space with AI
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/90 font-light leading-relaxed">
          IntraKart brings professional interior design to your fingertips.
          Upload a photo, analyze your room, and visualize new furniture in seconds.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/room-analyzer">Analyze My Room</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/ar">Try AR View</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
