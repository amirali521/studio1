export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

export interface SerializedProductItem {
  id: string; // Unique ID for this specific item
  productId: string;
  serialNumber: string; // The unique serial number for this item
  status: 'in_stock' | 'sold';
  createdAt: string;
}

export interface SaleItem {
  serializedProductId: string; // Reference to the specific sold item
  productName: string;
  serialNumber: string;
  price: number;
}

export interface Sale {
  id:string;
  date: string;
  items: SaleItem[];
  total: number;
}
