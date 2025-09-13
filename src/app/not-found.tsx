
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary font-headline">404</h1>
        <p className="text-2xl md:text-3xl font-semibold text-foreground mt-4">
          Page Not Found
        </p>
        <p className="mt-4 text-muted-foreground">
          Sorry, the page you are looking for does not exist.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
