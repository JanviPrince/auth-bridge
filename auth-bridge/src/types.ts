export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  payload: any;
  response: any;
}

export interface DatabaseState {
  dbType: string;
  collectionName: string;
  documentCount: number;
  documents: {
    _id: string;
    username: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
  }[];
  schema: {
    _id: string;
    username: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: string;
  };
}
