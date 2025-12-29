import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { Heart } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center" prefetch={false}>
            <IntraKartLogo variant="text" size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/room-analyzer" className="hover:text-primary" prefetch={false}>
              Room Analyzer
            </Link>
            <Link href="/ar" className="hover:text-primary" prefetch={false}>
              AR View
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Shop
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Inspiration
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm">
            Sign In
          </Button>
          <Heart className="h-6 w-6 text-muted-foreground" />
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
