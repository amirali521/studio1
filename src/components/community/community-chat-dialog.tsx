
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import ChatInterface from "../chat/chat-interface";
import { Users } from "lucide-react";

interface CommunityChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string | null;
  isGroup: boolean;
  currentUser: User;
  photoURL?: string | null;
}

export default function CommunityChatDialog({
  isOpen,
  onClose,
  chatId,
  chatName,
  isGroup,
  currentUser,
  photoURL,
}: CommunityChatDialogProps) {

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline flex items-center gap-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src={photoURL || undefined} />
                <AvatarFallback>
                    {isGroup ? <Users className="h-4 w-4"/> : getInitials(chatName)}
                </AvatarFallback>
            </Avatar>
            {chatName}
          </DialogTitle>
          <DialogDescription>
            {isGroup ? "You are in a group conversation." : `You are now chatting directly with ${chatName}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[50vh] flex flex-col px-6 pb-6">
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <ChatInterface chatPartnerId={chatId} isGroup={isGroup} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
