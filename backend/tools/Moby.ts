import { z } from 'zod';
import { Tool } from './Tool';
import dotenv from 'dotenv';
import { v4 as uuidV4 } from 'uuid';

dotenv.config();

function createMoby() {
  const paramsSchema = z.object({
    question: z
      .string()
      .describe('Question to ask Triple Whale Moby')
      .default('What is triple whale?'),
    shopId: z
      .string()
      .optional()
      .describe('Shopify store URL')
      .default('madisonbraids.myshopify.com'),
    parentMessageId: z
      .string()
      .optional()
      .describe('Parent message ID for conversation context'),
  });

  return new Tool(
    paramsSchema,
    'moby',
    'Useful for getting e-commerce analytics and insights from Triple Whale Moby',
    async ({ question, shopId, parentMessageId }) => {
      console.log('Asking Moby:', question);

      const TW_TOKEN = process.env.TW_TOKEN;
      const TW_BEARER_TOKEN = process.env.TW_BEARER_TOKEN;
      if (!TW_BEARER_TOKEN && !TW_TOKEN) {
        return 'Error: Triple Whale token not configured. ';
      }

      try {
        const response = await fetch(
          'https://app.triplewhale.com/api/v2/willy/answer-nlq-question',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...(TW_BEARER_TOKEN
                ? { Authorization: `Bearer ${TW_BEARER_TOKEN}` }
                : { 'x-api-key': TW_TOKEN || '' }),
            },
            body: JSON.stringify({
              stream: false,
              shopId: shopId,
              conversationId: (parentMessageId || uuidV4()).toString(),
              source: 'chat',
              userId: 'external-api-user',
              question: question,
              query: question,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const lastMessageText =
          data.messages?.[data.messages.length - 1]?.text + ' ';
        return lastMessageText || 'No answer received from Moby. ';
      } catch (error) {
        console.error('Error querying Moby:', error);
        return 'Error: Could not fetch response from Triple Whale. ';
      }
    }
  );
}

export { createMoby };
