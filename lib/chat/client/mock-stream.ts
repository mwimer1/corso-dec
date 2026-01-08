// lib/chat/client/mock-stream.ts
// Mock streaming response generator for development/testing

import type { AIChunk } from './types';

/**
 * Generate a mock streaming response that matches production NDJSON format.
 * 
 * This function simulates the production stream behavior:
 * - Emits chunks in NDJSON format matching production
 * - Includes same structure: { assistantMessage, detectedTableIntent, error }
 * - Provides mock answers based on mode and question content
 * 
 * @param content - User message content
 * @param preferredTable - Preferred table context ('projects', 'companies', 'addresses')
 * @returns Async generator yielding AIChunk objects matching production format
 */
export async function* generateMockStream(
  content: string,
  preferredTable?: string | null
): AsyncGenerator<AIChunk, void, unknown> {
  // Simulate a short typing delay (e.g., 500ms)
  await new Promise(res => setTimeout(res, 500));
  
  // Determine mode and question for tailoring the response
  let mode = preferredTable || 'projects';
  const modeMatch = content.match(/^\[mode:(projects|companies|addresses)\]\s*/i);
  if (modeMatch) {
    mode = modeMatch[1] as typeof mode;
  }
  
  // Remove mode prefix from content for analysis
  const question = content.replace(/^\[mode:\w+\]\s*/i, '').toLowerCase();
  let answer = '';
  
  if (mode === 'projects') {
    if (/last\s*30\s*days/.test(question)) {
      answer = "In the last 30 days, there have been **42 permits** issued, totaling approximately **$3.5 million** in project value. The activity has been steady, with a slight uptick toward the end of the month.";
    } else if (/top\s*10\s*contractors/.test(question)) {
      answer = "Here are the **Top 10 Contractors by total job value YTD**:\n1. Alpha Construction – $5.4M\n2. BuildIt Corp – $4.8M\n3. Skyline LLC – $4.5M\n4. Ace Builders – $4.0M\n5. Red House Co – $3.9M\n6. ProLine Inc – $3.5M\n7. Urban Contractors – $3.1M\n8. Prime Renovation – $2.8M\n9. North Star Constr. – $2.5M\n10. Future Homes – $2.3M\n(These figures are mock data.)";
    } else if (/trending/.test(question) || /trends?/.test(question)) {
      answer = "**Trending Project Types:** Residential remodels are on the rise this quarter, up 15%. Solar panel installations have also increased. Commercial developments remain steady. It looks like sustainable projects are a key trend recently.";
    } else {
      answer = "Project analysis complete. (This is a mock response.) Based on the data, everything looks normal. Feel free to ask about permits, contractors, or trends!";
    }
  } else if (mode === 'companies') {
    if (/top/.test(question) || /largest/.test(question)) {
      answer = "The top companies by project count include **Alpha Construction**, **Beta Builders**, and **Gamma Contractors**. Alpha Construction has the most projects so far this year. (Mock data)";
    } else {
      answer = "There are **256 companies** in our system. Companies are performing within normal ranges. (This is a mock summary for company data.)";
    }
  } else if (mode === 'addresses') {
    if (/history|records|permits/.test(question)) {
      answer = "This address has had **5 permits** in the last 10 years, including new construction and renovations. The latest activity was a permit issued 2 months ago. (Mock data)";
    } else {
      answer = "I've looked up that address. All records are in good order, with no recent violations or unusual activity. (Response generated in mock mode.)";
    }
  }
  
  if (!answer) {
    answer = "I'm sorry, I don't have information on that. (This is a mock response.)";
  }
  
  // Yield a single chunk with the assembled answer (matching production NDJSON format)
  // Production format: { assistantMessage: {...}, detectedTableIntent: null, error: null }
  yield {
    assistantMessage: { content: answer, type: 'assistant' },
    detectedTableIntent: null,
    error: null
  };
  
  // End the generator (matches production behavior)
}
