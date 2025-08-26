
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export enum Tool {
  CUBE = 'CUBE',
  FACE = 'FACE',
  SEGMENT = 'SEGMENT',
  ERASER = 'ERASER',
  COLOR_PICKER = 'COLOR_PICKER'
}

export enum FaceType {
  XY = 'XY', // Top/Bottom
  YZ = 'YZ', // Left/Right
  XZ = 'XZ', // Front/Back
}

export interface DrawingObjectBase {
  id: string;
  color: string;
}

export interface Cube extends DrawingObjectBase {
  type: Tool.CUBE;
  origin: Point3D;
}

export interface Face extends DrawingObjectBase {
  type: Tool.FACE;
  origin: Point3D;
  faceType: FaceType;
}

export interface Segment extends DrawingObjectBase {
  type: Tool.SEGMENT;
  start: Point3D;
  end: Point3D;
}


export type DrawingObject = Cube | Face | Segment;

export interface ViewState {
  rotationX: number;
  rotationY: number;
  is3D: boolean;
  showAxes: boolean;
  isTransparent: boolean;
  zoom: number;
  pan: Point2D;
}