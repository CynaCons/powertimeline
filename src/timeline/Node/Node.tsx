import React from 'react';

interface NodeProps {
  id: string;
  x: number;
  y: number;
  title: string;
  description?: string;
  date: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  compact?: boolean; // For dense layouts
}

export const Node: React.FC<NodeProps> = ({ 
  id, 
  title, 
  description, 
  date,
  x,
  y,
  isSelected,
  onSelect,
  compact = false
}) => {
  // Clean slate - starting fresh
  // Will be rebuilt with proper HTML cards in next iteration
  
  return (
    <div 
      data-testid="event-card"
      className={`
        absolute bg-white rounded-lg shadow-md transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-105
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${compact ? 'p-2 w-50 text-xs' : 'p-4 w-64'}
      `}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={() => onSelect?.(id)}
    >
      <h3 className={compact ? "font-semibold text-gray-900 text-sm" : "font-semibold text-gray-900 text-lg"}>{title}</h3>
      {description && (
        <p className={compact ? "text-gray-600 text-xs mt-1 line-clamp-2" : "text-gray-600 text-sm mt-2"}>{description}</p>
      )}
      <time className={compact ? "text-gray-400 text-xs mt-1 block" : "text-gray-400 text-xs mt-2 block"}>{date}</time>
    </div>
  );
};