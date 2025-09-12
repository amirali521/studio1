
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/currency-context";
import { currencies } from "@/lib/currencies";
import { useShopSettings } from "@/contexts/shop-settings-context";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";


export default function SettingsClient() {
  const { currency, setCurrency } = useCurrency();
  const { shopDetails, setShopDetails } = useShopSettings();

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopDetails(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Preferences</CardTitle>
          <CardDescription>
            Customize your application experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency-select">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
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
                <Input id="name" name="name" value={shopDetails.name} onChange={handleDetailsChange} placeholder="e.g., The General Store" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={shopDetails.address} onChange={handleDetailsChange} placeholder="e.g., 123 Main Street, Anytown, USA" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={shopDetails.phone} onChange={handleDetailsChange} placeholder="e.g., (555) 123-4567" />
              </div>
               <p className="text-sm text-muted-foreground">
                This information will be displayed on your printed receipts.
              </p>
          </div>

        </CardContent>
      </Card>
    </main>
  );
}
