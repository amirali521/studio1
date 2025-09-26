
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import LoadingScreen from "../layout/loading-screen";
import ChatInterface from "../chat/chat-interface";
import { Button } from "../ui/button";
import { ArrowLeft, Trash2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { AppUser } from "@/lib/types";
import { deleteSubcollection } from "@/lib/firebase-utils";
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
import { useToast } from "@/hooks/use-toast";


export default function AdminChatClient() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const chatUserId = params.userId as string;
  const { data: users, loading: usersLoading } = useFirestoreCollection<AppUser>("users");

  const chatPartner = useMemo(() => {
    return users.find(u => u.id === chatUserId);
  }, [users, chatUserId]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);
  
  const handleClearChat = async () => {
    try {
        await deleteSubcollection(`chats/${chatUserId}/messages`);
        toast({ title: "Chat Cleared", description: "All messages in this conversation have been deleted." });
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not clear chat history." });
        console.error(e);
    }
  }

  if (loading || usersLoading || !isAdmin) {
    return <LoadingScreen />;
  }
  
  if (!chatUserId || !chatPartner) {
    return (
        <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-semibold">User Not Found</h2>
            <p className="text-muted-foreground mt-2">The selected user does not exist.</p>
             <Button variant="outline" onClick={() => router.push('/admin')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full">
        <div className="mb-4 flex justify-between items-center flex-shrink-0">
            <Button variant="outline" onClick={() => router.push('/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Clear Chat
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all messages in this conversation. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChat} variant="destructive">Clear History</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
                <CardTitle className="font-headline">Chat with {chatPartner.displayName || "User"}</CardTitle>
                <CardDescription>
                    You are viewing the conversation with {chatPartner.email}.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                 <ChatInterface chatPartnerId={chatUserId} isGroup={false} />
            </CardContent>
        </Card>
    </div>
  );
}
