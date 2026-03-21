// Single source of truth for static sommelier knowledge, loaded from WINES.md.
// Other agents (Claude CLI, OpenClaw, etc.) can load WINES.md directly as context.
import rawContent from '../WINES.md?raw';

function extractSection(heading: string): string {
  const regex = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n---\\n|\\n## |$)`, 'm');
  const match = rawContent.match(regex);
  return match ? match[1].trim() : '';
}

export const WINES_PERSONA = extractSection('Persona');
export const WINES_LOCAL_FLAVOUR_REFS = extractSection('Local Flavour References');
export const WINES_LOCAL_CUISINE_KNOWLEDGE = extractSection('Singapore & SEA Cuisine Knowledge');
export const WINES_RECOMMENDATION_RULES = extractSection('Recommendation Rules');
