"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryByArrayOfObjects = void 0;
const Logger_1 = require("./../Logger");
const l = (0, Logger_1.getLogger)('ChatHistoryQueryEngine');
class QueryByArrayOfObjects extends Array {
    constructor(...items) {
        super(...items);
        l.info(`ChatHistoryQueryEngine initialization...`);
    }
    query(query) {
        l.info(`query: ${JSON.stringify(query)}`);
        return this.filter((item) => this.evaluate(item, query));
    }
    evaluate(item, query) {
        if ('$and' in query ||
            '$or' in query ||
            '$nor' in query ||
            '$not' in query) {
            const operator = Object.keys(query)[0];
            const values = query[operator];
            if (!values)
                return true;
            switch (operator) {
                case '$and':
                    return values.every((value) => this.evaluate(item, value));
                case '$or':
                    return values.some((value) => this.evaluate(item, value));
                case '$nor':
                    return !values.some((value) => this.evaluate(item, value));
                case '$not':
                    return !values.every((value) => this.evaluate(item, value));
                default:
                    throw new Error(`Invalid operator: ${operator}`);
            }
        }
        else {
            for (let key in query) {
                const conditions = query[key];
                const fieldValue = item[key];
                if ('$eq' in conditions ||
                    '$ne' in conditions ||
                    '$gt' in conditions ||
                    '$gte' in conditions ||
                    '$lt' in conditions ||
                    '$lte' in conditions ||
                    '$in' in conditions ||
                    '$contains' in conditions ||
                    '$regex' in conditions) {
                    const opConditions = conditions;
                    for (let op in opConditions) {
                        const condition = opConditions[op];
                        switch (op) {
                            case '$eq':
                                if (fieldValue !== condition)
                                    return false;
                                break;
                            case '$ne':
                                if (fieldValue === condition)
                                    return false;
                                break;
                            case '$gt':
                                if (fieldValue <= condition)
                                    return false;
                                break;
                            case '$gte':
                                if (fieldValue < condition)
                                    return false;
                                break;
                            case '$lt':
                                if (fieldValue >= condition)
                                    return false;
                                break;
                            case '$lte':
                                if (fieldValue > condition)
                                    return false;
                                break;
                            case '$in':
                                if (!condition.includes(fieldValue))
                                    return false;
                                break;
                            case '$contains':
                                if (typeof fieldValue === 'string' &&
                                    fieldValue.indexOf(condition) === -1)
                                    return false;
                                break;
                            case '$regex':
                                if (typeof fieldValue === 'string' &&
                                    !condition.test(fieldValue))
                                    return false;
                                break;
                            default:
                                throw new Error(`Invalid operator: ${op}`);
                        }
                    }
                }
                else if (typeof fieldValue === 'object' && fieldValue !== null) {
                    if (!this.evaluate(fieldValue, conditions))
                        return false;
                }
            }
        }
        return true;
    }
    // fix that prevent call empty constructor when use map, filter, etc.
    static get [Symbol.species]() {
        return Array;
    }
}
exports.QueryByArrayOfObjects = QueryByArrayOfObjects;
