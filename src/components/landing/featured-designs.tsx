import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const featuredDesigns = PlaceHolderImages.filter(img =>
  ['featured-living-room', 'featured-bedroom', 'featured-dining-room'].includes(img.id)
);

export function FeaturedDesigns() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center">Featured Designs</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredDesigns.map(design => (
            <div key={design.id} className="group overflow-hidden rounded-lg">
              <Link href="/ar" className="block" prefetch={false}>
                <Image
                  src={design.imageUrl}
                  alt={design.description}
                  width={400}
                  height={300}
                  className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={design.imageHint}
                />
                <div className="p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg">{design.description}</h3>
                  <p className="text-sm text-gray-500 mt-1">{design.subtext}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/ar"
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            prefetch={false}
          >
            View All Designs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
