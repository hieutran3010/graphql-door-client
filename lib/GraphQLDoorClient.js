"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const omit_1 = __importDefault(require("lodash/fp/omit"));
const set_1 = __importDefault(require("lodash/fp/set"));
const map_1 = __importDefault(require("lodash/fp/map"));
const builders_1 = require("./builders");
const types_1 = require("./types");
class GraphQLDoorClient {
    constructor(endpoint, options) {
        this._configGraphQLClient = (endpoint, options) => {
            const { authenticationToken } = options || {};
            let clientOption = {};
            if (authenticationToken) {
                clientOption = set_1.default('headers.authorization', `Bearer ${authenticationToken}`)(clientOption);
            }
            this.graphQLClient = new graphql_request_1.GraphQLClient(endpoint, clientOption);
        };
        this._executeQueryAsync = (entityName, query, operation, queryParams, defaultvalue, id) => {
            const queryVariables = this.queryBuilder.getQueryVariables(queryParams, id);
            const operationName = this.queryBuilder.getOperationName(operation);
            return this.graphQLClient.request(query, queryVariables).then((response) => {
                return this.queryBuilder.compactResponse(entityName, response, operationName, defaultvalue);
            });
        };
        this._executeMutationAsync = (entityName, query, operation, payloadModel, defaultvalue, id) => {
            const mutationVariables = this.mutationBuilder.getMutationVariables(payloadModel, id);
            const operationName = this.mutationBuilder.getOperationName(operation) || operation;
            return this.graphQLClient.request(query, mutationVariables).then((response) => {
                return this.queryBuilder.compactResponse(entityName, response, operationName, defaultvalue);
            });
        };
        this._executeMutationBatchAsync = (entityName, query, operation, payloadModels) => {
            const operationName = this.mutationBuilder.getOperationName(operation) || operation;
            return this.graphQLClient.request(query, { inputs: payloadModels }).then((response) => {
                return this.queryBuilder.compactResponse(entityName, response, operationName, {});
            });
        };
        this.queryManyAsync = (entityName, queryParams, selectFields) => {
            const query = this.queryBuilder.buildQuery(entityName, types_1.QueryOperation.QueryMany, queryParams, selectFields);
            return this._executeQueryAsync(entityName, query, types_1.QueryOperation.QueryMany, queryParams, []);
        };
        this.queryOneAsync = (entityName, queryParams, selectFields) => {
            const query = this.queryBuilder.buildQuery(entityName, types_1.QueryOperation.QueryOne, queryParams, selectFields);
            return this._executeQueryAsync(entityName, query, types_1.QueryOperation.QueryOne, queryParams, {});
        };
        this.getByIdAsync = (entityName, id, queryParams, selectFields) => {
            const query = this.queryBuilder.buildQuery(entityName, types_1.QueryOperation.GetById, {}, selectFields, id);
            return this._executeQueryAsync(entityName, query, types_1.QueryOperation.GetById, queryParams, {}, id);
        };
        this.countAsync = (entityName, query) => {
            const queryBody = this.queryBuilder.buildCountQuery(entityName, query);
            return this.graphQLClient.request(queryBody, { query }).then((response) => {
                return this.queryBuilder.compactCountResponse(entityName, response);
            });
        };
        this.updateAsync = (entityName, id, model, selectFields) => {
            const formattedModel = omit_1.default(['id'])(model);
            const mutation = this.mutationBuilder.build(entityName, types_1.MutationOperation.Update, formattedModel, selectFields, id);
            return this._executeMutationAsync(entityName, mutation, types_1.MutationOperation.Update, formattedModel, {}, id);
        };
        this.deleteAsync = (entityName, id) => {
            const mutation = this.mutationBuilder.build(entityName, types_1.MutationOperation.Delete, undefined, ['id', 'code'], id);
            return this.graphQLClient.request(mutation, { id });
        };
        this.executeCustomMutationAsync = (entityName, mutationName, payload, variable, selectFields) => {
            const mutation = this.mutationBuilder.buildCustomMutationOperation(entityName, mutationName, payload, variable, selectFields);
            return this._executeMutationAsync(entityName, mutation, mutationName, payload, {});
        };
        this._configGraphQLClient(endpoint, options);
        this.queryBuilder = new builders_1.QueryRequestBuilder();
        this.mutationBuilder = new builders_1.MutationRequestBuilder();
    }
    addAsync(entityName, model, selectFields) {
        const formattedModel = omit_1.default(['id'])(model);
        const mutation = this.mutationBuilder.build(entityName, types_1.MutationOperation.Add, formattedModel, selectFields);
        return this._executeMutationAsync(entityName, mutation, types_1.MutationOperation.Add, formattedModel, {});
    }
    addBatchAsync(entityName, models) {
        const formattedBatch = map_1.default((model) => omit_1.default('id')(model))(models);
        const mutation = this.mutationBuilder.buildBatch(entityName, types_1.MutationBatchOperation.AddBatch);
        return this._executeMutationBatchAsync(entityName, mutation, types_1.MutationBatchOperation.AddBatch, formattedBatch);
    }
}
exports.default = GraphQLDoorClient;