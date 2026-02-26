export interface Wine {
  id: string;
  name: string;
  winery: string;
  vintage: string;
  price: number | null;
  inventory: number;
  style: string;
  country: string;
  region: string;
  subRegion: string;
  type: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Stats {
  totalBottles: number;
  uniqueWines: number;
  avgPrice: number | null;
  count2018: number;
  count2023: number;
  modeVintage: string;
  modeCountry: string;
  modeStyle: string;
}

export interface ImageData {
  data: string;
  mimeType: string;
}

export interface ClaudeParams {
  messages: ChatMessage[];
  system?: string;
  maxTokens?: number;
  imageData?: ImageData | null;
}

export interface NewWineForm {
  name: string;
  winery: string;
  vintage: string;
  price: string;
  inventory: string;
  style: string;
  country: string;
  region: string;
  subRegion: string;
  type: string;
}
