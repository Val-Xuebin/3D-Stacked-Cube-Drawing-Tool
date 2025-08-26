
import React from 'react';
import { Tool } from '../types';
import { COLORS } from '../constants';
import { CubeIcon, FaceIcon, SegmentIcon, EraserIcon } from './icons/Icons';

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  onClear: () => void;
}

const ToolButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex flex-col items-center p-3 text-xs rounded-lg transition-all duration-200 ${
      isActive ? 'bg-violet-500 text-white scale-105 shadow-lg' : 'bg-white text-gray-600 hover:bg-violet-100 hover:text-violet-600'
    }`}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  currentColor,
  setCurrentColor,
  onClear
}) => {
  const tools = [
    { id: Tool.CUBE, label: 'Cube', icon: <CubeIcon /> },
    { id: Tool.FACE, label: 'Face', icon: <FaceIcon /> },
    { id: Tool.SEGMENT, label: 'Segment', icon: <SegmentIcon /> },
    { id: Tool.ERASER, label: 'Eraser', icon: <EraserIcon /> },
  ];

  return (
    <aside className="w-56 bg-gray-50/50 shadow-lg p-4 flex flex-col space-y-6 z-10 overflow-y-auto">
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map(({ id, label, icon }) => (
            <ToolButton
              key={id}
              label={label}
              icon={icon}
              isActive={activeTool === id}
              onClick={() => setActiveTool(id)}
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Color</h3>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-10 h-10 rounded-full border-2 transition-transform duration-150 ${
                currentColor === color ? 'border-violet-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-200">
         <h3 className="font-semibold mb-3 text-gray-700">Actions</h3>
         <button 
           onClick={onClear}
           className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
         >
           Clear All
         </button>
      </div>
    </aside>
  );
};

export default Toolbar;
