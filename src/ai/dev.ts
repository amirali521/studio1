'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/scan-product-information.ts';
import '@/ai/flows/suggest-product-name.ts';
