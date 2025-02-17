"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStorage = void 0;
const helpers_1 = require("../helpers");
const Session_1 = require("./Session");
const Logger_1 = require("./../Logger");
const l = (0, Logger_1.getLogger)('SessionStorage');
class SessionStorage {
    client;
    sessionTtl;
    appName;
    constructor(client, sessionTtl, appName) {
        this.client = client;
        this.sessionTtl = sessionTtl;
        this.appName = appName;
        l.info('SessionStorage initialization...');
    }
    getChatCompletionSessionKey(sessionId, systemMessageName) {
        return `app:${this.appName}:api_type:chat_completion:function:session_storage:session:${sessionId}:system_message:${systemMessageName}`;
    }
    async isExists(sessionId, systemMessageName) {
        const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
        l.info(`Check session exists by key: ${sessionKey}`);
        const result = await this.client.exists(sessionKey);
        return result === 1;
    }
    async createSession(sessionId, systemMessageName, systemMessage, model, modelPreset, examples, messages, ctx) {
        const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
        l.info(`Create session by key: ${sessionKey}`);
        const timestamp = (0, helpers_1.getTimestamp)();
        const [userMessage] = messages;
        if (!systemMessage && !userMessage) {
            throw new Error("Can't create session without system and user messages");
        }
        const session = new Session_1.Session(this, {
            sessionId,
            systemMessageName,
            systemMessage,
            model,
            modelPreset,
            messages: messages,
            examples,
            lastMessageByRole: {
                user: userMessage,
                assistant: null,
            },
            handlersCount: {},
            ctx: ctx || {},
            messageAccumulator: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            lastError: null,
        });
        await this.client.set(sessionKey, JSON.stringify(session), 'EX', this.sessionTtl);
    }
    async appendMessages(sessionId, systemMessageName, newMessages, ctx) {
        try {
            l.info(`Append messages to session ${sessionId}, systemMessageName: ${systemMessageName}`);
            const session = await this.getSession(sessionId, systemMessageName);
            newMessages.forEach((newMessage) => {
                session.messages.push(newMessage);
                session.lastMessageByRole[newMessage.author] = newMessage;
            });
            session.updatedAt = (0, helpers_1.getTimestamp)();
            const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
            if (!session.messageAccumulator) {
                session.messageAccumulator = [];
            }
            if (ctx)
                session.ctx = { ...session.ctx, ...ctx };
            await this.client.set(sessionKey, JSON.stringify(session), 'EX', this.sessionTtl);
        }
        catch (error) {
            l.error(error);
            throw error;
        }
    }
    async appendMessagesToAccumulator(sessionId, systemMessageName, newMessages, session, ctx) {
        if (!session) {
            session = await this.getSession(sessionId, systemMessageName);
        }
        if (!session.messageAccumulator) {
            session.messageAccumulator = [];
        }
        session.messageAccumulator.push(...newMessages);
        if (ctx)
            session.ctx = { ...session.ctx, ...ctx };
        const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
        await this.client.set(sessionKey, JSON.stringify(session), 'EX', this.sessionTtl);
    }
    async deleteSession(sessionId, systemMessageName) {
        const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
        l.info(`Delete session by key: ${sessionKey}`);
        await this.client.del(sessionKey);
    }
    async deleteSessionsById(sessionId) {
        l.info(`Delete sessions by id: ${sessionId}`);
        const keys = await this.findKeysByPartialName(sessionId);
        await this.client.del(keys);
    }
    async findKeysByPartialName(partialKey) {
        try {
            l.info(`Find keys by partial name: ${partialKey}`);
            return this.client.keys(`*${partialKey}*`);
        }
        catch (error) {
            l.error(error);
            throw error;
        }
    }
    async incrementHandlerCount(sessionId, systemMessageName, handlerName) {
        l.info(`Increment handler count: ${handlerName}, sessionId: ${sessionId}, systemMessageName: ${systemMessageName}`);
        const session = await this.getSession(sessionId, systemMessageName);
        if (!session.handlersCount[handlerName]) {
            session.handlersCount[handlerName] = 0;
        }
        session.handlersCount[handlerName] += 1;
        const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
        await this.client.set(sessionKey, JSON.stringify(session), 'EX', this.sessionTtl);
    }
    async save(session) {
        l.info(`Save session: ${session.sessionId}, systemMessageName: ${session.systemMessageName}`);
        const existingSession = await this.getSession(session.sessionId, session.systemMessageName);
        // fix redis frequency save by the same key issue
        if ((0, helpers_1.deepEqual)(existingSession, session)) {
            l.warn(`sessionId ${session.sessionId}, systemMessageName: ${session.systemMessageName} - session not changed, skip save and return existing session`);
            return existingSession;
        }
        existingSession.messages.length = 0;
        session.messages.forEach((message) => {
            existingSession.messages.push(message);
            existingSession.lastMessageByRole[message.author] = message;
        });
        existingSession.ctx = session.ctx;
        existingSession.updatedAt = (0, helpers_1.getTimestamp)();
        existingSession.messageAccumulator = session.messageAccumulator;
        existingSession.lastError = session.lastError;
        const sessionKey = this.getChatCompletionSessionKey(session.sessionId, session.systemMessageName);
        await this.client.set(sessionKey, JSON.stringify(existingSession), 'EX', this.sessionTtl);
        return this.getSession(session.sessionId, session.systemMessageName);
    }
    async getSession(sessionId, systemMessageName) {
        try {
            l.info(`Get session: ${sessionId}, systemMessageName: ${systemMessageName}`);
            const sessionKey = this.getChatCompletionSessionKey(sessionId, systemMessageName);
            const sessionData = await this.client.get(sessionKey);
            if (!sessionData) {
                throw new Error(`Session ${sessionId} not found`);
            }
            const SessionData = JSON.parse(sessionData);
            const session = new Session_1.Session(this, SessionData);
            return session;
        }
        catch (error) {
            l.error(error);
            throw error;
        }
    }
}
exports.SessionStorage = SessionStorage;
