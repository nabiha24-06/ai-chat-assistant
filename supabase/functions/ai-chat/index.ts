import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  messages: { role: string; content: string }[];
  documentText?: string;
  conversationId?: string;
  generateType?: "email" | "summary" | "social" | "report" | "meeting_notes" | null;
  tone?: string;
}

const AI_API_KEY = Deno.env.get("AI_Assistant");
const MODEL_CHAIN = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "calculator",
        description: "Evaluate a mathematical expression and return the exact result. Supports basic arithmetic, parentheses, percentages, powers, and common math functions.",
        parameters: {
          type: "OBJECT",
          properties: {
            expression: {
              type: "STRING",
              description: "The mathematical expression to evaluate, e.g. '2 + 3 * 4', '(15 + 5) / 4', '2^10', 'sqrt(144)'",
            },
          },
          required: ["expression"],
        },
      },
      {
        name: "weather_datetime",
        description: "Get the current date and time, or mock weather data for a given city. Use this when the user asks about the current time, date, day of the week, or weather for a specific city.",
        parameters: {
          type: "OBJECT",
          properties: {
            query_type: {
              type: "STRING",
              enum: ["datetime", "weather"],
              description: "Whether to get the current date/time or weather for a city",
            },
            city: {
              type: "STRING",
              description: "The city to get weather for (only needed if query_type is 'weather')",
            },
          },
          required: ["query_type"],
        },
      },
    ],
  },
];

function executeCalculator(expression: string): string {
  const cleaned = expression
    .replace(/sqrt/gi, "Math.sqrt")
    .replace(/sin/gi, "Math.sin")
    .replace(/cos/gi, "Math.cos")
    .replace(/tan/gi, "Math.tan")
    .replace(/log/gi, "Math.log10")
    .replace(/ln/gi, "Math.log")
    .replace(/abs/gi, "Math.abs")
    .replace(/pi/gi, "Math.PI")
    .replace(/e\b/gi, "Math.E")
    .replace(/\^/g, "**")
    .replace(/%/g, "/100");

  if (!/^[\d\s+\-*/().,a-zA-Z_*]+$/.test(cleaned)) {
    return `Error: Invalid expression "${expression}"`;
  }

  try {
    const result = Function(`"use strict"; return (${cleaned});`)();
    if (typeof result !== "number" || !isFinite(result)) {
      return `Error: Could not compute "${expression}"`;
    }
    const rounded = Math.round(result * 1e10) / 1e10;
    return `${rounded}`;
  } catch (e) {
    return `Error: Could not evaluate "${expression}" — ${(e as Error).message}`;
  }
}

function executeWeatherDatetime(queryType: string, city?: string): string {
  if (queryType === "datetime") {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    return `Current date: ${dateStr}\nCurrent time: ${timeStr}\nTimezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  }

  if (queryType === "weather") {
    const cityName = city || "Unknown";
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear", "Overcast"];
    const temps = [18, 22, 25, 15, 28, 12, 30, 20];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = temps[Math.floor(Math.random() * temps.length)];
    const humidity = 40 + Math.floor(Math.random() * 40);
    const windSpeed = 5 + Math.floor(Math.random() * 20);
    return `Weather for ${cityName}:\nCondition: ${condition}\nTemperature: ${temp}°C (feels like ${temp + Math.floor(Math.random() * 4 - 2)}°C)\nHumidity: ${humidity}%\nWind: ${windSpeed} km/h\nNote: This is mock weather data for demonstration purposes.`;
  }

  return "Error: Unknown query type";
}

function executeTool(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "calculator") {
    return executeCalculator(String(args.expression || ""));
  }
  if (toolName === "weather_datetime") {
    return executeWeatherDatetime(String(args.query_type || "datetime"), args.city ? String(args.city) : undefined);
  }
  return `Error: Unknown tool "${toolName}"`;
}

function buildSystemPrompt(documentText?: string, generateType?: string | null, tone?: string): string {
  let prompt = "You are a helpful, knowledgeable AI assistant. You can answer questions, maintain conversation context, and handle follow-up questions naturally. You have access to tools (a calculator and a weather/date-time tool) that you can call when the user's question requires computation or real-time information.\n\nIMPORTANT: When the user asks a follow-up question (e.g. 'what about it?', 'summarize that part', 'tell me more'), resolve the reference using the preceding conversation messages. Always consider the full conversation history to understand what the user is referring to.\n\nWhen deciding whether to use a tool:\n- If the user asks a math question or needs a calculation, use the calculator tool.\n- If the user asks about the current date, time, day of the week, or weather for a city, use the weather_datetime tool.\n- For general conversation, questions you can answer from your knowledge, or follow-up questions, respond normally without calling any tool.\n\nBe concise but thorough. Format responses with markdown when helpful (bullet points, bold text, etc.).";

  if (documentText) {
    prompt += `\n\nIMPORTANT: The user has uploaded a document. This document context PERSISTS FOR THE ENTIRE CONVERSATION — it remains available for every follow-up message in this thread. Always keep it in mind when answering, even if the user doesn't explicitly mention the document.\n\nWhen answering questions about the uploaded document, follow these rules:\n\n**Primary Source:** Always extract and report facts from the provided document first. When the answer can be found in the document, cite it directly and do not supplement with external information unless the user explicitly asks for more.\n\n**Secondary Fallback:** If the user asks for external information that is NOT in the document (such as external metrics, industry benchmarks, or outside context), do the following in order:\n  1. Explicitly state that the document does not contain this information.\n  2. Then provide the requested details using your general knowledge or available tools.\n  3. Clearly label which part of your answer comes from the document and which comes from general knowledge, so the user can distinguish the two sources.\n\nYou can also:\n- Summarize the document\n- Extract important information\n- Identify key topics\n- Answer specific questions about its contents\n- Answer follow-up questions that reference the document even if they don't explicitly mention it\n- Combine document facts with external knowledge when the user explicitly requests it, always labeling each part\n\n=== DOCUMENT CONTENTS ===\n${documentText}\n=== END DOCUMENT CONTENTS ===`;
  }

  if (generateType) {
    const typeLabels: Record<string, string> = {
      email: "a professional email",
      summary: "a concise summary",
      social: "a social media post",
      report: "a structured report",
      meeting_notes: "meeting notes",
    };
    const label = typeLabels[generateType] || generateType;
    const toneInstruction = tone ? ` The tone should be ${tone}.` : "";
    prompt += `\n\nThe user has requested you to generate ${label}.${toneInstruction} Please produce high-quality content for this request. If the user has uploaded a document, base the generated content on that document. Otherwise, use the user's instructions and context to produce the content.`;
  }

  return prompt;
}

interface GeminiContent {
  role: "user" | "model";
  parts: Record<string, unknown>[];
}

function toGeminiContents(messages: { role: string; content: string }[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    if (msg.role === "tool") continue;
    const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }
  return contents;
}

function getFunctionCalls(parts: Record<string, unknown>[]): { name: string; args: Record<string, unknown> }[] {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  for (const p of parts) {
    if (p.functionCall && typeof p.functionCall === "object") {
      const fc = p.functionCall as { name: string; args: Record<string, unknown> };
      calls.push({ name: fc.name, args: fc.args || {} });
    }
  }
  return calls;
}

function getTextFromParts(parts: Record<string, unknown>[]): string {
  return parts
    .filter((p) => typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

function stripNonToolParts(parts: Record<string, unknown>[]): Record<string, unknown>[] {
  return parts.filter((p) => p.functionCall);
}

class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callGemini(
  model: string,
  contents: GeminiContent[],
  systemPrompt: string,
  useTools: boolean
): Promise<Record<string, unknown>[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7 },
  };

  if (useTools) {
    body.tools = TOOL_DECLARATIONS;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    let errMsg = `Gemini API error (${resp.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      errMsg = `${errMsg}: ${errText.slice(0, 200)}`;
    }
    throw new GeminiError(errMsg, resp.status);
  }

  const data = await resp.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new GeminiError("No response from Gemini model", 500);
  }

  return candidate.content?.parts || [];
}

async function callGeminiWithFallback(
  contents: GeminiContent[],
  systemPrompt: string,
  useTools: boolean
): Promise<Record<string, unknown>[]> {
  let lastError: Error | null = null;

  for (const model of MODEL_CHAIN) {
    try {
      return await callGemini(model, contents, systemPrompt, useTools);
    } catch (e) {
      const err = e as GeminiError;
      lastError = err;
      // Only retry with fallback on rate-limit or server errors
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        continue;
      }
      // For other errors (404, 400, etc.), try next model too
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

function demoModeReply(
  messages: { role: string; content: string }[],
  documentText?: string,
  generateType?: string | null,
  tone?: string
): { reply: string; toolsUsed: { name: string; input: string; result: string }[] } {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMsg?.content || "";

  // Try calculator
  const calcMatch = userText.match(/[\d\s+\-*/().^%]+/);
  if (calcMatch && calcMatch[0].trim().length > 2 && /[\d]/.test(calcMatch[0]) && /[+\-*/^]/.test(calcMatch[0])) {
    const result = executeCalculator(calcMatch[0].trim());
    if (!result.startsWith("Error")) {
      return {
        reply: `**Result:** ${calcMatch[0].trim()} = **${result}**\n\n_(Demo mode — running locally without AI API access)_`,
        toolsUsed: [{ name: "calculator", input: JSON.stringify({ expression: calcMatch[0].trim() }), result }],
      };
    }
  }

  // Date/time
  if (/date|time|day|today|current/i.test(userText) && !documentText) {
    const result = executeWeatherDatetime("datetime");
    return {
      reply: `${result}\n\n_(Demo mode — running locally without AI API access)_`,
      toolsUsed: [{ name: "weather_datetime", input: JSON.stringify({ query_type: "datetime" }), result }],
    };
  }

  // Document-based queries
  if (documentText) {
    const docSnippet = documentText.slice(0, 800);
    if (/summar/i.test(userText)) {
      return {
        reply: `**Document Summary (Demo Mode):**\n\nHere is a summary based on the uploaded document:\n\n${docSnippet.slice(0, 400)}...\n\n_(Demo mode — the AI API is currently unavailable. This is a basic extraction from the document.)_`,
        toolsUsed: [],
      };
    }
    return {
      reply: `**Document Content (Demo Mode):**\n\nThe uploaded document contains the following text:\n\n${docSnippet}...\n\n_(Demo mode — the AI API is currently unavailable. This shows the raw extracted text from your document.)_`,
      toolsUsed: [],
    };
  }

  // Generate type
  if (generateType) {
    const toneStr = tone ? ` (${tone} tone)` : "";
    return {
      reply: `**Generated ${generateType}${toneStr} (Demo Mode):**\n\nI'm currently running in demo mode because the AI API is unavailable. In full mode, I would generate a polished ${generateType} based on your request: "${userText}"\n\n_(Demo mode — the AI API is currently unavailable.)_`,
      toolsUsed: [],
    };
  }

  // Generic fallback
  return {
    reply: `I'm currently running in **Demo / Evaluation Mode** because the AI API is temporarily unavailable or rate-limited.\n\nI received your message: "${userText}"\n\nIn demo mode I can:\n- Perform **calculator** operations (try: "what is 25 * 4?")\n- Tell you the **current date and time** (try: "what time is it?")\n- Show **uploaded document contents** (upload a file and ask about it)\n\nOnce the AI API is available again, full conversational AI will resume automatically.`,
    toolsUsed: [],
  };
}

async function handleWithGemini(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  documentText?: string,
  generateType?: string | null,
  tone?: string
): Promise<{ reply: string; toolsUsed: { name: string; input: string; result: string }[] }> {
  // Demo mode: no API key
  if (!AI_API_KEY) {
    return demoModeReply(messages, documentText, generateType, tone);
  }

  const toolsUsed: { name: string; input: string; result: string }[] = [];
  let contents = toGeminiContents(messages);
  const maxIterations = 4;

  for (let i = 0; i < maxIterations; i++) {
    let parts: Record<string, unknown>[];
    try {
      parts = await callGeminiWithFallback(contents, systemPrompt, true);
    } catch (e) {
      const err = e as GeminiError;
      // If all models failed with rate-limit/server errors, fall back to demo mode
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        return demoModeReply(messages, documentText, generateType, tone);
      }
      throw err;
    }

    const functionCalls = getFunctionCalls(parts);

    if (functionCalls.length === 0) {
      return { reply: getTextFromParts(parts) || "I've processed the results.", toolsUsed };
    }

    const modelToolParts = stripNonToolParts(parts);
    const responseParts: Record<string, unknown>[] = [];

    for (const fc of functionCalls) {
      const toolResult = executeTool(fc.name, fc.args || {});
      toolsUsed.push({
        name: fc.name,
        input: JSON.stringify(fc.args || {}),
        result: toolResult,
      });
      responseParts.push({
        functionResponse: {
          name: fc.name,
          response: { result: toolResult },
        },
      });
    }

    contents.push({ role: "model", parts: modelToolParts });
    contents.push({ role: "user", parts: responseParts });
  }

  // Final call without tools to force a text reply
  let finalParts: Record<string, unknown>[];
  try {
    finalParts = await callGeminiWithFallback(contents, systemPrompt, false);
  } catch (e) {
    const err = e as GeminiError;
    if (err.status === 429 || err.status === 500 || err.status === 503) {
      return demoModeReply(messages, documentText, generateType, tone);
    }
    throw err;
  }
  return { reply: getTextFromParts(finalParts) || "I've processed the tool results.", toolsUsed };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, documentText, conversationId, generateType, tone }: RequestBody = await req.json();

    const systemPrompt = buildSystemPrompt(documentText, generateType, tone);
    const { reply, toolsUsed } = await handleWithGemini(messages, systemPrompt, documentText, generateType, tone);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey && conversationId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (lastUserMsg) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: lastUserMsg.content,
          });
        }

        for (const tool of toolsUsed) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "tool",
            content: tool.result,
            tool_name: tool.name,
            tool_input: tool.input,
            tool_result: tool.result,
          });
        }

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: reply,
        });

        if (lastUserMsg) {
          await supabase.from("conversations").update({
            updated_at: new Date().toISOString(),
            title: messages.length <= 1 ? lastUserMsg.content.slice(0, 60) : undefined,
          }).eq("id", conversationId);
        }
      } catch (dbErr) {
        console.error("DB persist error:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({ reply, toolsUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
