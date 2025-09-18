
"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import { type ChatMessage, type Friend } from "@/lib/types";
import { User } from "firebase/auth";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface CommunityChatPopoverProps {
  friend: Friend;
  currentUser: User;
  children: React.ReactNode;
  onOpenChange: (isOpen: boolean) => void;
}

export default function CommunityChatPopover({
  friend,
  currentUser,
  children,
  onOpenChange,
}: CommunityChatPopoverProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousMessagesCount = useRef(0);

  const chatId = useMemo(() => {
    return [currentUser.uid, friend.id].sort().join("_");
  }, [currentUser.uid, friend.id]);

  const {
    data: messages,
    addItem: addMessage,
    loading: messagesLoading,
  } = useFirestoreSubcollection<ChatMessage>(
    chatId ? `chats/${chatId}/messages` : null
  );
  
  // Effect for scrolling to the bottom of the chat
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Effect for new message notifications
  useEffect(() => {
    const currentMessagesCount = messages.length;
    if (currentMessagesCount > 0 && currentMessagesCount > previousMessagesCount.current) {
        const lastMessage = messages[currentMessagesCount - 1];
        if (lastMessage && lastMessage.senderId !== currentUser.uid) {
            toast({
                title: `New message from ${friend.displayName}`,
                description: lastMessage.text,
            })
        }
    }
    previousMessagesCount.current = currentMessagesCount;

  }, [messages, currentUser.uid, friend.displayName, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData: Omit<ChatMessage, "id"> = {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: new Date().toISOString(),
    };

    try {
      await addMessage(messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      });
    }
  };
  
   const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col h-[50vh] bg-background rounded-lg">
          <div className="flex items-center justify-between p-3 border-b">
             <div className="flex items-center gap-2">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={friend.photoURL || undefined} />
                    <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm">{friend.displayName}</p>
             </div>
             <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <X className="h-4 w-4"/>
                </Button>
            </PopoverTrigger>
          </div>
          <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
             {messagesLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                {messages.map((msg) => {
                    const isSender = msg.senderId === currentUser.uid;
                    return (
                    <div
                        key={msg.id}
                        className={cn(
                        "flex items-end gap-3",
                        isSender ? "justify-end" : "justify-start"
                        )}
                    >
                        {!isSender && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.photoURL || undefined} />
                            <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                        </Avatar>
                        )}
                        <div
                        className={cn(
                            "max-w-[80%] p-3 rounded-lg flex flex-col",
                            isSender
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-secondary text-secondary-foreground rounded-bl-none"
                        )}
                        >
                        <p className="text-sm break-words">{msg.text}</p>
                        <p
                            className={cn(
                            "text-xs mt-2 self-end",
                            isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                        >
                            {formatDistanceToNow(new Date(msg.timestamp), {
                            addSuffix: true,
                            })}
                        </p>
                        </div>
                        {isSender && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={currentUser.photoURL || undefined} />
                            <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
                        </Avatar>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
          </ScrollArea>
          <div className="p-4 bg-background/80 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send />
              </Button>
            </form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
