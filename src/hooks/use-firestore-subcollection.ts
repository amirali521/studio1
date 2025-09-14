
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  DocumentReference,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useFirestoreSubcollection<T extends { id?: string }>(
  path: string | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
        setData([]);
        setLoading(false);
        return;
    }

    const collectionRef = collection(db, path);
    const q = query(collectionRef, orderBy("timestamp", "asc"));

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
        console.error(`Error fetching subcollection at ${path}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  const addItem = async (item: Omit<T, "id">) => {
    if (!path) throw new Error("Subcollection path is not defined");
    const collectionRef = collection(db, path);
    return await addDoc(collectionRef, item);
  };

  return { data, loading, addItem };
}
