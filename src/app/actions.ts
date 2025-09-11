"use server";
import {
  scanProductInformation,
  ScanProductInformationOutput,
} from "@/ai/flows/scan-product-information";

export async function scanProductAction(
  dataUri: string
): Promise<{
  success: boolean;
  data?: ScanProductInformationOutput;
  error?: string;
}> {
  if (!dataUri) {
    return { success: false, error: "No image data provided." };
  }
  try {
    const result = await scanProductInformation({ scanDataUri: dataUri });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in scanProductAction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to scan product: ${errorMessage}` };
  }
}
