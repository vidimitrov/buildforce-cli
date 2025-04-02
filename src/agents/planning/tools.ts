import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define a simple example weather tool
export const exampleTool = tool(
  async ({ topic }) => {
    // TODO: Generate a joke based on the topic

    const jokes = [
      "Why don't programmers like nature? It has too many bugs!",
      "What do you call a bear with no teeth? A gummy bear!",
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
    ];

    return jokes[Math.floor(Math.random() * jokes.length)];
  },
  {
    name: "jokes", // Name of the tool
    description: "Get a random joke.", // Description of the tool
    schema: z.object({
      topic: z.string().describe("The topic of the joke."), // zod schema of the tool
    }),
  }
);
