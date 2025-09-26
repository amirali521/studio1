
import { db } from './firebase';
import { collection, query, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Deletes all documents in a subcollection.
 * @param collectionPath The path to the subcollection (e.g., 'chats/chatId/messages').
 */
export async function deleteSubcollection(collectionPath: string) {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef);
  const snapshot = await getDocs(q);

  if (snapshot.size === 0) {
    return; // Nothing to delete
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
