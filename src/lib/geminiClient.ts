import { ChatMessage, ReflectionMode, ReflectionPrompt, PerspectiveLens, CognitiveClarityInsights } from '../types';

export interface GenerateReflectionResponse {
  text: string;
  modelUsed: string;
  mode: ReflectionMode;
  timestamp: string;
}

export async function requestReflection(
  prompt: string,
  mode: ReflectionMode,
  history: ChatMessage[] = [],
  lens: PerspectiveLens = 'mindful'
): Promise<GenerateReflectionResponse> {
  const response = await fetch('/api/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      mode,
      lens,
      history: history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate reflection';
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      errorMsg = `Server error HTTP ${response.status}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function requestSummary(
  text: string
): Promise<{ summary: string; modelUsed: string }> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate summary';
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      errorMsg = `Server error HTTP ${response.status}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function requestClarity(
  text: string
): Promise<CognitiveClarityInsights & { modelUsed: string }> {
  const response = await fetch('/api/clarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate cognitive clarity insights';
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      errorMsg = `Server error HTTP ${response.status}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function fetchReflectionPrompts(): Promise<ReflectionPrompt[]> {
  try {
    const res = await fetch('/api/prompts');
    if (res.ok) {
      const data = await res.json();
      return data.prompts || [];
    }
  } catch (err) {
    console.warn('Could not fetch inspiration prompts:', err);
  }
  return [];
}
