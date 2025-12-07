/**
 * AI Service - Google Gemini API Wrapper
 * v0.7.1 - Two-step approach: Search then Act (REST API limitation workaround)
 */

import type {
  AIContext,
  AIAction,
  GeminiContent,
  GeminiResponse,
  GeminiFunctionDeclaration,
  AIError,
  AIErrorCode
} from '../types/ai';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ============================================================================
// Function Declarations for Gemini
// ============================================================================

const TIMELINE_FUNCTIONS: GeminiFunctionDeclaration[] = [
  {
    name: 'create_event',
    description: 'Create a new event on the timeline',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        date: { type: 'string', description: 'Event date in YYYY-MM-DD format' },
        description: { type: 'string', description: 'Event description (optional)' },
        endDate: { type: 'string', description: 'End date for range events (optional)' },
        time: { type: 'string', description: 'Time in HH:MM format (optional)' },
        sources: { type: 'array', items: { type: 'string' }, description: 'Source URLs (optional)' }
      },
      required: ['title', 'date']
    }
  },
  {
    name: 'update_event',
    description: 'Update an existing event on the timeline',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'ID of the event to update' },
        title: { type: 'string', description: 'New title (optional)' },
        date: { type: 'string', description: 'New date (optional)' },
        description: { type: 'string', description: 'New description (optional)' },
        endDate: { type: 'string', description: 'New end date (optional)' },
        time: { type: 'string', description: 'New time (optional)' },
        sources: { type: 'array', items: { type: 'string' }, description: 'New sources (optional)' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'delete_event',
    description: 'Delete an event from the timeline',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'ID of the event to delete' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'update_timeline_metadata',
    description: 'Update timeline title or description',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'New timeline title (optional)' },
        description: { type: 'string', description: 'New timeline description (optional)' }
      }
    }
  }
];

// ============================================================================
// System Prompts
// ============================================================================

const SEARCH_SYSTEM_PROMPT = `You are a research assistant. Search the web and provide factual information about the user's query.
Include specific dates (YYYY-MM-DD format), names, and cite your sources.
Be thorough but concise. Focus on verifiable historical facts.`;

const CREATE_EVENTS_PROMPT = `You are an AI assistant for PowerTimeline. The user wants to ADD EVENTS to their timeline.

**CRITICAL INSTRUCTION: YOU MUST USE FUNCTION CALLS**

Your response MUST include function calls to create_event. DO NOT just describe events in plain text.

For EACH event you want to add, you MUST call the create_event function with these parameters:
- title: Clear, concise event title (string, required)
- date: Date in YYYY-MM-DD format (string, required)
- description: Brief 1-2 sentence description (string, optional)
- sources: Array of source URLs (array of strings, optional)

WRONG (DO NOT DO THIS):
"Here are some events: The French Revolution began in 1789..."

CORRECT (DO THIS):
[Call create_event function with title="Storming of the Bastille", date="1789-07-14", description="..."]

Based on the research provided, identify distinct events with specific dates and call create_event for EACH ONE.
If the research mentions multiple events, make multiple function calls.
NEVER respond with only text when the user asked to "add" or "create" events.`;

const GENERAL_ACTION_PROMPT = `You are an AI assistant helping users manage their timeline in PowerTimeline.

You can help users by:
- Answering questions about their timeline or history
- Creating events when asked (use create_event function)
- Updating events when asked (use update_event function with eventId)
- Deleting events when asked (use delete_event function with eventId)

When the user asks to ADD, CREATE, or MAKE events - use the create_event function.
When the user asks questions or wants information - respond conversationally.
When modifying existing events - reference them by their [eventId] shown in the timeline context.

Use YYYY-MM-DD format for dates. Include source URLs when available.`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Filter out invalid/irrelevant source URLs
 */
function filterValidSources(sources: string[]): string[] {
  const invalidDomains = [
    'googleapis.com',
    'cloud.google.com',
    'developers.google.com',
    'ai.google.dev',
    'firebase.google.com',
    'support.google.com',
    'accounts.google.com',
    'vertexai',
  ];

  return sources.filter(url => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return !invalidDomains.some(domain => hostname.includes(domain));
    } catch {
      return false; // Invalid URL
    }
  });
}

/**
 * Detect if user wants to CREATE events (action intent)
 */
function wantsToCreateEvents(message: string): boolean {
  const createIndicators = [
    /\b(add|create|make|insert|put|include)\b.*\b(event|events|timeline|entry|entries)\b/i,
    /\bcan (you|we) add\b/i,
    /\blet'?s add\b/i,
    /\badd (a few|some|several|more)\b/i,
    /\bcreate (a few|some|several|more)\b/i,
  ];
  return createIndicators.some(regex => regex.test(message));
}

/**
 * Detect if user is asking about the current timeline (no search needed)
 */
function isAskingAboutCurrentTimeline(message: string): boolean {
  const currentTimelineIndicators = [
    /\b(this timeline|the timeline|my timeline|current timeline)\b/i,
    /\b(these events|the events|my events|existing events)\b/i,
    /\b(what('s| is) (on|in) (this|the|my))\b/i,
    /\b(summarize|overview|summary of) (this|the|my)\b/i,
  ];
  return currentTimelineIndicators.some(regex => regex.test(message));
}

/**
 * Detect if user message requires web search for research
 */
function needsWebSearch(message: string): boolean {
  // Don't search if user is asking about the current timeline
  if (isAskingAboutCurrentTimeline(message)) {
    return false;
  }

  // If user wants to create events, we need to search for facts
  if (wantsToCreateEvents(message)) {
    return true;
  }

  const searchIndicators = [
    /\b(research|find|search|look up|what happened|when did|who was|history of)\b/i,
    /\b(napoleonic|historical|world war|civil war|revolution|ancient|medieval)\b/i,
  ];
  return searchIndicators.some(regex => regex.test(message));
}

/**
 * Build basic contents array
 */
function buildContents(systemPrompt: string, context: AIContext, userMessage: string): GeminiContent[] {
  const contents: GeminiContent[] = [];

  // Timeline context
  const timelineContext = `
Current Timeline: "${context.timeline.title}"
${context.timeline.description ? `Description: ${context.timeline.description}` : ''}
${context.visibleEvents.length > 0 ? `
Existing Events (${context.visibleEvents.length}):
${context.visibleEvents.map(e => `- [${e.id}] ${e.title} (${e.date})`).join('\n')}` : 'No events yet.'}
${context.selectedEvent ? `
Selected Event: [${context.selectedEvent.id}] ${context.selectedEvent.title}` : ''}`;

  contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\n${timelineContext}` }] });
  contents.push({ role: 'model', parts: [{ text: 'Understood. How can I help?' }] });

  // Conversation history
  for (const msg of context.conversationHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  // Current message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  return contents;
}

/**
 * Make API call to Gemini
 * @param toolConfig - Optional config to control function calling behavior
 *   - mode: 'AUTO' (default), 'ANY' (force function call), 'NONE' (disable)
 */
async function callGemini(
  apiKey: string,
  contents: GeminiContent[],
  tools?: object[],
  toolConfig?: { mode: 'AUTO' | 'ANY' | 'NONE' }
): Promise<GeminiResponse> {
  const body: Record<string, unknown> = {
    contents,
    generation_config: {
      temperature: 0.7,
      max_output_tokens: 4096
    }
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    // Add tool_config to control function calling behavior
    if (toolConfig) {
      body.tool_config = {
        function_calling_config: {
          mode: toolConfig.mode
        }
      };
    }
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[AI Service] API Error:', response.status, errorData);
    throw { status: response.status, error: errorData };
  }

  return response.json();
}

/**
 * Extract text and sources from Gemini response
 */
function extractTextAndSources(response: GeminiResponse): { text: string; sources: string[] } {
  let text = '';
  const sources: string[] = [];

  for (const candidate of response.candidates || []) {
    // Extract grounding sources
    if (candidate.groundingMetadata?.groundingChunks) {
      for (const chunk of candidate.groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      }
    }

    for (const part of candidate.content?.parts || []) {
      if (part.text) {
        text += part.text;
      }
    }
  }

  return { text, sources };
}

/**
 * Parse function calls from Gemini response
 */
function parseFunctionCalls(
  response: GeminiResponse,
  visibleEvents: AIContext['visibleEvents'],
  groundingSources: string[]
): { text: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  let text = '';

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) {
        text += part.text;
      }
      if (part.functionCall) {
        const fc = part.functionCall;
        const actionId = crypto.randomUUID();

        switch (fc.name) {
          case 'create_event': {
            const rawSources = [
              ...(fc.args.sources as string[] || []),
              ...groundingSources
            ].filter((s, i, arr) => arr.indexOf(s) === i);
            const eventSources = filterValidSources(rawSources);

            actions.push({
              id: actionId,
              type: 'CREATE_EVENT',
              status: 'pending',
              description: `Create event: "${fc.args.title}" on ${fc.args.date}`,
              payload: {
                title: fc.args.title as string,
                date: fc.args.date as string,
                description: fc.args.description as string | undefined,
                endDate: fc.args.endDate as string | undefined,
                time: fc.args.time as string | undefined,
                sources: eventSources.length > 0 ? eventSources : undefined
              }
            });
            break;
          }

          case 'update_event': {
            const eventId = fc.args.eventId as string;
            const event = visibleEvents.find(e => e.id === eventId);
            actions.push({
              id: actionId,
              type: 'UPDATE_EVENT',
              status: 'pending',
              description: `Update event: "${event?.title || eventId}"`,
              payload: {
                eventId,
                changes: {
                  title: fc.args.title as string | undefined,
                  date: fc.args.date as string | undefined,
                  description: fc.args.description as string | undefined,
                  endDate: fc.args.endDate as string | undefined,
                  time: fc.args.time as string | undefined,
                  sources: fc.args.sources as string[] | undefined
                }
              }
            });
            break;
          }

          case 'delete_event': {
            const eventId = fc.args.eventId as string;
            const event = visibleEvents.find(e => e.id === eventId);
            actions.push({
              id: actionId,
              type: 'DELETE_EVENT',
              status: 'pending',
              description: `Delete event: "${event?.title || eventId}"`,
              payload: {
                eventId,
                eventTitle: event?.title || 'Unknown'
              }
            });
            break;
          }

          case 'update_timeline_metadata':
            actions.push({
              id: actionId,
              type: 'UPDATE_METADATA',
              status: 'pending',
              description: 'Update timeline metadata',
              payload: {
                changes: {
                  title: fc.args.title as string | undefined,
                  description: fc.args.description as string | undefined
                }
              }
            });
            break;
        }
      }
    }
  }

  return { text, actions };
}

/**
 * Create AI error object
 */
function createError(code: AIErrorCode, message: string, details?: string): AIError {
  const retryable = code === 'RATE_LIMITED' || code === 'NETWORK_ERROR';
  return { code, message, details, retryable };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate API key by making a minimal test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generation_config: { max_output_tokens: 10 }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Gemini 2.5 Flash pricing (USD per 1M tokens)
const GEMINI_PRICING = {
  input: 0.075,   // $0.075 per 1M input tokens
  output: 0.30,   // $0.30 per 1M output tokens
};

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

/**
 * Extract usage data from Gemini response
 */
function extractUsage(response: GeminiResponse): AIUsage {
  const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
  const promptTokens = usage.promptTokenCount || 0;
  const completionTokens = usage.candidatesTokenCount || 0;
  const estimatedCostUsd =
    (promptTokens / 1_000_000) * GEMINI_PRICING.input +
    (completionTokens / 1_000_000) * GEMINI_PRICING.output;

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUsd,
  };
}

/**
 * Send message to Gemini with two-step approach:
 * 1. If search needed: Call with google_search to get grounded facts
 * 2. Call with function_declarations to process into actions
 */
export async function sendMessage(
  apiKey: string,
  context: AIContext,
  userMessage: string
): Promise<{ text: string; actions: AIAction[]; usage: AIUsage }> {
  try {
    let researchText = '';
    let groundingSources: string[] = [];
    const totalUsage: AIUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };

    // Step 1: Search if needed
    if (needsWebSearch(userMessage)) {
      const searchContents = buildContents(SEARCH_SYSTEM_PROMPT, context, userMessage);

      const searchResponse = await callGemini(apiKey, searchContents, [{ google_search: {} }]);
      const searchResult = extractTextAndSources(searchResponse);
      const searchUsage = extractUsage(searchResponse);

      researchText = searchResult.text;
      groundingSources = filterValidSources(searchResult.sources);
      totalUsage.promptTokens += searchUsage.promptTokens;
      totalUsage.completionTokens += searchUsage.completionTokens;
      totalUsage.totalTokens += searchUsage.totalTokens;
      totalUsage.estimatedCostUsd += searchUsage.estimatedCostUsd;
    }

    // Step 2: Process with function calling
    const wantsEvents = wantsToCreateEvents(userMessage);

    // Choose the right prompt based on user intent
    const systemPrompt = wantsEvents ? CREATE_EVENTS_PROMPT : GENERAL_ACTION_PROMPT;

    // Build prompt with research context if available
    const actionPrompt = researchText
      ? `${userMessage}\n\nResearch findings:\n${researchText}\n\nSources: ${groundingSources.join(', ')}`
      : userMessage;

    const actionContents = buildContents(systemPrompt, context, actionPrompt);

    // Use 'ANY' mode to force function calls when user wants to create events
    const actionResponse = await callGemini(
      apiKey,
      actionContents,
      [{ function_declarations: TIMELINE_FUNCTIONS }],
      wantsEvents ? { mode: 'ANY' } : undefined
    );

    const actionUsage = extractUsage(actionResponse);
    totalUsage.promptTokens += actionUsage.promptTokens;
    totalUsage.completionTokens += actionUsage.completionTokens;
    totalUsage.totalTokens += actionUsage.totalTokens;
    totalUsage.estimatedCostUsd += actionUsage.estimatedCostUsd;

    const result = parseFunctionCalls(actionResponse, context.visibleEvents, groundingSources);

    // If we did research but got no actions, include research text in response
    if (researchText && result.actions.length === 0 && !result.text) {
      result.text = researchText;
    }

    return { ...result, usage: totalUsage };

  } catch (error) {
    console.error('[AI Service] Error:', error);

    if ((error as AIError).code) {
      throw error;
    }

    const apiError = error as { status?: number; error?: { error?: { message?: string } } };
    if (apiError.status === 400) {
      const msg = apiError.error?.error?.message || 'Bad request';
      throw createError('NETWORK_ERROR', msg);
    }
    if (apiError.status === 429) {
      throw createError('RATE_LIMITED', 'Rate limit exceeded. Please wait.');
    }

    throw createError('NETWORK_ERROR', 'Failed to connect to AI service', String(error));
  }
}
