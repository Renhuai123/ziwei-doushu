export type AiConfig =
  | { protocol: 'anthropic'; apiKey: string; model: string }
  | { protocol: 'openai'; apiKey: string; baseUrl: string; model: string };

export type AiConfigResult =
  | { ok: true; provider: string; config: AiConfig }
  | { ok: false; missing: string };

export type Env = Readonly<Record<string, string | undefined>>;

interface ProviderSpec {
  protocol: AiConfig['protocol'];
  apiKeyVar: string;
  modelVar: string;
  defaultModel?: string;
  baseUrlVar?: string;
  defaultBaseUrl?: string;
}

// claude-opus-5-5 is the claude-api skill's default model ("ALWAYS use claude-opus-5-5 unless the user names another").
export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

export const PROVIDERS = {
  anthropic: {
    protocol: 'anthropic',
    apiKeyVar: 'ANTHROPIC_API_KEY',
    modelVar: 'ANTHROPIC_MODEL',
    defaultModel: DEFAULT_ANTHROPIC_MODEL,
  },
  deepseek: {
    protocol: 'openai',
    apiKeyVar: 'DEEPSEEK_API_KEY',
    modelVar: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    defaultBaseUrl: 'https://api.deepseek.com',
  },
  mimo: {
    protocol: 'openai',
    apiKeyVar: 'MIMO_API_KEY',
    modelVar: 'MIMO_MODEL',
    baseUrlVar: 'MIMO_BASE_URL',
  },
  'openai-compatible': {
    protocol: 'openai',
    apiKeyVar: 'OPENAI_COMPAT_API_KEY',
    modelVar: 'OPENAI_COMPAT_MODEL',
    baseUrlVar: 'OPENAI_COMPAT_BASE_URL',
  },
} as const satisfies Record<string, ProviderSpec>;

type ProviderId = keyof typeof PROVIDERS;

function isProviderId(id: string): id is ProviderId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, id);
}

function read(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function parseAiConfig(env: Env): AiConfigResult {
  const requested = read(env, 'AI_PROVIDER');
  const id = requested ?? (read(env, 'ANTHROPIC_API_KEY') ? 'anthropic' : 'deepseek');
  if (!isProviderId(id)) return { ok: false, missing: 'AI_PROVIDER' };

  const spec: ProviderSpec = PROVIDERS[id];
  const apiKey = read(env, spec.apiKeyVar);
  if (!apiKey) return { ok: false, missing: spec.apiKeyVar };
  if (spec.protocol === 'anthropic') {
    const model = read(env, spec.modelVar) ?? spec.defaultModel ?? DEFAULT_ANTHROPIC_MODEL;
    return { ok: true, provider: id, config: { protocol: 'anthropic', apiKey, model } };
  }

  const baseUrl = (spec.baseUrlVar ? read(env, spec.baseUrlVar) : undefined) ?? spec.defaultBaseUrl;
  if (!baseUrl) return { ok: false, missing: spec.baseUrlVar ?? 'AI_BASE_URL' };
  const model = read(env, spec.modelVar) ?? spec.defaultModel;
  if (!model) return { ok: false, missing: spec.modelVar };
  return {
    ok: true,
    provider: id,
    config: { protocol: 'openai', apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model },
  };
}

export function loadAiConfig(): AiConfigResult {
  return parseAiConfig(process.env);
}
