import React from 'react';
import { Handle, Position } from 'reactflow';
import { UserCheck } from 'lucide-react';

const ROLE_COLORS = {
    manager: '#6366f1',
    employee: '#0891b2',
    finance: '#d97706',
    admin: '#9333ea',
    any: '#64748b',
};

export default function TaskNode({ data, selected }) {
    const role = data?.assignedRole || 'any';
    const color = ROLE_COLORS[role] || ROLE_COLORS.any;

    return (
        <div style={{
            background: selected ? '#312e81' : '#1e1b4b',
            border: `2px solid ${selected ? '#818cf8' : color}`,
            borderRadius: 12,
            minWidth: 160,
            padding: '12px 16px',
            boxShadow: selected ? `0 0 0 3px ${color}44` : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: color, border: '2px solid #fff', width: 10, height: 10 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                    width: 30, height: 30,
                    background: `${color}33`,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${color}66`,
                }}>
                    <UserCheck size={15} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Task / Approval
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                        {data?.label || 'Approval Required'}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: `${color}22`,
                borderRadius: 6,
                border: `1px solid ${color}44`,
            }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontWeight: 600, textTransform: 'capitalize' }}>
                    Assigned to: {role}
                </span>
            </div>

            {data?.requireComment && (
                <div style={{ fontSize: '0.65rem', color: '#818cf8', marginTop: 5 }}>
                    💬 Comment required
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: color, border: '2px solid #fff', width: 10, height: 10 }}
            />
        </div>
    );
}
