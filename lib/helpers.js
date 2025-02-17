"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanObject = exports.modifyContentOfChoiceByIndex = exports.getContentOfChoiceByIndex = exports.isNotUndefined = exports.sleep = exports.deepEqual = exports.sanitizeAndValidateRedisKey = exports.getTimestamp = exports.redisKeyRegex = void 0;
const luxon_1 = require("luxon");
exports.redisKeyRegex = /^[a-zA-Z0-9:_\.-]*$/;
function getTimestamp() {
    return luxon_1.DateTime.local().toUTC().toSeconds();
}
exports.getTimestamp = getTimestamp;
function sanitizeAndValidateRedisKey(key) {
    // Regular expression to test key
    // This expression will allow alphanumeric characters (a-z, A-Z, 0-9) and the specified symbols (: . - _)
    const sanitizedKey = key.replace(/[\n\r\t\b]/g, '');
    if (exports.redisKeyRegex.test(key)) {
        return sanitizedKey;
    }
    else {
        throw new Error('Invalid Redis key. Allowed only alphanumeric characters (a-z, A-Z, 0-9) and the specified symbols (: . - _)`');
    }
}
exports.sanitizeAndValidateRedisKey = sanitizeAndValidateRedisKey;
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (typeof obj1 !== 'object' ||
        obj1 === null ||
        typeof obj2 !== 'object' ||
        obj2 === null) {
        return false;
    }
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}
exports.deepEqual = deepEqual;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function isNotUndefined(value) {
    return value !== undefined;
}
exports.isNotUndefined = isNotUndefined;
// A function to get the content of a choice by index
function getContentOfChoiceByIndex(ctx, index = 0) {
    return ctx.llmResponse?.candidates[index].content;
}
exports.getContentOfChoiceByIndex = getContentOfChoiceByIndex;
// A function to modify the content of a choice by index
function modifyContentOfChoiceByIndex(ctx, index, newContent) {
    const choiceMessage = ctx.llmResponse?.candidates[index];
    if (choiceMessage) {
        choiceMessage.content = newContent;
    }
}
exports.modifyContentOfChoiceByIndex = modifyContentOfChoiceByIndex;
function cleanObject(obj) {
    for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined) {
            delete obj[key];
        }
        else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            obj[key] = cleanObject(obj[key]);
            if (Object.keys(obj[key]).length === 0) {
                delete obj[key];
            }
        }
    }
    return obj;
}
exports.cleanObject = cleanObject;
