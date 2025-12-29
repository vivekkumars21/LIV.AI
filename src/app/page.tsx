'use client';

import { Hero } from '@/components/landing/hero';
import { FeaturedDesigns } from '@/components/landing/featured-designs';
import { PopularCategories } from '@/components/landing/popular-categories';
import { Testimonials } from '@/components/landing/testimonials';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Don't render anything while redirecting
  }

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
