'use server';

/**
 * @fileOverview Implements a Genkit flow to scan product information from a barcode or QR code.
 *
 * - scanProductInformation - A function that handles the scanning process.
 * - ScanProductInformationInput - The input type for the scanProductInformation function.
 * - ScanProductInformationOutput - The return type for the scanProductInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanProductInformationInputSchema = z.object({
  scanDataUri: z
    .string()
    .describe(
      "The barcode or QR code image data as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanProductInformationInput = z.infer<typeof ScanProductInformationInputSchema>;

const ScanProductInformationOutputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A description of the product.'),
  productPrice: z.number().describe('The price of the product.'),
});
export type ScanProductInformationOutput = z.infer<typeof ScanProductInformationOutputSchema>;

export async function scanProductInformation(input: ScanProductInformationInput): Promise<ScanProductInformationOutput> {
  return scanProductInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanProductInformationPrompt',
  input: {schema: ScanProductInformationInputSchema},
  output: {schema: ScanProductInformationOutputSchema},
  prompt: `You are an AI assistant designed to extract product information from a scanned barcode or QR code image.

  Analyze the following scanned image and extract the product name, description, and price. Return the information in JSON format.

  Scanned Image: {{media url=scanDataUri}}
  `,
});

const scanProductInformationFlow = ai.defineFlow(
  {
    name: 'scanProductInformationFlow',
    inputSchema: ScanProductInformationInputSchema,
    outputSchema: ScanProductInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
