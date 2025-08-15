import React from 'react';
import { formatISODate } from '../../lib/time';

type ContentDensity = 'full' | 'compact' | 'minimal';

interface NodeProps {
  id: string;
  x: number;
  y: number;
  title: string;
  description?: string;
  date: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  contentDensity?: ContentDensity;
  cardWidth?: number;
  cardHeight?: number;
  isMultiEvent?: boolean;
  isSummaryCard?: boolean;
  clusterId?: string;
  showDescription?: boolean;
  showDate?: boolean;
  isMultiTitle?: boolean;
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
  contentDensity = 'full',
  cardWidth,
  cardHeight,
  isMultiEvent = false,
  isSummaryCard = false,
  clusterId,
  showDescription,
  showDate,
  isMultiTitle = false
}) => {
  // Adaptive content display based on density level with dynamic sizing
  const getCardStyles = () => {
  const baseStyles = {
      minimal: {
    title: 'font-medium text-gray-900 text-xs truncate',
        description: 'text-gray-600 text-xs mt-1 line-clamp-1',
    date: 'text-gray-400 text-[10px] mt-1',
        showDescription: false,
        showDate: false,
    padding: 'px-2 py-1.5'
      },
      compact: {
    // Two-line clamp for titles in compact/full
    title: 'font-semibold text-gray-900 text-sm leading-5',
        description: 'text-gray-600 text-xs mt-1 leading-4 line-clamp-1',
    date: 'text-gray-400 text-[11px] mt-1 leading-4',
        showDescription: true,
        showDate: true,
    padding: 'px-3 py-2'
      },
      full: {
  title: 'font-semibold text-gray-900 text-base leading-5',
  description: 'text-gray-600 text-sm mt-2 leading-5 line-clamp-3',
  date: 'text-gray-400 text-xs mt-2 leading-4',
        showDescription: true,
        showDate: true,
    padding: 'px-4 py-3'
      }
    };
    
    return baseStyles[contentDensity] || baseStyles.full;
  };

  const styles = getCardStyles();
  
  // Use dynamic sizing if provided, otherwise fall back to defaults
  const finalWidth = cardWidth || (contentDensity === 'minimal' ? 128 : contentDensity === 'compact' ? 176 : 256);
  // Match Timeline CARD_CONFIGS heights to prevent clipping across platforms
  const finalHeight = cardHeight || (contentDensity === 'minimal' ? 40 : contentDensity === 'compact' ? 96 : 172);
  
  return (
    <div 
      data-testid="event-card"
  data-event-id={id}
  data-summary={isSummaryCard ? 'true' : undefined}
  data-multi={isMultiEvent ? 'true' : undefined}
  data-density={contentDensity}
  data-cluster-id={clusterId}
      className={`
  absolute bg-white rounded-lg shadow-md cursor-pointer
  hover:shadow-lg border border-gray-100
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        ${styles.padding}
      `}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
  boxSizing: 'border-box',
        transform: 'translate(-50%, -50%)',
  overflow: 'hidden',
  minHeight: `${finalHeight}px` // defensive against font metrics differences
      }}
      onClick={() => onSelect?.(id)}
    >
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <h3
          className={`${styles.title}`}
          style={{
    overflow: 'hidden',
    // Title: two-line clamp for full/compact, single-line for minimal
    display: contentDensity === 'minimal' ? 'block' : '-webkit-box',
    WebkitBoxOrient: contentDensity === 'minimal' ? undefined as any : ('vertical' as any),
    WebkitLineClamp: contentDensity === 'minimal' ? undefined : 2,
    textOverflow: 'ellipsis',
    whiteSpace: contentDensity === 'minimal' ? 'nowrap' : undefined,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  hyphens: 'none'
          }}
          title={title}
        >
          {title}
        </h3>
      
      {/* Multi-event card rendering */}
      {isMultiEvent && description && (showDescription ?? styles.showDescription) && (
        <div className="mt-1 space-y-1">
          {/* Light separator line */}
          <div className="w-full h-px bg-gray-200"></div>
          {description.split('\n').map((eventLine, index) => (
            <div key={index} className="text-xs text-gray-600 leading-tight">
              {eventLine}
            </div>
          ))}
        </div>
      )}
      
      {/* Regular single event rendering */}
    {!isMultiEvent && (showDescription ?? styles.showDescription) && description && (
          <p
            className={`${styles.description}`}
            style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical' as any,
      WebkitLineClamp: contentDensity === 'full' ? 3 : contentDensity === 'compact' ? 1 : 0,
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
      hyphens: 'auto'
            }}
          >
            {description}
          </p>
        )}
      
      {/* Date for single events only */}
        {!isMultiEvent && (showDate ?? styles.showDate) && (
          <time
            className={`${styles.date} block`}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em'
            }}
            dateTime={formatISODate(date)}
          >
            {formatISODate(date)}
          </time>
        )}
      </div>
      
      {/* Multi-title card styling */}
      {isMultiTitle && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold" style={{ fontSize: '8px' }}>
          ●
        </div>
      )}
      
      {/* Summary card styling */}
      {isSummaryCard && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold" style={{ fontSize: '8px' }}>
          !
        </div>
      )}
    </div>
  );
};