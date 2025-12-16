import type { AiActionType } from './types';

export function buildPrompt(type: AiActionType, language: string, code: string) {
  switch (type) {
    case 'explain':
      return `
You are an expert ${language} developer.
Explain the following code clearly and concisely for another developer.
Focus on what it does, key concepts, and potential pitfalls.

Code:
${code}
      `.trim();

    case 'comment':
      return `
You are an expert ${language} developer.
Add helpful inline comments to the following code.
Use the same language for comments as the code's usual comment style.
Return ONLY the commented code.

Code:
${code}
      `.trim();

    case 'usage_example':
      return `
You are an expert ${language} developer.
Write a short, self-contained example that shows how to use the following code in a realistic scenario.
Keep it concise and focused.

Original code:
${code}
      `.trim();
  }
}
