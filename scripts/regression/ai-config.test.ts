import assert from 'node:assert/strict';
import { DEFAULT_ANTHROPIC_MODEL, parseAiConfig, type AiConfigResult, type Env } from '../../lib/ai/config';

interface Case {
  name: string;
  env: Env;
  expect: AiConfigResult;
}

const cases: Case[] = [
  {
    name: 'nothing set defaults to deepseek and names its key',
    env: {},
    expect: { ok: false, missing: 'DEEPSEEK_API_KEY' },
  },
  {
    name: 'only an Anthropic key defaults to anthropic with the default model',
    env: { ANTHROPIC_API_KEY: 'k' },
    expect: { ok: true, provider: 'anthropic', config: { protocol: 'anthropic', apiKey: 'k', model: DEFAULT_ANTHROPIC_MODEL } },
  },
  {
    name: 'anthropic model override',
    env: { AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'claude-sonnet-5-5' },
    expect: { ok: true, provider: 'anthropic', config: { protocol: 'anthropic', apiKey: 'k', model: 'claude-sonnet-5-5' } },
  },
  {
    name: 'anthropic selected without a key',
    env: { AI_PROVIDER: 'anthropic' },
    expect: { ok: false, missing: 'ANTHROPIC_API_KEY' },
  },
  {
    name: 'an Anthropic key does not override an explicit provider',
    env: { AI_PROVIDER: 'deepseek', ANTHROPIC_API_KEY: 'a', DEEPSEEK_API_KEY: 'd' },
    expect: {
      ok: true,
      provider: 'deepseek',
      config: { protocol: 'openai', apiKey: 'd', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
    },
  },
  {
    name: 'deepseek overrides',
    env: { AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'd', DEEPSEEK_MODEL: 'deepseek-reasoner' },
    expect: {
      ok: true,
      provider: 'deepseek',
      config: { protocol: 'openai', apiKey: 'd', baseUrl: 'https://api.deepseek.com', model: 'deepseek-reasoner' },
    },
  },
  {
    name: 'mimo needs a base url',
    env: { AI_PROVIDER: 'mimo', MIMO_API_KEY: 'm', MIMO_MODEL: 'mi' },
    expect: { ok: false, missing: 'MIMO_BASE_URL' },
  },
  {
    name: 'mimo needs a model',
    env: { AI_PROVIDER: 'mimo', MIMO_API_KEY: 'm', MIMO_BASE_URL: 'https://x/v1' },
    expect: { ok: false, missing: 'MIMO_MODEL' },
  },
  {
    name: 'mimo complete, trailing slashes trimmed',
    env: { AI_PROVIDER: 'mimo', MIMO_API_KEY: 'm', MIMO_BASE_URL: 'https://x/v1//', MIMO_MODEL: 'mi' },
    expect: { ok: true, provider: 'mimo', config: { protocol: 'openai', apiKey: 'm', baseUrl: 'https://x/v1', model: 'mi' } },
  },
  {
    name: 'openai-compatible missing key',
    env: { AI_PROVIDER: 'openai-compatible', OPENAI_COMPAT_BASE_URL: 'https://x', OPENAI_COMPAT_MODEL: 'm' },
    expect: { ok: false, missing: 'OPENAI_COMPAT_API_KEY' },
  },
  {
    name: 'openai-compatible missing base url',
    env: { AI_PROVIDER: 'openai-compatible', OPENAI_COMPAT_API_KEY: 'k', OPENAI_COMPAT_MODEL: 'm' },
    expect: { ok: false, missing: 'OPENAI_COMPAT_BASE_URL' },
  },
  {
    name: 'openai-compatible complete',
    env: {
      AI_PROVIDER: 'openai-compatible',
      OPENAI_COMPAT_API_KEY: 'k',
      OPENAI_COMPAT_BASE_URL: 'http://localhost:11434/v1',
      OPENAI_COMPAT_MODEL: 'qwen',
    },
    expect: {
      ok: true,
      provider: 'openai-compatible',
      config: { protocol: 'openai', apiKey: 'k', baseUrl: 'http://localhost:11434/v1', model: 'qwen' },
    },
  },
  {
    name: 'blank values count as unset',
    env: { AI_PROVIDER: '  ', ANTHROPIC_API_KEY: '', DEEPSEEK_API_KEY: '   ' },
    expect: { ok: false, missing: 'DEEPSEEK_API_KEY' },
  },
  {
    name: 'unknown provider names AI_PROVIDER',
    env: { AI_PROVIDER: 'gpt', ANTHROPIC_API_KEY: 'k' },
    expect: { ok: false, missing: 'AI_PROVIDER' },
  },
  {
    name: 'inherited object keys are not providers',
    env: { AI_PROVIDER: 'constructor' },
    expect: { ok: false, missing: 'AI_PROVIDER' },
  },
];

for (const { name, env, expect } of cases) {
  assert.deepEqual(parseAiConfig(env), expect, name);
}
console.log(`AI config parsing passed (${cases.length} cases)`);
