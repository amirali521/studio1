
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import type { ChatMessage } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";

interface ChatInterfaceProps {
    chatPartnerId: string;
}

export default function ChatInterface({ chatPartnerId }: ChatInterfaceProps) {
    const { user, loading, isAdmin } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const chatId = isAdmin ? chatPartnerId : user?.uid;

    const { data: messages, loading: messagesLoading, addItem: addMessage } = useFirestoreSubcollection<ChatMessage>(
        `chats/${chatId}/messages`
    );
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const messageData: Omit<ChatMessage, 'id'> = {
            text: newMessage,
            senderId: user.uid,
            timestamp: new Date().toISOString(),
        };

        try {
            await addMessage(messageData);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (loading || messagesLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!user) return null;

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user.uid ? "justify-end" : "justify-start")}>
                           <div className={cn(
                                "max-w-xs md:max-w-md p-3 rounded-lg",
                                msg.senderId === user.uid ? "bg-primary text-primary-foreground" : "bg-muted"
                           )}>
                               <p className="text-sm">{msg.text}</p>
                               <p className={cn(
                                   "text-xs mt-1",
                                   msg.senderId === user.uid ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                   {format(new Date(msg.timestamp), 'h:mm a')}
                               </p>
                           </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send />
                </Button>
            </form>
        </div>
    );
}
