export interface VisionAnalysisResult {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  size: string | null;
  colors: string[];
  materials: string[];
  gender: string;
  brand: string | null;
  suggested_price: number;
  quick_sale_price: number;
  premium_price: number;
  confidence: number;
  keywords: string[];
  tags: string[];
  hashtags: string[];
  attributes: Record<string, string>;
}

export interface GeneratedListing extends VisionAnalysisResult {
  platform: string;
}

export const ANALYSIS_STEPS = [
  { key: "photos", label: "Analyzing photos" },
  { key: "category", label: "Detecting category" },
  { key: "brand", label: "Identifying brand" },
  { key: "colors", label: "Detecting colors" },
  { key: "condition", label: "Assessing condition" },
  { key: "materials", label: "Identifying materials" },
  { key: "size", label: "Determining size" },
  { key: "title", label: "Generating title" },
  { key: "description", label: "Writing description" },
  { key: "price", label: "Estimating price" },
  { key: "done", label: "Done" },
] as const;
