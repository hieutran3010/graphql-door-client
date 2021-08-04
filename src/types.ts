export type QueryParamsInput = {
  query?: string;
  include?: string;
  orderBy?: string;
  page?: number;
  pageSize?: number;
};

export type QueryVariables = {
  queryParams: QueryParamsInput;
  id?: string;
};

export type CountQueryVariables = {
  query?: string;
};

export type MutationVariables = {
  input?: any;
  id?: string;
};

export enum QueryOperation {
  QueryMany = 'queryMany',
  QueryOne = 'queryOne',
  Count = 'count',
  GetById = 'getById',
}

export enum MutationOperation {
  Add = 'add',
  Update = 'update',
  Delete = 'delete',
}

export enum MutationBatchOperation {
  AddBatch = 'addBatch',
  UpdateBatch = 'updateBatch',
  DeleteBatch = 'deleteBatch',
}

export type GraphQLVariable = {
  declareVariables: string;
  inputVariables: string;
};

export type GraphQLDoorClientOptions = {
  headers?: any;
  authenticationToken?: string;
  getToken?: () => Promise<string>;
};

export type MathResult = {
  value: number;
};
