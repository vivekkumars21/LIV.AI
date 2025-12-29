import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const categories = PlaceHolderImages.filter(img => img.id.startsWith('category-'));

export function PopularCategories() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center">
          Popular Furniture Categories
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map(category => (
            <Link
              key={category.id}
              href="/ar"
              className="group text-center"
              prefetch={false}
            >
              <div className="overflow-hidden rounded-lg">
                <Image
                  src={category.imageUrl}
                  alt={category.description}
                  width={200}
                  height={200}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={category.imageHint}
                />
              </div>
              <h3 className="mt-4 font-medium">{category.description}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
