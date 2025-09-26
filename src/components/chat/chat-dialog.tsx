
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ChatInterface from "./chat-interface";


interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
}

export default function ChatDialog({ isOpen, onClose, adminId }: ChatDialogProps) {

  if (!adminId) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[80vh] max-h-[700px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline">Chat with Support</DialogTitle>
          <DialogDescription>
            Have a question? We're here to help.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-6 pb-2 sm:pb-6">
          <div className="flex-1 flex flex-col min-h-0 bg-secondary/20 rounded-lg">
             <ChatInterface chatPartnerId={adminId} isGroup={false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
