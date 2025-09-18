
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import { type ChatMessage, type Friend } from "@/lib/types";
import { User } from "firebase/auth";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import ChatInterface from "../chat/chat-interface";

interface CommunityChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend;
  currentUser: User;
}

export default function CommunityChatDialog({
  isOpen,
  onClose,
  friend,
  currentUser,
}: CommunityChatDialogProps) {
  const { toast } = useToast();
  const previousMessagesCount = useRef(0);

  const chatId = useMemo(() => {
    return [currentUser.uid, friend.id].sort().join("_");
  }, [currentUser.uid, friend.id]);

  const { data: messages } = useFirestoreSubcollection<ChatMessage>(
    chatId ? `chats/${chatId}/messages` : null
  );

  // Effect for new message notifications
  useEffect(() => {
    const currentMessagesCount = messages.length;
    if (
      isOpen &&
      currentMessagesCount > 0 &&
      currentMessagesCount > previousMessagesCount.current
    ) {
      const lastMessage = messages[currentMessagesCount - 1];
      if (lastMessage && lastMessage.senderId !== currentUser.uid) {
        toast({
          title: `New message from ${friend.displayName}`,
          description: lastMessage.text,
        });
      }
    }
    previousMessagesCount.current = currentMessagesCount;
  }, [messages, currentUser.uid, friend.displayName, toast, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline flex items-center gap-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src={friend.photoURL || undefined} />
                <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            Chat with {friend.displayName}
          </DialogTitle>
          <DialogDescription>
            You are now chatting directly with {friend.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] flex flex-col px-6 pb-6">
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <ChatInterface chatPartnerId={friend.id} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
