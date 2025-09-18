
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import LoadingScreen from "../layout/loading-screen";
import ChatInterface from "../chat/chat-interface";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { AppUser } from "@/lib/types";

export default function AdminChatClient() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
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
    <div className="flex flex-col flex-1">
        <div className="mb-4">
            <Button variant="outline" onClick={() => router.push('/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Button>
        </div>
        <Card className="flex-1 flex flex-col max-h-[70vh]">
            <CardHeader>
                <CardTitle className="font-headline">Chat with {chatPartner.displayName || "User"}</CardTitle>
                <CardDescription>
                    You are viewing the conversation with {chatPartner.email}.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                 <ChatInterface chatPartnerId={chatUserId} />
            </CardContent>
        </Card>

    </div>
  );
}
