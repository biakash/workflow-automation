import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

export default function DecisionNode({ data, selected }) {
    const branches = data?.branches || [];

    return (
        <div style={{
            background: selected ? '#92400e' : '#78350f',
            border: `2px solid ${selected ? '#fbbf24' : '#f59e0b'}`,
            borderRadius: 12,
            minWidth: 165,
            padding: '12px 16px',
            boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#f59e0b', border: '2px solid #fff', width: 10, height: 10 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                    width: 28, height: 28,
                    background: 'rgba(245,158,11,0.3)',
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <GitBranch size={14} color="#fcd34d" />
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#fcd34d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Decision
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                        {data?.label || 'Make Decision'}
                    </div>
                </div>
            </div>

            {data?.assignedRole && (
                <div style={{ fontSize: '0.68rem', color: '#fde68a', marginBottom: 6 }}>
                    Role: {data.assignedRole}
                </div>
            )}

            {branches.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {branches.map((b, i) => (
                        <div key={i} style={{
                            fontSize: '0.65rem',
                            color: '#fef3c7',
                            background: 'rgba(245,158,11,0.15)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                            {b.label || `Branch ${i + 1}`}
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic source handles for branches */}
            {branches.length > 0 ? branches.map((b, i) => (
                <Handle
                    key={i}
                    type="source"
                    position={Position.Bottom}
                    id={b.handle || b.label || `branch_${i}`}
                    style={{
                        background: '#f59e0b',
                        border: '2px solid #fff',
                        width: 10,
                        height: 10,
                        left: `${((i + 1) / (branches.length + 1)) * 100}%`,
                    }}
                />
            )) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    style={{ background: '#f59e0b', border: '2px solid #fff', width: 10, height: 10 }}
                />
            )}
        </div>
    );
}
