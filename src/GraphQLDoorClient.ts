import {
  GraphQLClient
} from 'graphql-request';
import omit from 'lodash/fp/omit';
import map from 'lodash/fp/map';
import isEmpty from 'lodash/fp/isEmpty';
import {
  QueryRequestBuilder,
  MutationRequestBuilder
} from './builders';
import {
  QueryParamsInput,
  QueryOperation,
  MutationOperation,
  MutationBatchOperation,
  GraphQLDoorClientOptions,
  MathResult,
} from './types';
import {
  Variables
} from 'graphql-request/dist/types';

export default class GraphQLDoorClient {
  private graphQLClient!: GraphQLClient;
  private queryBuilder: QueryRequestBuilder;
  private mutationBuilder: MutationRequestBuilder;
  private options: GraphQLDoorClientOptions | undefined;

  constructor(endpoint: string, options ? : GraphQLDoorClientOptions) {
    this._configGraphQLClient(endpoint, options);
    this.queryBuilder = new QueryRequestBuilder();
    this.mutationBuilder = new MutationRequestBuilder();
    this.options = options;
  }

  private _configGraphQLClient = (endpoint: string, options ? : GraphQLDoorClientOptions) => {
    const {
      headers
    } = options || {};

    this.graphQLClient = new GraphQLClient(endpoint, {
      headers
    });
  };

  private getToken = async () => {
    const {
      authenticationToken,
      getToken
    } = this.options || {};
    let token;
    if (authenticationToken) {
      token = authenticationToken;
    } else if (getToken) {
      token = await getToken();
    }

    if (!isEmpty(token)) {
      this.graphQLClient.setHeader('authorization', `Bearer ${token}`);
    }
  };

  private _executeQueryAsync = async (
    entityName: string,
    query: string,
    operation: QueryOperation | string,
    queryParams: QueryParamsInput,
    defaultValue: any,
    id ? : string,
  ) => {
    const queryVariables = this.queryBuilder.getQueryVariables(queryParams, id);
    const operationName = this.queryBuilder.getOperationName(operation as QueryOperation) || (operation as string);

    await this.getToken();

    return this.graphQLClient.request(query, queryVariables).then((response) => {
      return this.queryBuilder.compactResponse(entityName, response, operationName, defaultValue);
    });
  };

  private _executeMutationAsync = async (
    entityName: string,
    query: string,
    operation: MutationOperation | string,
    payloadModel: any,
    defaultValue: any,
    id ? : string,
  ) => {
    const mutationVariables = this.mutationBuilder.getMutationVariables(payloadModel, id);
    const operationName =
      this.mutationBuilder.getOperationName(operation as MutationOperation) || (operation as string);

    await this.getToken();

    return this.graphQLClient.request(query, mutationVariables).then((response) => {
      return this.queryBuilder.compactResponse(entityName, response, operationName, defaultValue);
    });
  };

  private _executeMutationBatchAsync = async (
    entityName: string,
    query: string,
    operation: MutationBatchOperation | string,
    payloadModels: any[],
  ) => {
    const operationName =
      this.mutationBuilder.getOperationName(operation as MutationBatchOperation) || (operation as string);

    await this.getToken();

    return this.graphQLClient.request(query, {
      inputs: payloadModels
    }).then((response) => {
      return this.queryBuilder.compactResponse(entityName, response, operationName, {});
    });
  };

  queryManyAsync = (entityName: string, queryParams: QueryParamsInput, selectFields ? : string[]) => {
    const query = this.queryBuilder.buildQuery(entityName, QueryOperation.QueryMany, queryParams, selectFields);

    return this._executeQueryAsync(entityName, query, QueryOperation.QueryMany, queryParams, []);
  };

  queryOneAsync = (entityName: string, queryParams: QueryParamsInput, selectFields ? : string[]) => {
    const query = this.queryBuilder.buildQuery(entityName, QueryOperation.QueryOne, queryParams, selectFields);

    return this._executeQueryAsync(entityName, query, QueryOperation.QueryOne, queryParams, {});
  };

  getByIdAsync = (entityName: string, id: string, queryParams: QueryParamsInput, selectFields ? : string[]) => {
    const query = this.queryBuilder.buildQuery(entityName, QueryOperation.GetById, {}, selectFields, id);

    return this._executeQueryAsync(entityName, query, QueryOperation.GetById, queryParams, {}, id);
  };

  countAsync = async (entityName: string, query: string): Promise < number > => {
    const queryBody = this.queryBuilder.buildCountQuery(entityName, query);

    await this.getToken();

    return this.graphQLClient.request(queryBody, {
      query
    }).then((response: any) => {
      return this.queryBuilder.compactCountResponse(entityName, response);
    });
  };

  addAsync < T > (entityName: string, model: T, selectFields ? : string[]) {
    const formattedModel = omit(['id'])(model as any);
    const mutation = this.mutationBuilder.build(entityName, MutationOperation.Add, formattedModel, selectFields);

    return this._executeMutationAsync(entityName, mutation, MutationOperation.Add, formattedModel, {});
  }

  updateAsync = (entityName: string, id: string, model: any, selectFields ? : string[]) => {
    const formattedModel = omit(['id'])(model as any);
    const mutation = this.mutationBuilder.build(entityName, MutationOperation.Update, formattedModel, selectFields, id);
    return this._executeMutationAsync(entityName, mutation, MutationOperation.Update, formattedModel, {}, id);
  };

  deleteAsync = async (entityName: string, id: string) => {
    const mutation = this.mutationBuilder.build(entityName, MutationOperation.Delete, undefined, ['id', 'code'], id);
    await this.getToken();
    return this.graphQLClient.request(mutation, {
      id
    });
  };

  deleteBatchAsync = async (entityName: string, ids: string[]) => {
    const mutation = `mutation($ids: [GUID!]) {
      ${entityName} {
        deleteBatch(ids: $ids) {
          id
          code
        }
      }
    }`;
    await this.getToken();
    return this.graphQLClient.request(mutation, {
      ids
    });
  };

  addBatchAsync < T > (entityName: string, models: T[]) {
    const formattedBatch = map((model: any) => omit('id')(model))(models);

    const mutation = this.mutationBuilder.buildBatch(entityName, MutationBatchOperation.AddBatch);

    return this._executeMutationBatchAsync(entityName, mutation, MutationBatchOperation.AddBatch, formattedBatch);
  }

  executeCustomMutationAsync = (
    entityName: string,
    mutationName: string,
    payload: any,
    variable: any,
    selectFields ? : string[],
  ) => {
    const mutation = this.mutationBuilder.buildCustomMutationOperation(
      entityName,
      mutationName,
      payload,
      variable,
      selectFields,
    );

    return this._executeMutationAsync(entityName, mutation, mutationName, payload, {});
  };

  executeCustomQueryAsync = (
    entityName: string,
    operationName: string,
    queryParams: any,
    variable: any,
    selectFields: string[],
  ) => {
    const query = this.queryBuilder.buildCustomQuery(entityName, operationName, variable, selectFields);

    return this._executeQueryAsync(entityName, query, operationName, queryParams, {});
  };

  executeAsync = async (
    entityName: string,
    operationName: string,
    query: string,
    variable ? : Variables | undefined,
    defaultValue ? : any,
  ) => {
    await this.getToken();
    return this.graphQLClient.request(query, variable).then((response) => {
      return this.queryBuilder.compactResponse(entityName, response, operationName, defaultValue);
    });
  };

  sumAsync = async (entityName: string, fields: string, sumFormula: string, query ? : string): Promise < MathResult > => {
    const graphQLQuery = `query($query: String!, $field: String!, $sumFormula: String!) {
      ${entityName} {
          sum(query: $query, field: $field, sumFormula: $sumFormula) {
             value
          }
      }
  }`;

    await this.getToken();

    return this.graphQLClient.request(graphQLQuery, {
      query,
      field: fields,
      sumFormula
    }).then((response) => {
      return this.queryBuilder.compactResponse(entityName, response, 'sum', {
        value: 0
      });
    });
  };
}