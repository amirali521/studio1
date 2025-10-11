
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ProductForm from "./product-form";
import type { Product } from "@/lib/types";
import { AutofillData } from "./autofill-dialog";
import { ScrollArea } from "../ui/scroll-area";


interface ResponsiveProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: any) => void;
  isEditing?: boolean;
  initialData?: (Product | AutofillData) | null;
}

export default function ResponsiveProductDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isEditing = false,
  initialData = null,
}: ResponsiveProductDialogProps) {
  const isMobile = useIsMobile();
  const title = isEditing ? `Edit ${initialData?.name || 'Product'}` : "Add New Product";

  const form = (
    <ProductForm
      onSubmit={onSubmit}
      onCancel={() => onOpenChange(false)}
      isEditing={isEditing}
      initialData={initialData || undefined}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-headline">{title}</DrawerTitle>
          </DrawerHeader>
           <ScrollArea className="max-h-[80vh] overflow-y-auto">
              <div className="p-4 pt-0">{form}</div>
           </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          {form}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
