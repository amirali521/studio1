'use server';

/**
 * @fileOverview Product name suggestion flow.
 *
 * This file defines a Genkit flow that suggests a product name based on a scanned barcode.
 *
 * @fileOverview
 * - `suggestProductName`: Asynchronously suggests a product name based on the provided barcode.
 * - `SuggestProductNameInput`: Interface defining the input for the `suggestProductName` function.
 * - `SuggestProductNameOutput`: Interface defining the output of the `suggestProductName` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductNameInputSchema = z.object({
  barcode: z
    .string()
    .describe('The barcode of the product, obtained from a barcode scanner.'),
});
export type SuggestProductNameInput = z.infer<
  typeof SuggestProductNameInputSchema
>;

const SuggestProductNameOutputSchema = z.object({
  productName: z.string().describe('The suggested name for the product.'),
});
export type SuggestProductNameOutput = z.infer<
  typeof SuggestProductNameOutputSchema
>;

/**
 * Asynchronously suggests a product name based on the provided barcode.
 * @param input - The input object containing the barcode.
 * @returns A promise that resolves to the suggested product name.
 */
export async function suggestProductName(
  input: SuggestProductNameInput
): Promise<SuggestProductNameOutput> {
  return suggestProductNameFlow(input);
}

const suggestProductNamePrompt = ai.definePrompt({
  name: 'suggestProductNamePrompt',
  input: {schema: SuggestProductNameInputSchema},
  output: {schema: SuggestProductNameOutputSchema},
  prompt: `You are a helpful product naming assistant. Given a barcode, you will suggest a product name.

Barcode: {{{barcode}}}

Suggest a product name:`,
});

const suggestProductNameFlow = ai.defineFlow(
  {
    name: 'suggestProductNameFlow',
    inputSchema: SuggestProductNameInputSchema,
    outputSchema: SuggestProductNameOutputSchema,
  },
  async input => {
    const {output} = await suggestProductNamePrompt(input);
    return output!;
  }
);
