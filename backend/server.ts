import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming.mjs';
import { ChatCompletionChunk } from 'openai/resources/chat/completions.mjs';

import { openai } from './clients/openai';
import { gemini } from './clients/gemini';
import { models } from '../shared/constants';
import { systemPrompt } from './constants';
import { processToolUsage, runFirstStream } from './utils';
import { tools } from './tools';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/api/chat', async (req, res) => {
  const { messages, modelName } = req.body;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const model = models.find((m) => m.name === modelName);
    const isGemini = model?.client === 'gemini';
    const client = isGemini ? gemini : openai;
    if (!model) {
      throw new Error('Invalid model name');
    }

    const stream = await client.chat.completions.create({
      messages: [
        ...(model.stream
          ? [{ role: 'system', content: systemPrompt }]
          : [{ role: 'user', content: systemPrompt }]),
        ...messages,
      ] as ChatCompletionMessageParam[],
      model: model.name,
      stream: model.stream,
      ...(model.tools ? { tools, tool_choice: 'auto' } : {}),
    });

    if (model.stream) {
      await runFirstStream(model, stream as Stream<ChatCompletionChunk>, res);
    } else {
      // Handle non-streaming response
      const response = stream as OpenAI.Chat.Completions.ChatCompletion;
      let content = response.choices[0]?.message?.content || '';
      content = await processToolUsage(content);

      res.write(
        `data: ${JSON.stringify({
          type: 'content',
          content: content,
        })}\n\n`
      );
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        content: 'Error: Something went wrong. Please try again.',
      })}\n\n`
    );
    res.end();
  }
});

// Handle all other routes by serving the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});