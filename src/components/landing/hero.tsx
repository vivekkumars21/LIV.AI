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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          IntraKart: AI + AR Interior Design
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/90">
          Transform your home with intelligent design suggestions. Upload a photo of
          your room and get personalized furniture recommendations based on your space,
          style, and budget. Visualize changes with cutting-edge AR technology.
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
