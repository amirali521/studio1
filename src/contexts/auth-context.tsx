
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import LoadingScreen from '@/components/layout/loading-screen';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const PROTECTED_ROUTES = ['/dashboard', '/sales', '/analytics', '/barcodes', '/products', '/returns', '/settings'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password'];
const VERIFICATION_ROUTE = '/email-verification';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isVerificationRoute = pathname === VERIFICATION_ROUTE;

    // If no user, and trying to access a protected route, redirect to login
    if (!user && isProtectedRoute) {
      router.push('/login');
      return;
    }
    
    if (user) {
        // If user exists but email is not verified
        if (!user.emailVerified) {
            // and they are not on the verification page, redirect them
            if (!isVerificationRoute) {
                router.push(VERIFICATION_ROUTE);
            }
        } else { // if email is verified
            // and they are on a public or verification page, redirect to dashboard
             if (isPublicRoute || isVerificationRoute) {
                router.push('/dashboard');
            }
        }
    }


  }, [user, loading, pathname, router]);


  if (loading) {
    return <LoadingScreen />;
  }
  
  // To avoid flicker, we only render children if the routing logic is complete
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (!user && isProtectedRoute) {
     return <LoadingScreen />;
  }

  if (user && !user.emailVerified && pathname !== VERIFICATION_ROUTE) {
     return <LoadingScreen />;
  }


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
