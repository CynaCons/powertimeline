import React from 'react';

interface CreateAffordanceProps {
  visible: boolean;
  x: number; // percent
  iso: string;
  onCreateAt?: (iso: string) => void;
}

export const CreateAffordance: React.FC<CreateAffordanceProps> = ({ visible, x, iso, onCreateAt }) => {
  if (!visible) return null;
  return (
    <g data-component="CreateAffordance" style={{ cursor: 'pointer' }} onClick={() => onCreateAt?.(iso)}>
      <g data-testid="create-plus">
        <circle cx={x} cy={10} r={0.15} fill="var(--cc-color-accent-create)" fillOpacity={0.8} />
        <text x={x} y={10.12} fontSize={0.4} textAnchor="middle" fill="var(--cc-color-axis-label)" style={{ pointerEvents: 'none', fontWeight: 600 }}>+</text>
      </g>
      <text x={x} y={12.6} fontSize={1.0} textAnchor="middle" fill="var(--cc-color-accent-create)" style={{ pointerEvents: 'none', fontWeight: 300 }}>{iso}</text>
    </g>
  );
};
