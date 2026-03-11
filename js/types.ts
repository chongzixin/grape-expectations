import type { Session } from '@supabase/supabase-js';

export type { Session };

export type DrinkingStatus = 'prime' | 'approaching_end' | 'past_peak' | 'too_young' | 'unknown';

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
  source?: string;
  drinkFrom: number | null;
  drinkBy: number | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Set on assistant messages after they are persisted to Supabase */
  messageId?: string;
}

export interface Stats {
  totalBottles: number;
  uniqueWines: number;
  avgPrice: number | null;
  count2016: number;
  count2018: number;
  count2023: number;
  modeCountry: string;
  modeStyle: string;
  drinkSoon: number;
  pastPeak: number;
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
  drinkFrom: string;
  drinkBy: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface RecommendationFeedback {
  wine_name: string;
  winery?: string;
  feedback: 'thumbs_up' | 'thumbs_down';
  in_cellar: boolean;
  cellar_wine_id?: string | null;
}
