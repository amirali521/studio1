
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import type { Product, SerializedProductItem } from "@/lib/types";
import { BarcodeDisplay } from "@/components/barcodes/barcode";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import AppHeader from "@/components/layout/app-header";
import UserProfile from "@/components/layout/user-profile";
import { useAuth } from "@/contexts/auth-context";

export default function ProductQRCodesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params.productId as string;

  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!productsLoading) {
      const foundProduct = products.find(p => p.id === productId);
      setProduct(foundProduct || null);
    }
  }, [productId, products, productsLoading]);

  const productItems = useMemo(() => {
    return serializedItems.filter(item => item.productId === productId);
  }, [productId, serializedItems]);

  const handlePrint = () => {
    window.print();
  };
  
  const loading = productsLoading || itemsLoading || !user;
  
  if (loading) {
    return (
      <>
        <AppHeader title="Loading QR Codes...">
          <UserProfile />
        </AppHeader>
        <main className="flex-1 p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  if (!product) {
     return (
      <>
        <AppHeader title="Product Not Found">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft />
            </Button>
        </AppHeader>
        <main className="flex-1 p-6 flex justify-center items-center">
            <p>The product you are looking for does not exist.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title={`QR Codes for ${product.name}`}>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4"/>
              <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
          <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4"/>
              <span className="hidden sm:inline">Print All</span>
          </Button>
        <UserProfile />
      </AppHeader>
       <main className="flex-1 p-1 sm:p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {productItems.map((item) => (
              <BarcodeDisplay 
                key={item.id} 
                item={{
                  serialNumber: item.serialNumber,
                  uid: user.uid
                }}
                productName={product.name}
              />
            ))}
          </div>
        </main>
        <style jsx global>{`
            @media print {
            body * {
                visibility: hidden;
            }
            main, main * {
                visibility: visible;
            }
            main {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            }
        `}</style>
    </>
  );
}
