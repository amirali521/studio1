
'use server';

/**
 * @fileOverview Sales data analysis flow.
 *
 * This file defines a Genkit flow that analyzes sales, product, and inventory
 * data to provide insights based on a user's query.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeSalesDataInputSchema = z.object({
  query: z.string().describe('The user\'s question about their sales data.'),
  productsJson: z.string().describe('A JSON string representing an array of all products.'),
  salesJson: z.string().describe('A JSON string representing an array of all sales.'),
  serializedItemsJson: z.string().describe('A JSON string representing an array of all serialized inventory items.'),
});
export type AnalyzeSalesDataInput = z.infer<typeof AnalyzeSalesDataInputSchema>;

const AnalyzeSalesDataOutputSchema = z.object({
  analysis: z.string().describe('A detailed, human-readable analysis of the sales data, formatted in Markdown.'),
});
export type AnalyzeSalesDataOutput = z.infer<typeof AnalyzeSalesDataOutputSchema>;

export async function analyzeSalesData(
  input: AnalyzeSalesDataInput
): Promise<AnalyzeSalesDataOutput> {
  return analyzeSalesDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSalesDataPrompt',
  input: { schema: AnalyzeSalesDataInputSchema },
  output: { schema: AnalyzeSalesDataOutputSchema },
  prompt: `You are an expert business analyst. Your task is to analyze the provided sales, product, and inventory data to answer the user's question.

Here is the data in JSON format:
- Products: {{{productsJson}}}
- Sales: {{{salesJson}}}
- Inventory Items: {{{serializedItemsJson}}}

Here is the user's question: "{{{query}}}"

Based on the data and the user's query, provide a comprehensive analysis. Calculate the following key metrics where relevant, and use them to formulate your answer:

1.  **Total Revenue**: Sum of 'total' from all sales.
2.  **Total Profit**: Sum of 'profit' from all sales.
3.  **Total Tax Collected**: Sum of 'tax' from all sales.
4.  **Total Discounts Given**: Sum of 'discount' from all sales.
5.  **Total Items Sold**: Count of all items across all sales.
6.  **Inventory Stock Value (Purchase Price)**: The total cost of all items currently 'in_stock'. (Sum of 'purchasePrice' for each product, multiplied by its stock quantity).
7.  **Inventory Stock Value (Selling Price)**: The total potential revenue from all items currently 'in_stock'. (Sum of 'price' for each product, multiplied by its stock quantity).

Present your analysis as a Markdown-formatted string within a JSON object. Address the user's query directly and use the calculated metrics to support your answer. Your final output MUST be a valid JSON object with a single key "analysis" containing the Markdown string.
`,
});

const analyzeSalesDataFlow = ai.defineFlow(
  {
    name: 'analyzeSalesDataFlow',
    inputSchema: AnalyzeSalesDataInputSchema,
    outputSchema: AnalyzeSalesDataOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
