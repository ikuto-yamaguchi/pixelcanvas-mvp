// Core type definitions

export interface Pixel {
  x: number;
  y: number;
  color: string;
  userId?: string;
  timestamp?: number;
}

export interface Canvas {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  ownerId: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  order: number;
}