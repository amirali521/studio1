
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mic, Image as ImageIcon, Send, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { autofillProductDetails } from '@/ai/flows/autofill-product-details';
import { useDashboardActions } from '@/contexts/dashboard-actions-context';

export type AutofillData = {
  name: string;
  description: string;
  quantity: number;
  price: number;
  purchasePrice: number;
};

interface AutofillDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AutofillDialog({ isOpen, onClose }: AutofillDialogProps) {
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMultipleProducts } = useDashboardActions();


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };
          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            // In a real app, you'd send this to a speech-to-text service.
            // For this demo, we'll just show a toast.
            toast({ title: "Recording finished", description: "Speech-to-text not implemented in this demo."});
            audioChunksRef.current = [];
            setIsRecording(false);
             stream.getTracks().forEach(track => track.stop());
          };
          audioChunksRef.current = [];
          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error("Mic access error:", err);
          toast({ variant: 'destructive', title: "Microphone Error", description: "Could not access microphone."})
        });
    }
  };

  const handleSubmit = async () => {
    if (!textInput && !imageInput) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please provide a description or an image.' });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await autofillProductDetails({
        textInput: textInput || undefined,
        imageDataUri: imageInput || undefined,
      });

      if (result.products && result.products.length > 0) {
        addMultipleProducts(result.products);
        toast({
          title: `AI Complete`,
          description: `${result.products.length} product(s) have been added to your inventory.`,
        });
        onClose();
      } else {
        toast({ variant: 'destructive', title: 'No Products Found', description: 'The AI could not identify any products from your input.' });
      }
    } catch (error) {
      console.error("Autofill error:", error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'An unexpected error occurred.' });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
       if (mediaRecorderRef.current?.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
       }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Auto-fill with AI</DialogTitle>
          <DialogDescription>
            Describe the product(s) you want to add using text, your voice, or an image of handwritten notes.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="py-4">
            <Textarea
              placeholder="e.g., '30 t-shirts, size L, blue, bought for $5 each, selling for $15'"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={5}
            />
          </TabsContent>
          <TabsContent value="voice" className="py-4 flex flex-col items-center justify-center space-y-4 min-h-[140px]">
             <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
                className="h-16 w-16 rounded-full"
                onClick={handleMicClick}
              >
                {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <p className="text-sm text-muted-foreground">{isRecording ? 'Recording... Click to stop.' : 'Click to start recording.'}</p>
          </TabsContent>
          <TabsContent value="image" className="py-4 flex flex-col items-center justify-center space-y-4 min-h-[140px]">
             <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            {imageInput ? (
                <div className="relative">
                    <img src={imageInput} alt="Preview" className="max-h-32 rounded-md border" />
                     <Button variant="destructive" size="sm" className="absolute -top-2 -right-2" onClick={() => setImageInput(null)}>Clear</Button>
                </div>
            ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2" /> Upload Handwriting
                </Button>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
            Auto-fill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
