import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import Image = OpenAI.Image;
import ImageGenerateParams = OpenAI.ImageGenerateParams;
import * as RunsAPI from 'openai/src/resources/beta/threads/runs/runs';
import { ThreadCreateAndRunParams } from 'openai/src/resources/beta/threads/threads';

@Injectable()
export class OpenAIService {
  private readonly openAI: OpenAI;

  constructor(
    @InjectPinoLogger(OpenAIService.name)
    private readonly log: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.openAI = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_TOKEN'),
    });
  }

  async createAndRunThread(
    body: ThreadCreateAndRunParams,
  ): Promise<RunsAPI.Run> {
    return this.openAI.beta.threads.createAndRun(body);
  }

  async generateImages(body: ImageGenerateParams): Promise<Image[]> {
    const { data } = await this.openAI.images.generate(body);

    return data;
  }

  async waitForRun(threadId: string, runId: string): Promise<void> {
    let error: Error;
    let remains = 3;

    while (true) {
      remains -= 1;
      if (remains < 0) {
        break;
      }

      try {
        const result = await this.openAI.beta.threads.runs.retrieve(
          threadId,
          runId,
        );
        if (result.status === 'completed') {
          return;
        }

        await waitFor();
      } catch (error) {
        error = error as Error;
      }
    }

    throw error ? error : new Error('Timeout');
  }

  async retrieveLatestAssistantThreadMessageContent(
    threadId: string,
  ): Promise<string> {
    const results = await this.openAI.beta.threads.messages.list(threadId);

    const assistantMessages = results.data
      .filter((message) => message.role === 'assistant')
      .sort((a, b) => b.created_at - a.created_at);
    if (assistantMessages.length === 0) {
      throw new Error('No assistant message found');
    }

    const latestMessage = assistantMessages[0];
    if (
      latestMessage.content.length === 0 ||
      typeof latestMessage.content[0]['text'] === undefined ||
      typeof latestMessage.content[0]['text']['value'] === undefined
    ) {
      throw new Error('No assistant message content found');
    }

    return latestMessage.content[0]['text']['value'] as string;
  }
}

const waitFor = (timeout: number = 8 * 1000): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};
