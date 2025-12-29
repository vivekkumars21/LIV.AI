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
            <div key={design.id} className="group overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <Link href="/shop" className="block" prefetch={false}>
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={design.imageUrl}
                    alt={design.description}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint={design.imageHint}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-xl mb-2">{design.description}</h3>
                  <p className="text-sm text-gray-600">{design.subtext}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/shop"
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
