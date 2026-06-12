/**
 * Robust JSON parser for AI responses
 * Handles various formats including markdown code blocks and malformed JSON
 */

export function parseAIJSON(content: string): Record<string, unknown> {
  // Method 1: Extract JSON from markdown code blocks
  let jsonContent = content;
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  } else {
    // Method 2: Look for JSON object patterns in the content
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonContent = objectMatch[0];
    }
  }

  // Method 3: Clean up common JSON formatting issues
  jsonContent = jsonContent
    .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
    .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
    .replace(/:\s*null/g, ': null') // Fix null values
    .replace(/:\s*undefined/g, ': null') // Convert undefined to null
    .replace(/:\s*'/g, ': "') // Replace single quotes with double quotes
    .replace(/'\s*:/g, '":') // Replace single quotes with double quotes
    .replace(/'/g, '"') // Replace remaining single quotes
    .trim();

  try {
    return JSON.parse(jsonContent);
  } catch (_error) {
    // Method 4: Try to fix common JSON syntax errors
    try {
      // Attempt to fix unescaped quotes in strings
      const fixedContent = jsonContent.replace(/(?<!\\)"/g, '\\"');
      return JSON.parse(fixedContent);
    } catch (_fixError) {
      // Method 5: Last resort - try to extract key-value pairs manually
      return extractKeyValuePairs(jsonContent);
    }
  }
}

function extractKeyValuePairs(content: string): any {
  const result: any = {};
  
  // Extract key-value pairs using regex
  const pairs = content.match(/"?(\w+)"?\s*:\s*"?([^",\}]+)"?/g);
  
  if (pairs) {
    pairs.forEach(pair => {
      const match = pair.match(/"?(\w+)"?\s*:\s*"?([^",\}]+)"?/);
      if (match) {
        const [, key, value] = match;
        result[key] = value.trim().replace(/^"|"$/g, '');
      }
    });
  }
  
  return result;
}

export function isValidAIResponse(content: string): boolean {
  try {
    const parsed = parseAIJSON(content);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}
