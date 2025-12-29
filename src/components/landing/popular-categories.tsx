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
              href={`/shop?category=${category.description}`}
              className="group text-center flex flex-col items-center p-4 rounded-3xl transition-all duration-300 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-xl hover:-translate-y-1"
              prefetch={false}
            >
              <div className="relative overflow-hidden rounded-2xl w-full aspect-square shadow-sm">
                <Image
                  src={category.imageUrl}
                  alt={category.description}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={category.imageHint}
                />
              </div>
              <h3 className="mt-4 font-medium text-lg text-gray-800">{category.description}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
