
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, syncUserToFirestore, firebaseConfig } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import LoadingScreen from '@/components/layout/loading-screen';

interface AppUser extends User {
    isAdmin?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

const PROTECTED_ROUTES = ['/dashboard', '/sales', '/analytics', '/barcodes', '/products', '/returns', '/settings', '/admin'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password'];
const VERIFICATION_ROUTE = '/email-verification';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserToFirestore(firebaseUser);
        
        const adminStatus = firebaseUser.uid === firebaseConfig.adminUid;

        const appUser: AppUser = {
            ...firebaseUser,
            isAdmin: adminStatus,
        };
        
        setUser(appUser);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isVerificationRoute = pathname === VERIFICATION_ROUTE;

    if (!user && isProtectedRoute) {
      router.push('/login');
      return;
    }
    
    if (user) {
        if (!user.emailVerified) {
            if (!isVerificationRoute) {
                router.push(VERIFICATION_ROUTE);
            }
        } else {
             if (isPublicRoute || isVerificationRoute) {
                router.push('/dashboard');
            }
        }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <LoadingScreen />;
  }
  
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (!user && isProtectedRoute) {
     return <LoadingScreen />;
  }

  if (user && !user.emailVerified && pathname !== VERIFICATION_ROUTE) {
     return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
