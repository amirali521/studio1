
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/currency-context";
import { currencies } from "@/lib/currencies";
import { useShopSettings, type ShopDetails } from "@/contexts/shop-settings-context";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";


export default function SettingsClient() {
  const { currency, setCurrency } = useCurrency();
  const { shopDetails, setShopDetails } = useShopSettings();
  const { toast } = useToast();

  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localShopDetails, setLocalShopDetails] = useState<ShopDetails>(shopDetails);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  useEffect(() => {
    setLocalShopDetails(shopDetails);
  }, [shopDetails]);

  useEffect(() => {
    const currencyChanged = localCurrency !== currency;
    const detailsChanged = JSON.stringify(localShopDetails) !== JSON.stringify(shopDetails);
    setHasChanges(currencyChanged || detailsChanged);
  }, [localCurrency, localShopDetails, currency, shopDetails]);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalShopDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    setCurrency(localCurrency);
    setShopDetails(localShopDetails);
    setHasChanges(false);
    toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
    });
  }

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Preferences</CardTitle>
          <CardDescription>
            Customize your application experience. Remember to save your changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency-select">Currency</Label>
            <Select value={localCurrency} onValueChange={setLocalCurrency}>
              <SelectTrigger id="currency-select" className="w-full">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name} ({c.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <p className="text-sm text-muted-foreground">
              This currency will be used for displaying all prices in the app.
            </p>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium font-headline">Shop Details</h3>
               <div className="space-y-2">
                <Label htmlFor="name">Shop / Company Name</Label>
                <Input id="name" name="name" value={localShopDetails.name} onChange={handleDetailsChange} placeholder="e.g., The General Store" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={localShopDetails.address} onChange={handleDetailsChange} placeholder="e.g., 123 Main Street, Anytown, USA" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={localShopDetails.phone} onChange={handleDetailsChange} placeholder="e.g., (555) 123-4567" />
              </div>
               <p className="text-sm text-muted-foreground">
                This information will be displayed on your printed receipts.
              </p>
          </div>
           <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveChanges} disabled={!hasChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
           </div>
        </CardContent>
      </Card>
    </main>
  );
}
