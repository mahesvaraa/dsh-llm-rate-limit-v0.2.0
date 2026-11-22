import type { GenerateOptions } from '@deepseek-ai/dsh-llm'

export declare function estimateRequestTokens(
  options: GenerateOptions,
  configuredOutputTokens: number,
  imageTokens: number,
): number
