
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ChatInterface from "./chat-interface";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { deleteSubcollection } from "@/lib/firebase-utils";
import { useToast } from "@/hooks/use-toast";


interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
}

export default function ChatDialog({ isOpen, onClose, adminId }: ChatDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClearChat = async () => {
    if (!user) return;
    try {
        await deleteSubcollection(`chats/${user.uid}/messages`);
        toast({ title: "Chat Cleared", description: "Your conversation history with support has been deleted." });
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not clear chat history." });
        console.error(e);
    }
  }

  if (!adminId) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[80vh] max-h-[700px]">
        <DialogHeader className="p-6 pb-4 flex flex-row justify-between items-start">
          <div className="space-y-1.5">
            <DialogTitle className="font-headline">Chat with Support</DialogTitle>
            <DialogDescription>
              Have a question? We're here to help.
            </DialogDescription>
          </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <XCircle className="h-5 w-5 text-destructive" />
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This will permanently delete your conversation with support. This action cannot be undone.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearChat} variant="destructive">Clear History</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
               <ChatInterface chatPartnerId={adminId} isGroup={false} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
