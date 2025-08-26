import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Import Cube, Face, and Segment types for explicit type annotations.
import { DrawingObject, Point3D, ViewState, Tool, FaceType, Point2D, Cube, Face, Segment } from '../types';
import { TILE_SIZE, GRID_SIZE } from '../constants';
import * as d3 from 'd3-color';

type ProjectFunction = (p: Point3D) => Point3D;

const useIsometricProjection = (viewState: ViewState) => {
  return useMemo(() => {
    const { rotationX, rotationY } = viewState;
    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;

    const sinX = Math.sin(radX), cosX = Math.cos(radX);
    const sinY = Math.sin(radY), cosY = Math.cos(radY);

    return (p: Point3D): Point3D => {
      // 1. Remap model coords (Z-up) to view coords (Y-up)
      const x_view = p.x;
      const y_view = p.z;
      const z_view = -p.y;

      // 2. Rotate around Y axis (yaw)
      const x_rotY = x_view * cosY - z_view * sinY;
      const y_rotY = y_view;
      const z_rotY = x_view * sinY + z_view * cosY;

      // 3. Rotate around X axis (pitch)
      const x_rotX = x_rotY;
      const y_rotX = y_rotY * cosX - z_rotY * sinX;
      const z_rotX = y_rotY * sinX + z_rotY * cosX;
      
      const screenX = x_rotX * TILE_SIZE;
      const screenY = -y_rotX * TILE_SIZE;

      return { x: screenX, y: screenY, z: z_rotX };
    };
  }, [viewState]);
};


// --- Helper Functions ---
const getCubeVertices = (origin: Point3D): Point3D[] => {
    const { x, y, z } = origin;
    return [
        { x, y, z }, { x: x + 1, y, z }, { x: x + 1, y: y + 1, z }, { x, y: y + 1, z },
        { x, y, z: z + 1 }, { x: x + 1, y, z: z + 1 }, { x: x + 1, y: y + 1, z: z + 1 }, { x, y: y + 1, z: z + 1 }
    ];
};

const getFaceVertices = (origin: Point3D, faceType: FaceType): Point3D[] => {
    const {x, y, z} = origin;
    switch(faceType) {
        case FaceType.XY: return [{x, y, z}, {x: x+1, y, z}, {x: x+1, y: y+1, z}, {x, y: y+1, z}];
        case FaceType.YZ: return [{x, y, z}, {x, y: y+1, z}, {x, y: y+1, z: z+1}, {x, y, z: z+1}];
        case FaceType.XZ: return [{x, y, z}, {x: x+1, y, z}, {x: x+1, y, z: z+1}, {x, y, z: z+1}];
    }
}

// FIX: Added explicit type for the 'project' function parameter.
const getProjectedCenter = (obj: DrawingObject, project: (p: Point3D) => Point3D): Point3D => {
    let center: Point3D;
    if (obj.type === Tool.CUBE) {
        center = { x: obj.origin.x + 0.5, y: obj.origin.y + 0.5, z: obj.origin.z + 0.5 };
    } else if (obj.type === Tool.FACE) {
        center = { x: obj.origin.x + 0.5, y: obj.origin.y + 0.5, z: obj.origin.z + 0.5 };
    } else { // Segment
        center = { x: (obj.start.x + obj.end.x) / 2, y: (obj.start.y + obj.end.y) / 2, z: (obj.start.z + obj.end.z) / 2 };
    }
    return project(center);
};

const CUBE_FACES = [
    // Top
    { vertices: [{x:0,y:0,z:1}, {x:1,y:0,z:1}, {x:1,y:1,z:1}, {x:0,y:1,z:1}], normal: {x:0,y:0,z:1} },
    // Bottom
    { vertices: [{x:0,y:0,z:0}, {x:0,y:1,z:0}, {x:1,y:1,z:0}, {x:1,y:0,z:0}], normal: {x:0,y:0,z:-1} },
    // Front
    { vertices: [{x:0,y:0,z:0}, {x:1,y:0,z:0}, {x:1,y:0,z:1}, {x:0,y:0,z:1}], normal: {x:0,y:-1,z:0} },
    // Back
    { vertices: [{x:0,y:1,z:0}, {x:0,y:1,z:1}, {x:1,y:1,z:1}, {x:1,y:1,z:0}], normal: {x:0,y:1,z:0} },
    // Right
    { vertices: [{x:1,y:0,z:0}, {x:1,y:1,z:0}, {x:1,y:1,z:1}, {x:1,y:0,z:1}], normal: {x:1,y:0,z:0} },
    // Left
    { vertices: [{x:0,y:0,z:0}, {x:0,y:0,z:1}, {x:0,y:1,z:1}, {x:0,y:1,z:0}], normal: {x:-1,y:0,z:0} },
];

const isPointInPolygon = (point: Point2D, polygon: Point2D[]): boolean => {
    if (polygon.length < 3) return false;
    let has_positive = false;
    let has_negative = false;
    const epsilon = 1e-9; // Tolerance for floating point comparisons

    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        const cross_product = (point.x - p1.x) * (p2.y - p1.y) - (point.y - p1.y) * (p2.x - p1.x);

        if (cross_product > epsilon) {
            has_positive = true;
        }
        if (cross_product < -epsilon) {
            has_negative = true;
        }
        
        if (has_positive && has_negative) {
            return false;
        }
    }
    return true;
};


// --- Components ---
// FIX: Added explicit type for the 'project' prop and specific types for render function parameters.
const RenderedObject: React.FC<{ obj: DrawingObject, project: (p: Point3D) => Point3D, isTransparent: boolean, onClick?: () => void }> = ({ obj, project, isTransparent, onClick }) => {
    const fillOpacity = isTransparent ? 0.6 : 1.0;
    const strokeColor = d3.color(obj.color)?.darker(0.5).toString() ?? '#000';

    const renderCube = (cube: Cube) => {
        const vertices = getCubeVertices(cube.origin).map(project);
        const faces = [
            { points: [vertices[0], vertices[1], vertices[2], vertices[3]], brightness: 0.2 }, // Bottom
            { points: [vertices[4], vertices[5], vertices[6], vertices[7]], brightness: 0 }, // Top
            { points: [vertices[0], vertices[1], vertices[5], vertices[4]], brightness: 0.1 }, // Front
            { points: [vertices[2], vertices[3], vertices[7], vertices[6]], brightness: 0.3 }, // Back
            { points: [vertices[1], vertices[2], vertices[6], vertices[5]], brightness: 0.2 }, // Right
            { points: [vertices[0], vertices[3], vertices[7], vertices[4]], brightness: 0.4 }, // Left
        ].sort((a,b) => {
            const zA = a.points.reduce((sum, p) => sum + p.z, 0) / 4;
            const zB = b.points.reduce((sum, p) => sum + p.z, 0) / 4;
            return zA - zB;
        });
        
        return (
            <g onClick={onClick}>
            {faces.map((face, i) => (
                <polygon
                    key={i}
                    points={face.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={d3.color(cube.color)?.brighter(face.brightness).toString() ?? cube.color}
                    stroke={strokeColor}
                    strokeWidth="1"
                    style={{ fillOpacity }}
                />
            ))}
            </g>
        );
    };
    
    const renderFace = (face: Face) => {
        const vertices = getFaceVertices(face.origin, face.faceType).map(project);
        return (
             <polygon
                onClick={onClick}
                points={vertices.map(p => `${p.x},${p.y}`).join(' ')}
                fill={face.color}
                stroke={strokeColor}
                strokeWidth="1"
                style={{ fillOpacity }}
            />
        )
    }

    const renderSegment = (segment: Segment) => {
        const start = project(segment.start);
        const end = project(segment.end);
        return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={segment.color} strokeWidth="3" onClick={onClick} />
    }

    switch (obj.type) {
        case Tool.CUBE: return renderCube(obj);
        case Tool.FACE: return renderFace(obj);
        case Tool.SEGMENT: return renderSegment(obj);
        default: return null;
    }
};

interface WorkspaceProps {
  objects: DrawingObject[];
  onAddObject: (obj: Omit<DrawingObject, 'id'>) => void;
  onRemoveObject: (id: string) => void;
  activeTool: Tool;
  currentColor: string;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
}

const Workspace: React.FC<WorkspaceProps> = ({ objects, onAddObject, onRemoveObject, activeTool, currentColor, viewState, setViewState }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [preview, setPreview] = useState<Omit<DrawingObject, 'id'> | null>(null);
  const [isPlacementValid, setIsPlacementValid] = useState(true);
  
  const project = useIsometricProjection(viewState);

  const occupiedLocations = useMemo(() => {
    const locations = new Set<string>();
    objects.forEach(obj => {
      if (obj.type === Tool.CUBE) {
        locations.add(`${obj.origin.x},${obj.origin.y},${obj.origin.z}`);
      }
    });
    return locations;
  }, [objects]);

  const allVisibleObjects = useMemo(() => {
    const combined: DrawingObject[] = [...objects];
    if (preview) {
      combined.push({
        ...preview,
        id: 'preview',
        color: isPlacementValid ? preview.color : '#ef4444',
      } as DrawingObject);
    }

    return combined.sort((a, b) => {
      const centerA = getProjectedCenter(a, project);
      const centerB = getProjectedCenter(b, project);
      return centerA.z - centerB.z;
    });
  }, [objects, preview, isPlacementValid, project]);


 const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return;

    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const gElement = svgRef.current.querySelector('g');
    if (!gElement) return;

    const transformedPoint = svgPoint.matrixTransform(gElement.getScreenCTM()!.inverse());
    const mouseInG: Point2D = { x: transformedPoint.x, y: transformedPoint.y };

    type SnapCandidate = { placementOrigin: Point3D; zDepth: number; normal: Point3D };
    const candidates: SnapCandidate[] = [];

    // Check existing cube faces
    objects.forEach(obj => {
        if (obj.type !== Tool.CUBE) return;
        CUBE_FACES.forEach(face => {
            const absoluteVertices = face.vertices.map(v => ({ x: v.x + obj.origin.x, y: v.y + obj.origin.y, z: v.z + obj.origin.z }));
            const projectedVertices = absoluteVertices.map(project);
            if (isPointInPolygon(mouseInG, projectedVertices)) {
                const centerZ = projectedVertices.reduce((sum, p) => sum + p.z, 0) / 4;
                candidates.push({
                    placementOrigin: { x: obj.origin.x + face.normal.x, y: obj.origin.y + face.normal.y, z: obj.origin.z + face.normal.z },
                    zDepth: centerZ,
                    normal: face.normal,
                });
            }
        });
    });

    // Check grid plane
    let bestGridPoint: { pos: Point3D, distSq: number } | null = null;
    for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
        for (let j = -GRID_SIZE; j <= GRID_SIZE; j++) {
            const p3d = { x: i, y: j, z: 0 };
            const p2d = project(p3d);
            const distSq = (mouseInG.x - p2d.x)**2 + (mouseInG.y - p2d.y)**2;
            if (!bestGridPoint || distSq < bestGridPoint.distSq) {
                bestGridPoint = { pos: p3d, distSq };
            }
        }
    }
    
    if (bestGridPoint) {
        const { x, y } = bestGridPoint.pos;
        const surroundingCells = [
            {x: x, y: y, z: 0}, {x: x-1, y: y, z: 0},
            {x: x, y: y-1, z: 0}, {x: x-1, y: y-1, z: 0}
        ];
        for (const cellOrigin of surroundingCells) {
            const vertices = [{...cellOrigin}, {x: cellOrigin.x+1, y: cellOrigin.y, z:0}, {x: cellOrigin.x+1, y: cellOrigin.y+1, z:0}, {x: cellOrigin.x, y: cellOrigin.y+1, z:0}];
            const projectedVertices = vertices.map(project);
            if (isPointInPolygon(mouseInG, projectedVertices)) {
                 const centerZ = projectedVertices.reduce((sum, p) => sum + p.z, 0) / 4;
                 candidates.push({
                     placementOrigin: cellOrigin,
                     zDepth: centerZ,
                     normal: {x: 0, y: 0, z: 1}
                 });
                 break; // Mouse can only be in one grid cell
            }
        }
    }
    
    let newPreview: Omit<DrawingObject, 'id'> | null = null;
    let valid = true;

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.zDepth - a.zDepth); // Higher Z is closer
        const bestSnap = candidates[0];
        const pos = bestSnap.placementOrigin;

        switch (activeTool) {
            case Tool.CUBE:
                // FIX: Add a type assertion because TypeScript cannot correctly infer the discriminated union type for this object literal.
                newPreview = { type: Tool.CUBE, origin: pos, color: currentColor } as Omit<Cube, 'id'>;
                valid = !occupiedLocations.has(`${pos.x},${pos.y},${pos.z}`);
                break;
            case Tool.FACE:
                let faceType = FaceType.XY;
                if (Math.abs(bestSnap.normal.x) === 1) faceType = FaceType.YZ;
                if (Math.abs(bestSnap.normal.y) === 1) faceType = FaceType.XZ;
                // FIX: Add a type assertion because TypeScript cannot correctly infer the discriminated union type for this object literal.
                newPreview = { type: Tool.FACE, origin: pos, faceType: faceType, color: currentColor } as Omit<Face, 'id'>;
                break;
            case Tool.SEGMENT:
                // FIX: Add a type assertion because TypeScript cannot correctly infer the discriminated union type for this object literal.
                newPreview = { type: Tool.SEGMENT, start: pos, end: {...pos, x: pos.x + 1}, color: currentColor } as Omit<Segment, 'id'>;
                break;
            case Tool.ERASER:
            default: break;
        }
    }
    
    setPreview(newPreview);
    setIsPlacementValid(valid);
  }, [objects, project, activeTool, currentColor, occupiedLocations]);
  
  const handleClick = () => {
    if (preview && isPlacementValid && activeTool !== Tool.ERASER) {
      onAddObject(preview);
    }
  };

  const handleObjectClick = (obj: DrawingObject) => {
    if (activeTool === Tool.ERASER) {
      onRemoveObject(obj.id);
    }
  };

  const renderGrid = () => {
    const dots = [];
    for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
        for (let j = -GRID_SIZE; j <= GRID_SIZE; j++) {
            const { x, y } = project({ x: i, y: j, z: 0 });
            dots.push(<circle key={`dot-${i}-${j}`} cx={x} cy={y} r="1.5" fill="#cbd5e1" />);
        }
    }
    return <g>{dots}</g>;
  };

  const renderAxes = () => {
    const origin = project({x:0, y:0, z:0});
    const xAxis = project({x:GRID_SIZE, y:0, z:0});
    const yAxis = project({x:0, y:GRID_SIZE, z:0});
    const zAxis = project({x:0, y:0, z:GRID_SIZE});

    return (
        <g strokeWidth="2">
            <line x1={origin.x} y1={origin.y} x2={xAxis.x} y2={xAxis.y} stroke="red" />
            <text x={xAxis.x+5} y={xAxis.y} fill="red" fontSize="12" style={{pointerEvents: 'none'}}>X</text>
            <line x1={origin.x} y1={origin.y} x2={yAxis.x} y2={yAxis.y} stroke="green" />
             <text x={yAxis.x+5} y={yAxis.y} fill="green" fontSize="12" style={{pointerEvents: 'none'}}>Y</text>
            <line x1={origin.x} y1={origin.y} x2={zAxis.x} y2={zAxis.y} stroke="blue" />
             <text x={zAxis.x+5} y={zAxis.y} fill="blue" fontSize="12" style={{pointerEvents: 'none'}}>Z</text>
        </g>
    );
  };
  
  return (
    <svg 
        id="workspace-svg"
        ref={svgRef} 
        className="w-full h-full cursor-crosshair bg-gray-100"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setPreview(null)}
        onClick={handleClick}
    >
      <g transform={`translate(${400 + viewState.pan.x}, ${300 + viewState.pan.y}) scale(${viewState.zoom})`}>
        {renderGrid()}
        {viewState.showAxes && renderAxes()}

        {allVisibleObjects.map(obj => (
          <RenderedObject
            key={obj.id}
            obj={obj}
            project={project}
            isTransparent={obj.id === 'preview' || viewState.isTransparent}
            onClick={obj.id !== 'preview' ? () => handleObjectClick(obj) : undefined}
          />
        ))}
      </g>
    </svg>
  );
};

export default Workspace;