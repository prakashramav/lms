# AI Provider Configuration & Switching

## Overview
The platform abstracts AI model providers behind `BaseAIProvider`, allowing zero-downtime switching between Google Gemini, OpenAI, and local mock testing.

---

## Supported Providers

| Provider | Adapter Class | Default Model | Config Requirement |
|---|---|---|---|
| **Google Gemini** | `GeminiProvider` | `gemini-1.5-flash` | `GEMINI_API_KEY` |
| **OpenAI** | `OpenAIProvider` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| **Mock (Offline)** | `MockAIProvider` | `deterministic-engine` | *None* (Auto-fallback) |

---

## Configuration via Environment Variables

To select a provider, set in `.env`:
```env
# Choose provider: gemini | openai | mock
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your_google_gemini_api_key

# Alternatively for OpenAI:
# AI_PROVIDER=openai
# AI_MODEL=gpt-4o-mini
# OPENAI_API_KEY=your_openai_api_key
```

---

## Automated Fallback & Offline Development
If no API key is provided, or if `AI_PROVIDER=mock`, the system activates `MockAIProvider`:
- Provides instant, zero-cost responses.
- Generates 4-tier progressive hints (`Conceptual`, `Approach`, `Pseudocode`, `Direct Guidance`).
- Generates structured code reviews with complexity metrics.
- Provides error diagnosis and lesson summaries.
- Allows 100% of automated test suites and local development workflows to execute without internet access or billing costs.
