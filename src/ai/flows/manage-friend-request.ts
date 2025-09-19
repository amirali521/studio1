'use server';

/**
 * @fileOverview Manages friend request actions like accepting or declining.
 *
 * This file defines a Genkit flow that handles the logic for a user
 * responding to a friend request. It ensures that all database
 * operations are handled securely on the server.
 *
 * - `manageFriendRequest`: Accepts or declines a friend request.
 * - `ManageFriendRequestInput`: The input type for the manageFriendRequest function.
 * - `ManageFriendRequestOutput`: The return type for the manageFriendRequest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, writeBatch } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if it hasn't been already
if (getApps().length === 0) {
  initializeApp();
}

const ManageFriendRequestInputSchema = z.object({
  action: z.enum(['accept', 'decline']),
  currentUserId: z.string().describe('The ID of the user performing the action.'),
  senderId: z.string().describe('The ID of the user who sent the request.'),
  currentUserProfile: z.object({
    displayName: z.string().nullable(),
    email: z.string().nullable(),
    photoURL: z.string().nullable(),
  }),
  senderProfile: z.object({
    displayName: z.string().nullable(),
    email: z.string().nullable(),
    photoURL: z.string().nullable(),
  }),
});
export type ManageFriendRequestInput = z.infer<typeof ManageFriendRequestInputSchema>;

const ManageFriendRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ManageFriendRequestOutput = z.infer<typeof ManageFriendRequestOutputSchema>;

export async function manageFriendRequest(input: ManageFriendRequestInput): Promise<ManageFriendRequestOutput> {
  return manageFriendRequestFlow(input);
}

const manageFriendRequestFlow = ai.defineFlow(
  {
    name: 'manageFriendRequestFlow',
    inputSchema: ManageFriendRequestInputSchema,
    outputSchema: ManageFriendRequestOutputSchema,
  },
  async (input) => {
    const db = getFirestore();
    const batch = writeBatch(db);
    const { action, currentUserId, senderId, currentUserProfile, senderProfile } = input;

    try {
      // 1. Delete the friend requests from both users' subcollections
      const currentUserRequestRef = doc(db, 'users', currentUserId, 'friendRequests', senderId);
      const senderRequestRef = doc(db, 'users', senderId, 'friendRequests', currentUserId);
      batch.delete(currentUserRequestRef);
      batch.delete(senderRequestRef);

      // 2. If the request is accepted, create friend documents for both users
      if (action === 'accept') {
        const timestamp = new Date().toISOString();

        // Add sender to current user's friend list
        const currentUserFriendRef = doc(db, 'users', currentUserId, 'friends', senderId);
        batch.set(currentUserFriendRef, {
          displayName: senderProfile.displayName,
          email: senderProfile.email,
          photoURL: senderProfile.photoURL,
          addedAt: timestamp,
        });

        // Add current user to sender's friend list
        const senderFriendRef = doc(db, 'users', senderId, 'friends', currentUserId);
        batch.set(senderFriendRef, {
          displayName: currentUserProfile.displayName,
          email: currentUserProfile.email,
          photoURL: currentUserProfile.photoURL,
          addedAt: timestamp,
        });
      }

      await batch.commit();
      
      return {
        success: true,
        message: `Friend request successfully ${action === 'accept' ? 'accepted' : 'declined'}.`,
      };
    } catch (error: any) {
      console.error('Error in manageFriendRequestFlow:', error);
      // In case of an error, it's better to return a structured error response
      return {
        success: false,
        message: 'An error occurred while processing the request.',
      };
    }
  }
);
