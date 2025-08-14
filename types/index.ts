



export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum NodeType {
  FILE = 'FILE',
  FOLDER = 'FOLDER'
}

export enum NodeStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AVAILABLE = 'AVAILABLE',
  ERROR = 'ERROR'
}



export interface User {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface StorageNode {
  id: number;
  uuid: string;
  type: NodeType;
  name: string;
  s3Key?: string | null;
  mimeType?: string | null;
  sizeBytes?: number;
  status: NodeStatus;
  meta?: Record<string, any> | null;
  ownerId: number;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}