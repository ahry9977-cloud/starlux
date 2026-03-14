export type InvokeLLMInput = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export type InvokeLLMResult = {
  choices?: Array<{ message?: { content?: string } }>;
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function getEnv(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export async function invokeLLM(input: InvokeLLMInput): Promise<InvokeLLMResult> {
  const apiKey = getEnv("OPENAI_API_KEY");
  const baseUrl = getEnv("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  const model = getEnv("OPENAI_MODEL") || "gpt-4o-mini";
  const timeoutMsRaw = getEnv("OPENAI_TIMEOUT_MS");
  const timeoutMs = timeoutMsRaw ? Number(timeoutMsRaw) : 25_000;

  if (!apiKey) {
    return {
      choices: [
        {
          message: {
            content:
              "LLM غير مُفعّل: عيّن OPENAI_API_KEY (ويمكنك اختيارياً تعيين OPENAI_MODEL/OPENAI_BASE_URL).",
          },
        },
      ],
    };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 25_000);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: input.messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        choices: [
          {
            message: {
              content: `LLM error: HTTP ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`,
            },
          },
        ],
      };
    }

    const json = (await res.json()) as OpenAIChatCompletionResponse;
    return json;
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "LLM request timed out" : String(e?.message ?? e);
    return { choices: [{ message: { content: `LLM error: ${msg}` } }] };
  } finally {
    clearTimeout(t);
  }
}
