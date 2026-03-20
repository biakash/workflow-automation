import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

export default function StartNode({ data, selected }) {
    return (
        <div style={{
            background: selected ? '#16a34a' : '#15803d',
            border: `2px solid ${selected ? '#4ade80' : '#22c55e'}`,
            borderRadius: '50%',
            width: 80,
            height: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: selected ? '0 0 0 3px rgba(34,197,94,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <Play size={20} color="#fff" fill="#fff" />
            <span style={{ fontSize: '0.6rem', color: '#dcfce7', fontWeight: 700, letterSpacing: '0.05em' }}>
                START
            </span>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: '#22c55e', border: '2px solid #fff', width: 10, height: 10 }}
            />
        </div>
    );
}
