
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Chat with Support</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] flex flex-col">
            <ChatInterface chatPartnerId={adminId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
