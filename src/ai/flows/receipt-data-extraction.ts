'use server';
/**
 * @fileOverview A Genkit flow for extracting data from receipt images.
 *
 * - extractReceiptData - A function that extracts the total amount and suggests a category from a receipt image.
 * - ReceiptDataExtractionInput - The input type for the extractReceiptData function.
 * - ReceiptDataExtractionOutput - The return type for the extractReceiptData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CATEGORIES = [
  'rent',
  'electricity',
  'wifi',
  'groceries',
  'water',
  'gas',
  'other',
] as const;

const ReceiptDataExtractionInputSchema = z.object({
  receiptImage: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReceiptDataExtractionInput = z.infer<
  typeof ReceiptDataExtractionInputSchema
>;

const ReceiptDataExtractionOutputSchema = z.object({
  amount: z.number().describe('The total amount extracted from the receipt.'),
  category: z
    .enum(CATEGORIES)
    .describe(
      `A suggested category for the expense. Must be one of: ${CATEGORIES.join(', ')}. Default to 'other' if none fit.`
    ),
});
export type ReceiptDataExtractionOutput = z.infer<
  typeof ReceiptDataExtractionOutputSchema
>;

export async function extractReceiptData(
  input: ReceiptDataExtractionInput
): Promise<ReceiptDataExtractionOutput> {
  return receiptDataExtractionFlow(input);
}

const receiptDataExtractionPrompt = ai.definePrompt({
  name: 'receiptDataExtractionPrompt',
  input: { schema: ReceiptDataExtractionInputSchema },
  output: { schema: ReceiptDataExtractionOutputSchema },
  prompt: `You are an expert at extracting financial information from receipts.

From the provided receipt image, extract the total amount and suggest the most appropriate category from the following list:
${CATEGORIES.map((cat) => `- ${cat}`).join('\n')}
If no category fits well, choose 'other'.

Receipt image: {{media url=receiptImage}}`,
});

const receiptDataExtractionFlow = ai.defineFlow(
  {
    name: 'receiptDataExtractionFlow',
    inputSchema: ReceiptDataExtractionInputSchema,
    outputSchema: ReceiptDataExtractionOutputSchema,
  },
  async (input) => {
    // Use the global ai model defined in genkit.ts for multimodal input, 
    // assuming it supports vision, otherwise it will default to gemini-pro-vision.
    const { output } = await receiptDataExtractionPrompt(input);
    return output!;
  }
);
