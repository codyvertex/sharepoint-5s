/**
 * OpenAI API Client
 * Handles GPT-4 calls for file analysis.
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const OPENAI_MODEL = 'gpt-4o';

export interface AnalysisSuggestion {
  category: 'delete' | 'archive' | 'rename' | 'structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file_path: string;
  suggested_value: string | null;
  confidence: number;
}

/**
 * Call OpenAI GPT-4 with a structured prompt and get JSON back.
 */
export async function analyzeFiles(
  fileData: any,
  systemPrompt: string
): Promise<AnalysisSuggestion[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(fileData) },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed.suggestions || [];
}

/**
 * The system prompt for 5S file analysis.
 */
export const ANALYSIS_SYSTEM_PROMPT = `You are a 5S file organization expert analyzing a SharePoint document library. 5S stands for Sort, Set in Order, Shine, Standardize, and Sustain.

Your job is to analyze file metadata and suggest cleanup actions. You must return valid JSON with this exact structure:

{
  "suggestions": [
    {
      "category": "delete|archive|rename|structure",
      "severity": "low|medium|high|critical",
      "title": "Short label for the suggestion",
      "description": "Detailed explanation of why this action is recommended",
      "file_path": "/exact/path/to/file.ext",
      "suggested_value": "new-name.ext or /new/path or null",
      "confidence": 0.0 to 1.0
    }
  ]
}

## Category Rules

### DELETE (Red) — Files that should be removed
- Files with 0 bytes (blank/empty) — severity: high, confidence: 0.95
- Files not modified in over 4 years that aren't regulatory/compliance docs — severity: medium
- Obvious duplicates: same filename with copy indicators like "(1)", "Copy of", "v2 FINAL", etc. — severity: high
- Temporary files: ~$*.*, *.tmp, Thumbs.db, .DS_Store — severity: critical, confidence: 1.0
- Zip files that appear to contain files already present unzipped — severity: medium

### ARCHIVE (Amber) — Files to move to cold storage
- Files not modified in 2-4 years that might still be needed — severity: medium
- Old project deliverables that are complete but referenced — severity: low
- Historical records beyond the active retention period — severity: low

### RENAME (Blue) — Files with non-standard naming
- Files with spaces instead of hyphens or underscores — severity: low
- Files with version numbers in the name (use SharePoint versioning instead) — severity: medium
- Files with ALL CAPS or inconsistent capitalization — severity: low
- Files with special characters that cause issues — severity: medium
- Suggest the standardized name format: lowercase-kebab-case with dates as YYYY-MM-DD prefix where applicable
- Standard naming convention: [YYYY-MM-DD]-[descriptive-name].[ext] for dated files, [descriptive-name].[ext] for undated

### STRUCTURE (Purple) — Folder organization issues
- Folders nested more than 4 levels deep — severity: high
- Folders with only 1-2 files (could be flattened) — severity: medium
- Folders with more than 50 direct children (should be subdivided) — severity: medium
- Duplicate folder structures (same names at different levels) — severity: high
- Suggest specific reorganization: which folders to merge, flatten, or split

## Important Notes
- Be conservative with delete suggestions for anything that could be regulatory/compliance related (policies, procedures, audits, legal, HR, finance)
- For schools/education context: never suggest deleting IEP records, student records, board minutes, accreditation docs, or compliance files
- Always explain WHY you're making a suggestion
- Confidence should reflect how certain you are (0.5 = unsure, 0.8 = likely, 0.95+ = very confident)
- When in doubt between delete and archive, choose archive
- Focus on the most impactful suggestions first`;
