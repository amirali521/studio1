
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  getDocs,
  where,
  orderBy,
  addDoc,
  updateDoc
} from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";

export function useFirestoreCollection<T extends { id?: string }>(
  collectionName: string
) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      // Still waiting for auth status to resolve
      return;
    }

    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const dataCollectionRef = collection(userDocRef, collectionName);
    
    // Fallback to ordering by a field that exists on all collections if 'createdAt' is not ideal for all.
    // For this app, 'createdAt' is consistent.
    const q = query(dataCollectionRef, orderBy("createdAt", "desc"));

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
        console.error(`Error fetching ${collectionName}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, collectionName]);

  const addItems = async (items: Omit<T, "id" | "createdAt">[]) => {
    if (!user) throw new Error("User not authenticated");
    const userDocRef = doc(db, "users", user.uid);
    const dataCollectionRef = collection(userDocRef, collectionName);
    
    const batch = writeBatch(db);
    items.forEach((item) => {
      const newDocRef = doc(dataCollectionRef);
      batch.set(newDocRef, { 
          ...item,
          createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  };
  
  const addItem = async (item: Omit<T, "id" | 'createdAt'> & { createdAt: string }) => {
    if (!user) throw new Error("User not authenticated");
    const userDocRef = doc(db, "users", user.uid);
    const dataCollectionRef = collection(userDocRef, collectionName);
    const docRef = await addDoc(dataCollectionRef, item);
    return docRef;
  };

  const updateItem = async (itemId: string, itemData: Partial<T>) => {
    if (!user) throw new Error("User not authenticated");
    const itemDocRef = doc(db, "users", user.uid, collectionName, itemId);
    await updateDoc(itemDocRef, itemData);
  };
  
  const updateItems = async (updates: { id: string; data: Partial<T> }[]) => {
    if (!user) throw new Error("User not authenticated");
    const batch = writeBatch(db);
    updates.forEach(update => {
       const itemDocRef = doc(db, "users", user.uid, collectionName, update.id);
       batch.update(itemDocRef, update.data);
    });
    await batch.commit();
  }

  const deleteItem = async (itemId: string) => {
    if (!user) throw new Error("User not authenticated");
    const itemDocRef = doc(db, "users", user.uid, collectionName, itemId);
    await deleteDoc(itemDocRef);
  };
  
   const deleteItemsByProduct = async (productId: string) => {
     if (!user) throw new Error("User not authenticated");
     const userDocRef = doc(db, "users", user.uid);
     const dataCollectionRef = collection(userDocRef, collectionName);
     const q = query(dataCollectionRef, where("productId", "==", productId));
     const querySnapshot = await getDocs(q);
     
     if (querySnapshot.empty) {
        return; // Nothing to delete
     }

     const batch = writeBatch(db);
     querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
     });
     await batch.commit();
   }


  return { data, loading, addItem, updateItem, deleteItem, addItems, updateItems, deleteItemsByProduct };
}
