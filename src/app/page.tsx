import { Hero } from '@/components/landing/hero';
import { FeaturedDesigns } from '@/components/landing/featured-designs';
import { PopularCategories } from '@/components/landing/popular-categories';
import { Testimonials } from '@/components/landing/testimonials';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturedDesigns />
        <PopularCategories />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
