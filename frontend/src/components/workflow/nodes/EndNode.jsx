import React from 'react';
import { Handle, Position } from 'reactflow';
import { StopCircle } from 'lucide-react';

export default function EndNode({ data, selected }) {
    return (
        <div style={{
            background: selected ? '#b91c1c' : '#991b1b',
            border: `2px solid ${selected ? '#f87171' : '#ef4444'}`,
            borderRadius: '50%',
            width: 80,
            height: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: selected ? '0 0 0 3px rgba(239,68,68,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <StopCircle size={20} color="#fff" />
            <span style={{ fontSize: '0.6rem', color: '#fee2e2', fontWeight: 700, letterSpacing: '0.05em' }}>
                END
            </span>

            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#ef4444', border: '2px solid #fff', width: 10, height: 10 }}
            />
            {data?.finalMessage && (
                <div style={{
                    position: 'absolute',
                    bottom: -32,
                    fontSize: '0.6rem',
                    color: 'var(--text3)',
                    maxWidth: 120,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {data.finalMessage}
                </div>
            )}
        </div>
    );
}
