"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageService = void 0;
const Logger_1 = require("./../Logger");
const l = (0, Logger_1.getLogger)('SystemMessageService');
class SystemMessageService {
    systemMessageStorage;
    s3;
    systemMessageComputers = new Map();
    constructor(systemMessageStorage, s3) {
        this.systemMessageStorage = systemMessageStorage;
        this.s3 = s3;
        l.info('SystemMessageService initialization...');
        this.systemMessageStorage = systemMessageStorage;
    }
    use(name, systemMessageComputer) {
        if (this.systemMessageComputers.has(name)) {
            throw new Error(`A systemMessage computer with the name "${name}" already exists.`);
        }
        l.info(`Registered systemMessage computer with the name "${name}".`);
        this.systemMessageComputers.set(name, systemMessageComputer);
    }
    async syncSystemMessages() {
        l.info('getting systemMessages from S3...');
        const systemMessages = await this.s3.getSystemMessages();
        l.info('syncing systemMessages to redis...');
        await this.systemMessageStorage.syncSystemMessages(systemMessages);
    }
    async computeSystemMessage(systemMessageName, context) {
        l.info(`getting systemMessage: ${systemMessageName} computer from map...`);
        const systemMessageComputer = this.systemMessageComputers.get(systemMessageName);
        l.info(`getting systemMessage: ${systemMessageName} from redis...`);
        const systemMessage = await this.systemMessageStorage.getSystemMessageByName(systemMessageName);
        if (!systemMessage) {
            throw new Error(`SystemMessage with name "${systemMessageName}" does not exist. Please upload SystemMessages with model presets to AWS S3 for sync to Redis and restart the App.`);
        }
        l.info(`checking if systemMessage by name: ${systemMessageName} and systemMessageComputer exists...`);
        if (systemMessage && systemMessageComputer) {
            l.info(`computing systemMessage: ${systemMessageName} with systemMessageComputer...`);
            return systemMessageComputer(systemMessage, context);
        }
        return systemMessage;
    }
}
exports.SystemMessageService = SystemMessageService;
