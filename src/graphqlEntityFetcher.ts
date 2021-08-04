import { Variables } from 'graphql-request/dist/types';
import camelCase from 'lodash/fp/camelCase';
import GraphQLDoorClient from './GraphQLDoorClient';
import { QueryParamsInput, MathResult } from './types';

export default class GraphQLEntityFetcher<T> {
  graphqlClient: GraphQLDoorClient;
  entityName: string;
  onGetSelectFields: () => string[];

  constructor(entityName: string, onGetSelectFields: () => string[], graphqlClient: GraphQLDoorClient) {
    this.entityName = camelCase(entityName);
    this.graphqlClient = graphqlClient;
    this.onGetSelectFields = onGetSelectFields;
  }

  queryManyAsync = (queryParams: QueryParamsInput, selectFields?: string[]): Promise<T[]> => {
    const defaultSelectFields = this.onGetSelectFields();
    return this.graphqlClient.queryManyAsync(this.entityName, queryParams, selectFields || defaultSelectFields);
  };

  queryOneAsync = (queryParams: QueryParamsInput, selectFields?: string[]): Promise<T> => {
    const defaultSelectFields = this.onGetSelectFields();
    return this.graphqlClient.queryOneAsync(this.entityName, queryParams, selectFields || defaultSelectFields);
  };

  getByIdAsync = (id: string, queryParams: QueryParamsInput, selectFields?: string[]): Promise<T> => {
    const defaultSelectFields = this.onGetSelectFields();
    return this.graphqlClient.getByIdAsync(this.entityName, id, queryParams, selectFields || defaultSelectFields);
  };

  countAsync = (query: string): Promise<number> => this.graphqlClient.countAsync(this.entityName, query);

  addAsync = (model: any, selectFields?: string[]): Promise<T> => {
    const defaultSelectFields = this.onGetSelectFields();
    return this.graphqlClient.addAsync(this.entityName, model, selectFields || defaultSelectFields);
  };

  updateAsync = (id: string, model: any, selectFields?: string[]): Promise<T> => {
    const defaultSelectFields = this.onGetSelectFields();
    return this.graphqlClient.updateAsync(this.entityName, id, model, selectFields || defaultSelectFields);
  };

  deleteAsync = (id: string) => this.graphqlClient.deleteAsync(this.entityName, id);
  deleteBatchAsync = (ids: string[]) => this.graphqlClient.deleteBatchAsync(this.entityName, ids);

  executeCustomMutationAsync = (mutationName: string, payload: any, variable: any, selectFields?: string[]) =>
    this.graphqlClient.executeCustomMutationAsync(this.entityName, mutationName, payload, variable, selectFields);

  executeCustomQueryAsync = <TModel>(
    operationName: string,
    queryParams: any,
    variable: any,
    selectFields: string[],
  ): Promise<TModel> =>
    this.graphqlClient.executeCustomQueryAsync(this.entityName, operationName, queryParams, variable, selectFields);

  addBatchAsync(models: T[]) {
    return this.graphqlClient.addBatchAsync<T>(this.entityName, models);
  }

  executeAsync = <TModel>(operationName: string, query: string, variables?: Variables | undefined): Promise<TModel> =>
    this.graphqlClient.executeAsync(this.entityName, operationName, query, variables);

  sumAsync = (fields: string, sumFormula: string, query?: string): Promise<MathResult> =>
    this.graphqlClient.sumAsync(this.entityName, fields, sumFormula, query);
}
