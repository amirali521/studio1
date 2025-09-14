
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
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline">Chat with Support</DialogTitle>
          <DialogDescription>
            Have a question? We're here to help.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] flex flex-col px-6 pb-6">
            <ChatInterface chatPartnerId={adminId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
