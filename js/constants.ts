import type { DrinkingStatus } from './types';
import { WINES_PERSONA } from './winesKnowledge';

export interface TypeStyle { dot: string; bg: string; border: string; text: string; }

export const FLAGS: Record<string, string> = {
  France: '🇫🇷', Australia: '🇦🇺', Spain: '🇪🇸', Italy: '🇮🇹',
  'United States': '🇺🇸', Germany: '🇩🇪', 'New Zealand': '🇳🇿',
  Portugal: '🇵🇹', Argentina: '🇦🇷', Chile: '🇨🇱',
  'South Africa': '🇿🇦', Austria: '🇦🇹', Greece: '🇬🇷', Japan: '🇯🇵',
};

export const TYPE_STYLE: Record<string, TypeStyle> = {
  Red:       { dot: '#e05c6b', bg: 'rgba(139,26,46,0.2)',   border: 'rgba(180,50,70,0.4)',   text: '#f9b4bf' },
  White:     { dot: '#d4c44a', bg: 'rgba(139,130,26,0.2)',  border: 'rgba(180,170,50,0.4)',  text: '#f5f0a8' },
  Sparkling: { dot: '#5bbad5', bg: 'rgba(26,106,139,0.2)',  border: 'rgba(50,140,180,0.4)',  text: '#aadff5' },
  'Rosé':    { dot: '#d45aa0', bg: 'rgba(139,26,106,0.2)',  border: 'rgba(180,50,140,0.4)',  text: '#f5aae0' },
  Dessert:   { dot: '#d4a45a', bg: 'rgba(139,90,26,0.2)',   border: 'rgba(180,120,50,0.4)',  text: '#f5d4aa' },
  Fortified: { dot: '#8a5ad4', bg: 'rgba(90,26,139,0.2)',   border: 'rgba(120,50,180,0.4)', text: '#c4aaf5' },
};

export const TYPE_STYLE_LIGHT: Record<string, TypeStyle> = {
  Red:       { dot: '#e05c6b', bg: 'rgba(180,50,70,0.12)',   border: 'rgba(180,50,70,0.30)',   text: '#8B1A2A' },
  White:     { dot: '#d4c44a', bg: 'rgba(160,155,30,0.10)',  border: 'rgba(160,155,30,0.28)',  text: '#6B6512' },
  Sparkling: { dot: '#5bbad5', bg: 'rgba(30,110,150,0.10)',  border: 'rgba(30,110,150,0.28)',  text: '#1A5A7A' },
  'Rosé':    { dot: '#d45aa0', bg: 'rgba(180,50,140,0.10)',  border: 'rgba(180,50,140,0.28)',  text: '#8B1A6A' },
  Dessert:   { dot: '#d4a45a', bg: 'rgba(160,100,30,0.10)',  border: 'rgba(160,100,30,0.28)',  text: '#7A4A10' },
  Fortified: { dot: '#8a5ad4', bg: 'rgba(100,40,160,0.10)',  border: 'rgba(100,40,160,0.28)',  text: '#5A1A8A' },
};

export const CURRENT_YEAR = new Date().getFullYear();

export const DRINKING_STATUS_PRIORITY: Record<DrinkingStatus, number> = {
  past_peak: 1,
  approaching_end: 2,
  prime: 3,
  too_young: 4,
  unknown: 5,
};

export const BADGE_STYLES: Record<DrinkingStatus, { background: string; color: string; label: string }> = {
  prime:           { background: '#16a34a', color: '#ffffff', label: 'Prime' },
  approaching_end: { background: '#d97706', color: '#ffffff', label: 'Drink Soon' },
  past_peak:       { background: '#dc2626', color: '#ffffff', label: 'Past Peak' },
  too_young:       { background: '#2563eb', color: '#ffffff', label: 'Too Young' },
  unknown:         { background: '#6b7280', color: '#ffffff', label: 'Unknown' },
};

export const DRINKING_STATUS_DESCRIPTIONS: Record<DrinkingStatus, string> = {
  past_peak:       'Wine is past its peak window. Mention this clearly if recommending; it may still be enjoyable.',
  approaching_end: 'Wine is within 2 years of its window end. Recommend urgently ("drink soon").',
  prime:           'Wine is currently at its best drinking window.',
  too_young:       'Wine has not yet reached its window. Only recommend if the user specifically asks about aging potential.',
  unknown:         'Window data not available; treat as potentially drinkable.',
};

export const SOMMELIER_SYSTEM = WINES_PERSONA;
