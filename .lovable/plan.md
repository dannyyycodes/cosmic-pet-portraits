

# Switch Report Generation to Claude Sonnet 4.5 via OpenRouter

## What Changes

The cosmic report generation currently uses the Lovable AI Gateway (Gemini 2.5 Flash). We'll switch it to call OpenRouter's API with Claude Sonnet 4.5 instead.

## Steps

1. **Store OpenRouter API key** — Save your OpenRouter key as a backend secret called `OPENROUTER_API_KEY`

2. **Update `generate-cosmic-report/index.ts`** — Three targeted changes:
   - Replace `LOVABLE_API_KEY` reference with `OPENROUTER_API_KEY`
   - Change the API endpoint from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://openrouter.ai/api/v1/chat/completions`
   - Change the model from `google/gemini-2.5-flash` to `anthropic/claude-sonnet-4.5`
   - Add OpenRouter-required headers (`HTTP-Referer`, `X-Title`)

3. **Deploy and test** — Redeploy the edge function and verify report generation still works

## Technical Detail

The OpenRouter API is OpenAI-compatible, so the request/response format stays identical — only the URL, auth header, and model name change. The `response_format: { type: "json_object" }` parameter is supported by Claude on OpenRouter.

