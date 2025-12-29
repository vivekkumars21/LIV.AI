import Link from 'next/link';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { Twitter, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center mb-8">
          <IntraKartLogo variant="text" size="lg" />
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            Transforming homes with AI-powered design recommendations and AR visualization technology.
          </p>
        </div>
        <div className="flex flex-col items-center justify-between md:flex-row">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start mb-6 md:mb-0 text-sm font-medium text-gray-500">
            <Link href="#" className="hover:text-primary" prefetch={false}>
              About Us
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Contact
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Terms of Service
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              aria-label="Twitter"
              className="text-gray-400 hover:text-primary"
              prefetch={false}
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="Instagram"
              className="text-gray-400 hover:text-primary"
              prefetch={false}
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="Facebook"
              className="text-gray-400 hover:text-primary"
              prefetch={false}
            >
              <Facebook className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-gray-400">
          &copy; 2024 IntraKart. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
