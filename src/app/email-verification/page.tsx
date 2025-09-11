
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function EmailVerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
        router.push("/login");
        return;
    }
    
    if (user && user.emailVerified) {
      router.push("/dashboard");
    }

    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          router.push("/dashboard");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, router, authLoading]);

  const handleResendEmail = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not logged in.",
      });
      return;
    }

    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox (and spam folder).",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || !user || user.emailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
            </div>
          <CardTitle className="mt-4 font-headline text-2xl">
            Confirm Your Email
          </CardTitle>
          <CardDescription>
            We've sent a verification link to{" "}
            <span className="font-semibold text-foreground">{user.email}</span>.
            Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page will automatically redirect once your email is confirmed.
          </p>
          <Button
            onClick={handleResendEmail}
            disabled={isSending}
            className="w-full"
          >
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </Button>
           <Button variant="outline" onClick={() => auth.signOut()}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
