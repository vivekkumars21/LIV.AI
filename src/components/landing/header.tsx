'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { Heart, LogOut, User as UserIcon, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartSheet } from '@/components/features/shop/cart-sheet';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
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
            <Link href="/shop" className="hover:text-primary" prefetch={false}>
              Shop
            </Link>
            <Link href="#" className="hover:text-primary" prefetch={false}>
              Inspiration
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <CartSheet />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Heart className="h-5 w-5" strokeWidth={1.5} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user.photoURL || undefined} alt="User" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email ? user.email[0].toUpperCase() : <UserIcon className="h-4 w-4" strokeWidth={1.5} />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
