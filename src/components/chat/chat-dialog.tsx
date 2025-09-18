
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

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
}

export default function ChatDialog({ isOpen, onClose, adminId }: ChatDialogProps) {
  if (!adminId) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline">Chat with Support</DialogTitle>
          <DialogDescription>
            Have a question? We're here to help.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] sm:h-[50vh] flex flex-col px-6 pb-6">
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
