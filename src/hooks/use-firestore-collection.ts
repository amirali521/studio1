
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
} from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const dataCollectionRef = collection(userDocRef, collectionName);
    
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
        console.error("Error fetching collection:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName]);

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
  
  const addItem = async (item: Omit<T, "id" | "createdAt">) => {
    if (!user) throw new Error("User not authenticated");
    const userDocRef = doc(db, "users", user.uid);
    const dataCollectionRef = collection(userDocRef, collectionName);
    await addDoc(dataCollectionRef, { 
        ...item, 
        createdAt: new Date().toISOString()
    });
  };

  const updateItem = async (itemId: string, itemData: Partial<T>) => {
    if (!user) throw new Error("User not authenticated");
    const itemDocRef = doc(db, "users", user.uid, collectionName, itemId);
    await setDoc(itemDocRef, itemData, { merge: true });
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
     const batch = writeBatch(db);
     querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
     });
     await batch.commit();
   }


  return { data, loading, addItem, updateItem, deleteItem, addItems, updateItems, deleteItemsByProduct };
}
