
"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ChatInterface from "../chat/chat-interface";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { AppUser } from "@/lib/types";

interface AdminChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatPartnerId: string;
}

export default function AdminChatDialog({ isOpen, onClose, chatPartnerId }: AdminChatDialogProps) {
  const { data: users, loading: usersLoading } = useFirestoreCollection<AppUser>("users");

  const chatPartner = useMemo(() => {
    return users.find(u => u.id === chatPartnerId);
  }, [users, chatPartnerId]);
  
  if (!chatPartner) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[80vh] max-h-[700px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline">Chat with {chatPartner.displayName || "User"}</DialogTitle>
          <DialogDescription>
            You are viewing the conversation with {chatPartner.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-6 pb-2 sm:pb-6">
          <div className="flex-1 flex flex-col min-h-0 bg-secondary/20 rounded-lg">
             <ChatInterface chatPartnerId={chatPartnerId} isGroup={false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
