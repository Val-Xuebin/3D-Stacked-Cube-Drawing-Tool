
import React, { useState, useCallback } from 'react';
import { DrawingObject, Tool, ViewState } from './types';
import Toolbar from './components/Toolbar';
import InspectorPanel from './components/InspectorPanel';
import Workspace from './components/Workspace';
import { DEFAULT_COLOR } from './constants';

const App: React.FC = () => {
  const [objects, setObjects] = useState<DrawingObject[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.CUBE);
  const [currentColor, setCurrentColor] = useState<string>(DEFAULT_COLOR);

  const initialViewState: ViewState = {
    rotationX: 35.264,
    rotationY: 135,
    is3D: true,
    showAxes: true,
    isTransparent: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
  };
  const [viewState, setViewState] = useState<ViewState>(initialViewState);

  const handleAddObject = useCallback((obj: Omit<DrawingObject, 'id'>) => {
    // FIX: Add type assertion to `DrawingObject` because TypeScript cannot correctly infer
    // the discriminated union type after spreading `obj`.
    setObjects(prev => [...prev, { ...obj, id: crypto.randomUUID() } as DrawingObject]);
  }, []);
  
  const handleRemoveObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setObjects([]);
  }, []);

  const handleResetView = useCallback(() => {
    setViewState(initialViewState);
  }, [initialViewState]);

  return (
    <div className="flex flex-col h-screen font-sans antialiased text-gray-800 bg-gray-200">
      <header className="bg-white shadow-md p-2 flex items-center z-20">
        <h1 className="text-xl font-bold text-violet-600">Isometric Drawing Tool</h1>
        <div className="ml-auto text-sm text-gray-500">
          Draw from back-to-front and bottom-to-top for best results.
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          onClear={handleClearAll}
        />
        <main className="flex-1 relative bg-gray-100">
          <Workspace
            objects={objects}
            onAddObject={handleAddObject}
            onRemoveObject={handleRemoveObject}
            activeTool={activeTool}
            currentColor={currentColor}
            viewState={viewState}
            setViewState={setViewState}
          />
        </main>
        <InspectorPanel
          viewState={viewState}
          setViewState={setViewState}
          onResetView={handleResetView}
        />
      </div>
    </div>
  );
};

export default App;
