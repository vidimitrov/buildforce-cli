# Task 001: Update Model Initialization

## Architecture context

The CLI tool currently uses the OpenRouter API for LLM functionality, with configuration managed through environment variables:

- OPENROUTER_API_KEY for authentication
- OPENROUTER_MODEL for model selection (defaults to "anthropic/claude-3.7-sonnet:thinking")

## Specification context

The tool needs to provide flexible configuration options while maintaining a good user experience. This includes:

- Secure handling of API keys
- Clear default values
- Proper error handling
- Backward compatibility

## RULES

1. Maintain backward compatibility with existing OPENROUTER\_\* variables
2. Prioritize new BUILDFORCE\_\* variables over legacy ones
3. Ensure secure handling of API keys
4. Provide clear error messages for missing or invalid configuration
5. Follow TypeScript best practices and maintain type safety

## Sub-Tasks & Progress Tracking

- [x] Add new environment variable handling for BUILDFORCE_API_KEY and BUILDFORCE_MODEL
- [x] Implement fallback logic for backward compatibility
- [x] Add validation for API key presence
- [x] Add type definitions for configuration options
- [x] Update model initialization code
- [x] Add error handling for missing or invalid configuration

## Recap

All subtasks have been completed successfully:

1. Environment variable handling:

   - Implemented getModelConfig function
   - Added support for OPENROUTER\_\* variables
   - Added proper error handling

2. Model initialization:

   - Updated to use new configuration
   - Added type safety with TypeScript
   - Implemented proper error messages

3. Testing:
   - Verified with different variable combinations
   - Confirmed error handling works
   - Tested in actual CLI usage

## Overview

Update the model initialization code to use the new BUILDFORCE*API_KEY and BUILDFORCE_MODEL environment variables while maintaining backward compatibility with existing OPENROUTER*\* variables.

## Implementation Plan

### Model Configuration Updates

1. Environment Variable Handling:

```typescript
const getModelConfig = () => {
  const apiKey =
    process.env.BUILDFORCE_API_KEY || process.env.OPENROUTER_API_KEY;
  const model =
    process.env.BUILDFORCE_MODEL ||
    process.env.OPENROUTER_MODEL ||
    "anthropic/claude-3.7-sonnet:thinking";

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not found. Please set BUILDFORCE_API_KEY in your .env file."
    );
  }

  return { apiKey, model };
};
```

2. Model Initialization:

```typescript
const model = new ChatOpenAI({
  apiKey: getModelConfig().apiKey,
  model: getModelConfig().model,
  temperature: 0.3,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});
```

## Testing / Verification Steps

1. Environment Variable Testing:

   - Test with only BUILDFORCE\_\* variables set
   - Test with only OPENROUTER\_\* variables set
   - Test with both sets of variables set
   - Test with no variables set

2. Model Initialization:

   - Verify correct API key is used
   - Verify correct model is selected
   - Verify error handling works as expected

3. Integration Testing:
   - Test model initialization in actual CLI usage
   - Verify backward compatibility works in practice
