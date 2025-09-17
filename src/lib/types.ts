

import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser extends FirebaseUser {
    isAdmin?: boolean;
}
export interface Product {
  id: string; // This will be the Firestore document ID
  name: string;
  description: string;
  price: number; // This is the selling price
  purchasePrice: number; // This is the cost of the product
  discount?: number; // Optional discount percentage
  tax?: number; // Optional tax percentage
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
  price: number; // Selling price at time of sale
  purchasePrice: number; // Purchase price at time of sale
  discount: number; // Discount amount for this item
  tax: number; // Tax amount for this item
  status?: 'sold' | 'returned';
}

export interface Sale {
  id:string; // This will be the Firestore document ID
  saleId: string; // A unique readable ID for the invoice
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  createdAt?: string; // Optional for backwards compatibility, but new sales will have it
}

export interface QrCodeData {
  serialNumber: string;
  uid: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
}

