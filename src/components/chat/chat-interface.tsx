
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import type { ChatMessage } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { AppUser } from "@/lib/types";

interface ChatInterfaceProps {
    chatPartnerId: string;
}

export default function ChatInterface({ chatPartnerId }: ChatInterfaceProps) {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const viewportRef = useRef<HTMLDivElement>(null);

    const chatId = isAdmin ? chatPartnerId : user?.uid;
    
    // Fetch all users to get display names and avatars
    const { data: users, loading: usersLoading } = useFirestoreCollection<AppUser>("users");

    const { data: messages, loading: messagesLoading, addItem: addMessage } = useFirestoreSubcollection<ChatMessage>(
        `chats/${chatId}/messages`
    );
    
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
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
    
    const getParticipantInfo = (senderId: string) => {
        if (senderId === user?.uid) {
            return {
                displayName: user.displayName || "You",
                photoURL: user.photoURL,
            }
        }
        const participant = users.find(u => u.id === senderId);
        return {
            displayName: participant?.displayName || "User",
            photoURL: participant?.photoURL,
        }
    }
    
    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("");
    };


    const loading = authLoading || messagesLoading || usersLoading;

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!user) return null;

    return (
        <div className="flex flex-col h-full bg-secondary/30 rounded-lg">
            <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
                <div className="space-y-6">
                    {messages.map(msg => {
                        const isSender = msg.senderId === user.uid;
                        const participant = getParticipantInfo(msg.senderId);
                        return (
                             <div key={msg.id} className={cn("flex items-end gap-3", isSender ? "justify-end" : "justify-start")}>
                                {!isSender && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarImage src={participant.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
                                    </Avatar>
                                )}
                               <div className={cn(
                                    "max-w-xs md:max-w-md p-3 rounded-lg flex flex-col",
                                    isSender 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-background text-foreground rounded-bl-none border"
                               )}>
                                   <p className="text-sm">{msg.text}</p>
                                   <p className={cn(
                                       "text-xs mt-2 self-end",
                                       isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                       {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                   </p>
                               </div>
                                {isSender && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarImage src={participant.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })}
                </div>
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
    );
}
