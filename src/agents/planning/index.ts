import { HumanMessage } from "@langchain/core/messages";
import agent from "./agent";
/**
 * Starts a new planning conversation
 * @param threadId The thread ID to use
 * @returns Initial welcome message
 */
export const startPlanningConversation = async (
  threadId: string
): Promise<string> => {
  const response = await chat("Let's start a new planning session.", threadId);

  return response.toString();
};

/**
 * Chat with the planning agent
 * @param message The input text to send to the model
 * @param threadId The thread ID to use
 * @returns Promise with the model's response
 */
export const chat = async (message: string, threadId: string) => {
  const finalState = await agent.invoke(
    { messages: [new HumanMessage(message)] },
    {
      configurable: {
        thread_id: threadId,
      },
    }
  );

  const response = finalState.messages[finalState.messages.length - 1].content;

  return response;
};
