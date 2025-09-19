'use server';

/**
 * @fileOverview Product details auto-fill flow.
 *
 * This file defines a Genkit flow that parses user input (text, audio, or image)
 * to extract product details and pre-fill the product form.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer';

const AutofillProductDetailsInputSchema = z.object({
  textInput: z.string().optional().describe('A text description of the product(s).'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An image of handwritten notes about the product(s), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AutofillProductDetailsInput = z.infer<
  typeof AutofillProductDetailsInputSchema
>;

const ProductDetailsSchema = z.object({
  name: z.string().describe('The name of the product.'),
  description: z.string().describe('A brief description of the product.'),
  quantity: z.number().describe('The quantity of the product to add.'),
  price: z.number().describe('The selling price of the product.'),
  purchasePrice: z.number().describe('The purchase price or cost of the product.'),
});

const AutofillProductDetailsOutputSchema = z.object({
  products: z.array(ProductDetailsSchema).describe('An array of products extracted from the input.'),
});
export type AutofillProductDetailsOutput = z.infer<
  typeof AutofillProductDetailsOutputSchema
>;

export async function autofillProductDetails(
  input: AutofillProductDetailsInput
): Promise<AutofillProductDetailsOutput> {
  return autofillProductDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autofillProductDetailsPrompt',
  input: { schema: AutofillProductDetailsInputSchema },
  output: { schema: AutofillProductDetailsOutputSchema },
  prompt: `You are an intelligent inventory management assistant. Your task is to parse user input, which can be text, an image of handwriting, or both, and extract a list of products to be added to the inventory.

The user wants to add one or more products. Analyze the provided input carefully.

- If text is provided, use it as the primary source.
- If an image is provided, perform OCR to read the handwritten text.
- If both are provided, use the text as context for the image.

For each product you identify, extract the following details:
- name: The product's name.
- description: A short description. If not provided, generate a brief one based on the name.
- quantity: The number of items. Default to 1 if not specified.
- price: The selling price. Default to 0 if not specified.
- purchasePrice: The cost price. If not mentioned, estimate it to be 60% of the selling price, or 0 if the selling price is also 0.

Return the extracted information as a structured JSON object containing a list of products. Even if only one product is found, return it inside a 'products' array.

Input Text:
{{{textInput}}}

{{#if imageDataUri}}
Handwritten Note Image:
{{media url=imageDataUri}}
{{/if}}
`,
});

const autofillProductDetailsFlow = ai.defineFlow(
  {
    name: 'autofillProductDetailsFlow',
    inputSchema: AutofillProductDetailsInputSchema,
    outputSchema: AutofillProductDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
