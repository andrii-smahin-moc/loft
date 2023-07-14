import { ChatCompletionMessage, SessionData } from './../@types';
import { SessionStorage } from './SessionStorage';
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from 'openai';
import { SystemMessageType } from '../schema/CreateChatCompletionRequestSchema';

export class Session implements SessionData {
  readonly sessionId: string;
  readonly systemMessageName: string;
  readonly modelPreset: SystemMessageType['modelPreset'];
  readonly messages: ChatCompletionMessage[];
  readonly lastMessageByRole: {
    user: ChatCompletionRequestMessage | null;
    assistant: ChatCompletionResponseMessage | null;
    system: ChatCompletionResponseMessage | null;
    function: ChatCompletionResponseMessage | null;
  };
  readonly handlersCount: Record<string, number>;
  public ctx: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  constructor(
    private readonly sessionStorage: SessionStorage,
    sessionData: SessionData,
  ) {
    this.sessionId = sessionData.sessionId;
    this.systemMessageName = sessionData.systemMessageName;
    this.modelPreset = sessionData.modelPreset;
    this.messages = sessionData.messages;
    this.lastMessageByRole = sessionData.lastMessageByRole;
    this.handlersCount = sessionData.handlersCount;
    this.ctx = sessionData.ctx;
    this.createdAt = sessionData.createdAt;
    this.updatedAt = sessionData.updatedAt;
  }

  public async saveCtx(): Promise<void> {
    this.sessionStorage.saveCtx(
      this.sessionId,
      this.systemMessageName,
      this.ctx,
    );
  }

  public async delete(): Promise<void> {
    this.sessionStorage.deleteSession(this.sessionId, this.systemMessageName);
  }

  public toJSON(): SessionData {
    return {
      sessionId: this.sessionId,
      systemMessageName: this.systemMessageName,
      modelPreset: this.modelPreset,
      messages: this.messages,
      lastMessageByRole: this.lastMessageByRole,
      handlersCount: this.handlersCount,
      ctx: this.ctx,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
