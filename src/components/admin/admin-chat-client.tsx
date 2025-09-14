
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "../layout/loading-screen";
import ChatInterface from "../chat/chat-interface";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function AdminChatClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatUserId = params.userId as string;

  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <LoadingScreen />;
  }
  
  if (!chatUserId) {
    return (
        <main className="flex-1 p-6 flex justify-center items-center">
            <p>No user selected for chat.</p>
        </main>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6">
        <Button variant="outline" onClick={() => router.push('/admin')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
        </Button>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Chat with User</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[60vh]">
                     <ChatInterface chatPartnerId={chatUserId} />
                </div>
            </CardContent>
        </Card>

    </main>
  );
}
