
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, writeBatch, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';
import { Button } from '@/components/ui/button';
import { GroupInvitation } from '@/lib/types';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const invitationsRef = collection(db, 'users', user.uid, 'groupInvitations');
    const q = query(invitationsRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const invitation = { id: change.doc.id, ...change.doc.data() } as GroupInvitation;
          
          toast({
            title: 'New Group Invitation',
            description: `${invitation.inviterName || 'A user'} invited you to join "${invitation.groupName}".`,
            duration: Infinity, // Keep toast until user interacts
            action: (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleInvitationResponse(invitation, true)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleInvitationResponse(invitation, false)}>
                  Decline
                </Button>
              </div>
            ),
          });
        }
      });
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleInvitationResponse = async (invitation: GroupInvitation, accept: boolean) => {
    if (!user) return;

    const batch = writeBatch(db);
    const status = accept ? 'accepted' : 'declined';

    // Update the invitation status
    const invitationRef = doc(db, 'users', user.uid, 'groupInvitations', invitation.id);
    batch.update(invitationRef, { status });

    if (accept) {
      // Add user to the group's members list
      const groupRef = doc(db, 'groupChats', invitation.groupId);
      batch.update(groupRef, { 
        members: arrayUnion(user.uid),
        // Add member info if it's not there
        [`memberInfo.${user.uid}`]: {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
        }
      });
    }

    try {
      await batch.commit();
      toast({
        title: `Invitation ${status}`,
      });
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process your response.',
      });
    }
  };
}
