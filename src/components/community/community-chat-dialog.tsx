
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import ChatInterface from "../chat/chat-interface";
import { Users, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";


interface CommunityChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string | null;
  isGroup: boolean;
  currentUser: User;
  photoURL?: string | null;
  onLeaveGroup?: (groupId: string) => void;
}

export default function CommunityChatDialog({
  isOpen,
  onClose,
  chatId,
  chatName,
  isGroup,
  currentUser,
  photoURL,
  onLeaveGroup,
}: CommunityChatDialogProps) {

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={photoURL || undefined} />
              <AvatarFallback>
                  {isGroup ? <Users className="h-4 w-4"/> : getInitials(chatName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="font-headline text-left">{chatName}</DialogTitle>
              <DialogDescription className="text-left">
                {isGroup ? "Group conversation" : `Chatting with ${chatName}`}
              </DialogDescription>
            </div>
          </div>
          {isGroup && onLeaveGroup && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave the group "{chatName}"? You will need to be invited again to rejoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => onLeaveGroup(chatId)}
                    >
                      Leave
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          )}
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
