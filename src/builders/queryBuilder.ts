import isEmpty from 'lodash/fp/isEmpty';
import getOr from 'lodash/fp/getOr';
import set from 'lodash/fp/set';
import camelCase from 'lodash/fp/camelCase';
import toString from 'lodash/fp/toString';
import { parseBodyQueryVariable, convertSelectFieldsArrayToString } from '../util';
import { QueryOperation, QueryParamsInput, GraphQLVariable, QueryVariables, CountQueryVariables } from '../types';

export default class QueryBuilder {
  private _internalBuildQuery = (
    entityName: string,
    graphQLVariables: GraphQLVariable,
    operation: QueryOperation,
    selectFields?: string[],
  ): string => {
    const operationName = this.getOperationName(operation);
    const queryFields = convertSelectFieldsArrayToString(selectFields);

    const query = `
      query${graphQLVariables.declareVariables || ''} {
        ${entityName} {
          ${operationName}${graphQLVariables.inputVariables || ''} {
            ${queryFields}
          }
        }
      }
    `;

    return query;
  };

  getOperationName = (operation: QueryOperation): string => camelCase(toString(operation));

  buildQuery = (
    entityName: string,
    operation: QueryOperation,
    params: QueryParamsInput | CountQueryVariables,
    selectFields?: string[],
    id?: string,
    isCountQuery: boolean = false,
  ): string => {
    const queryVariables = this.getQueryVariables(params, id, isCountQuery);
    const graphqlVariable = parseBodyQueryVariable(queryVariables);
    return this._internalBuildQuery(entityName, graphqlVariable, operation, selectFields);
  };

  buildCustomQuery = (entityName: string, operationName: string, variables: any, selectFields: string[]) => {
    const queryVariables = this.getQueryVariables(variables);
    const { inputVariables, declareVariables } = parseBodyQueryVariable(queryVariables, variables);
    const fields = convertSelectFieldsArrayToString(selectFields);

    return `query${declareVariables} {
      ${entityName} {
          ${operationName}${inputVariables} {
              ${fields}
            }
          }
        }`;
  };

  buildCountQuery = (entityName: string, query: string): string => {
    const params = { query };
    const queryString = this.buildQuery(
      entityName,
      QueryOperation.Count,
      params || {},
      ['numberOfItem'],
      undefined,
      true,
    );
    return queryString;
  };

  compactResponse = (entityName: string, response: any, operationName: string, defaultValue: any) => {
    return getOr(defaultValue, `${entityName}.${operationName}`)(response);
  };

  compactCountResponse = (entityName: string, response: any): number => {
    return getOr(0, `${entityName}.count.numberOfItem`)(response);
  };

  getQueryVariables = (
    queryParams: QueryParamsInput | CountQueryVariables,
    id?: string,
    isCountQuery: boolean = false,
  ): QueryVariables | CountQueryVariables => {
    if (!isCountQuery) {
      let queryVariables = {};
      if (id) {
        queryVariables = set('id', id)(queryVariables);
      }
      if (!isEmpty(queryParams)) {
        queryVariables = set('queryParams', queryParams)(queryVariables);
      }
      return queryVariables;
    }

    const countQueryVariables: CountQueryVariables = {
      query: queryParams.query,
    };

    return countQueryVariables;
  };
}
