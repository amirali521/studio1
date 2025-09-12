
export interface Product {
  id: string; // This will be the Firestore document ID
  name: string;
  description: string;
  price: number;
  customFields?: Record<string, string>;
  createdAt: string;
}

export interface SerializedProductItem {
  id: string; // This will be the Firestore document ID
  productId: string; // This ID should match the `id` of a Product document
  serialNumber: string; // The unique serial number for this item
  status: 'in_stock' | 'sold' | 'returned';
  createdAt: string;
}

export interface SaleItem {
  serializedProductId: string; // Reference to the specific sold item's Firestore ID
  productName: string;
  serialNumber: string;
  price: number;
  status?: 'sold' | 'returned';
}

export interface Sale {
  id:string; // This will be the Firestore document ID
  saleId: string; // A unique readable ID for the invoice
  date: string;
  items: SaleItem[];
  total: number;
  createdAt?: string; // Optional for backwards compatibility, but new sales will have it
}

export interface QrCodeData extends Product {
  serialNumber: string;
  productName: string;
  uid: string;
}
    
