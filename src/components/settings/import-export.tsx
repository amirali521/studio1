
"use client";

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { type Product, type SerializedProductItem, type Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAuth } from '@/contexts/auth-context';

export default function ImportExport() {
  const { user } = useAuth();
  const { data: products, loading: productsLoading, addItems: addProducts } = useFirestoreCollection<Product>('products');
  const { data: serializedItems, loading: itemsLoading, addItems: addSerializedItems } = useFirestoreCollection<SerializedProductItem>('serializedItems');
  const { data: sales, loading: salesLoading, addItems: addSales } = useFirestoreCollection<Sale>('sales');

  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setIsExporting(true);

    const dataToExport = {
      products,
      serializedItems,
      sales,
    };

    const csv = Papa.unparse(JSON.stringify(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stockpile_scan_backup_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
    toast({
        title: "Export Successful",
        description: "Your data has been downloaded as a CSV file."
    })
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // The data is stringified JSON within a single cell, so we need to parse it back.
          const jsonString = (results.data[0] as any)[0];
          const importedData = JSON.parse(jsonString);

          const { products: importedProducts, serializedItems: importedItems, sales: importedSales } = importedData;

          if (!user) {
              throw new Error("You must be logged in to import data.");
          }

          // Here you would typically add logic to prevent duplicates or merge data.
          // For a simple backup/restore, we'll just add all the data.
          // This assumes the user is importing into a fresh account.
          if (importedProducts?.length) await addProducts(importedProducts.map(({id, ...p}: Product) => p));
          if (importedItems?.length) await addSerializedItems(importedItems.map(({id, ...i}: SerializedProductItem) => i));
          if (importedSales?.length) await addSales(importedSales.map(({id, ...s}: Sale) => s));

          toast({
              title: "Import Successful",
              description: "Your data has been restored from the backup file."
          });
        } catch (error: any) {
          console.error("Import error:", error);
          toast({
              variant: "destructive",
              title: "Import Failed",
              description: error.message || "Please check the file format and try again."
          });
        } finally {
          setIsImporting(false);
          // Reset file input
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
            variant: "destructive",
            title: "Import Failed",
            description: "Could not parse the CSV file. Please ensure it's a valid backup."
        });
        setIsImporting(false);
      }
    });
  };

  const loading = productsLoading || itemsLoading || salesLoading;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Backup & Restore</CardTitle>
        <CardDescription>
          Export all your inventory and sales data to a CSV file for backup, or import it to a new account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Export Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download a single CSV file containing all your products, serialized stock items, and sales history. Keep this file in a safe place.
          </p>
          <Button onClick={handleExport} disabled={loading || isExporting}>
            {loading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
            {isExporting ? "Exporting..." : "Export All Data"}
          </Button>
        </div>
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Import Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Restore data from a previously exported CSV file. This is best used on a new or empty account. It does not merge data.
          </p>
           <div className="flex items-center gap-2">
            <Label htmlFor="import-file" className="sr-only">Choose file</Label>
            <Input id="import-file" type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} disabled={isImporting} className="max-w-xs"/>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                {isImporting ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
                {isImporting ? "Importing..." : "Import from CSV"}
            </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
