
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/currency-context";
import { currencies } from "@/lib/currencies";


export default function SettingsClient() {
  const { currency, setCurrency } = useCurrency();

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Preferences</CardTitle>
          <CardDescription>
            Customize your application experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency-select">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency-select" className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-sm text-muted-foreground">
                This currency will be used for displaying all prices in the app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
