import React from 'react';
import { ViewState } from '../types';

interface InspectorPanelProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onResetView: () => void;
}

const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    displayValue?: string;
}> = ({ label, value, min, max, step, onChange, displayValue }) => (
    <div>
        <label className="flex justify-between items-center text-sm font-medium text-gray-600">
            <span>{label}</span>
            <span className="text-violet-600 font-semibold">{displayValue ?? `${value.toFixed(0)}°`}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
    </div>
);

const InspectorPanel: React.FC<InspectorPanelProps> = ({ viewState, setViewState, onResetView }) => {
  const handleExportSVG = () => {
    const svg = document.querySelector('#workspace-svg');
    if (!svg) return;
    
    // Clone the SVG to avoid modifying the one in the DOM
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    // Set an explicit white background for the exported file
    svgClone.style.backgroundColor = 'white';

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'isometric-drawing.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-64 bg-white shadow-lg p-4 flex flex-col space-y-4 z-10 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Inspect Mode</h2>
      
      <Slider 
        label="Elevation"
        value={viewState.rotationX}
        min={0}
        max={90}
        step={0.1}
        onChange={(e) => setViewState(v => ({...v, rotationX: parseFloat(e.target.value)}))}
      />
      <Slider 
        label="Rotation"
        value={viewState.rotationY}
        min={0}
        max={360}
        step={1}
        onChange={(e) => setViewState(v => ({...v, rotationY: parseFloat(e.target.value)}))}
      />
      <Slider 
        label="Zoom"
        value={viewState.zoom}
        min={0.5}
        max={3}
        step={0.1}
        onChange={(e) => setViewState(v => ({...v, zoom: parseFloat(e.target.value)}))}
        displayValue={`${viewState.zoom.toFixed(1)}x`}
      />
      
      <div className="space-y-2 pt-2 border-t">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">3D Perspective</span>
          <div className="relative">
            <input type="checkbox" className="sr-only peer" checked={viewState.is3D} onChange={(e) => setViewState(v => ({...v, is3D: e.target.checked}))}/>
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-violet-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </div>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Show Axes</span>
          <div className="relative">
            <input type="checkbox" className="sr-only peer" checked={viewState.showAxes} onChange={(e) => setViewState(v => ({...v, showAxes: e.target.checked}))}/>
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-violet-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </div>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Transparent</span>
          <div className="relative">
            <input type="checkbox" className="sr-only peer" checked={viewState.isTransparent} onChange={(e) => setViewState(v => ({...v, isTransparent: e.target.checked}))}/>
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-violet-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </div>
        </label>
      </div>
      
      <div className="pt-4 mt-auto border-t space-y-2">
        <button 
          onClick={handleExportSVG}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Export SVG
        </button>
        <button 
          onClick={onResetView}
          className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Reset View
        </button>
      </div>
    </aside>
  );
};

export default InspectorPanel;