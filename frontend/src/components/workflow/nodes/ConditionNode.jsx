import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitFork } from 'lucide-react';

export default function ConditionNode({ data, selected }) {
    const condCount = data?.conditions?.length || 0;

    return (
        <div style={{ position: 'relative', width: 140, height: 100 }}>
            {/* Rotated diamond */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(45deg)',
                width: 90,
                height: 90,
                background: selected ? '#7e22ce' : '#581c87',
                border: `2px solid ${selected ? '#c084fc' : '#a855f7'}`,
                boxShadow: selected ? '0 0 0 3px rgba(168,85,247,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
            }} />

            {/* Content (not rotated) */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                zIndex: 1,
                cursor: 'pointer',
            }}>
                <GitFork size={16} color="#d8b4fe" />
                <span style={{ fontSize: '0.62rem', color: '#f3e8ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {data?.label || 'Condition'}
                </span>
                {condCount > 0 && (
                    <span style={{ fontSize: '0.58rem', color: '#c084fc' }}>
                        {condCount} rule{condCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Target handle — top */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#a855f7', border: '2px solid #fff', width: 10, height: 10, top: 0 }}
            />

            {/* Source handle TRUE — right */}
            <Handle
                type="source"
                id="true"
                position={Position.Right}
                style={{ background: '#22c55e', border: '2px solid #fff', width: 12, height: 12, right: 0, top: '50%' }}
            />
            <div style={{
                position: 'absolute',
                right: -36,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.6rem',
                color: '#4ade80',
                fontWeight: 700,
                zIndex: 2,
            }}>
                TRUE
            </div>

            {/* Source handle FALSE — left */}
            <Handle
                type="source"
                id="false"
                position={Position.Left}
                style={{ background: '#ef4444', border: '2px solid #fff', width: 12, height: 12, left: 0, top: '50%' }}
            />
            <div style={{
                position: 'absolute',
                left: -36,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.6rem',
                color: '#f87171',
                fontWeight: 700,
                zIndex: 2,
            }}>
                FALSE
            </div>
        </div>
    );
}
