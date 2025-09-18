
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";

export function useFirestoreUserSubcollection<T extends { id?: string }>(
  subcollectionName: string
) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) {
        setLoading(false);
        setData([]);
      }
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const subcollectionRef = collection(userDocRef, subcollectionName);
    
    // Fallback query without ordering
    let q = query(subcollectionRef);

    // Try to order by createdAt if it's likely to exist (e.g., for requests)
    if (subcollectionName === 'friendRequests') {
      q = query(subcollectionRef, orderBy("createdAt", "desc"));
    }
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${subcollectionName} with ordering:`, error);
        // Fallback to fetching without ordering if the ordered query fails
        const fallbackUnsubscribe = onSnapshot(subcollectionRef, (qs) => {
             const items = qs.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as T[];
            setData(items);
            setLoading(false);
        }, (fallBackError) => {
            console.error(`Fallback fetch for ${subcollectionName} failed:`, fallBackError);
            setLoading(false);
        });
        return () => fallbackUnsubscribe();
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, subcollectionName]);

  return { data, loading };
}
