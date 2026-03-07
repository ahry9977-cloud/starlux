export type InvokeLLMInput = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export type InvokeLLMResult = {
  choices?: Array<{ message?: { content?: string } }>;
};

export async function invokeLLM(_input: InvokeLLMInput): Promise<InvokeLLMResult> {
  return { choices: [{ message: { content: "" } }] };
}
