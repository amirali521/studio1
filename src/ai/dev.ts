'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-product-name.ts';
import '@/ai/flows/autofill-product-details.ts';
