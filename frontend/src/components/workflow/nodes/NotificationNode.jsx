import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bell } from 'lucide-react';

const TYPE_COLORS = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
};

export default function NotificationNode({ data, selected }) {
    const notifType = data?.notifType || 'info';
    const color = TYPE_COLORS[notifType] || TYPE_COLORS.info;
    const recipientType = data?.notifRecipientType || 'requestUser';
    const recipientRole = data?.notifRecipientRole || '';

    return (
        <div style={{
            background: selected ? '#164e63' : '#0e3a4a',
            border: `2px solid ${selected ? color : `${color}99`}`,
            borderRadius: 12,
            minWidth: 170,
            padding: '12px 16px',
            boxShadow: selected ? `0 0 0 3px ${color}33` : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: color, border: '2px solid #fff', width: 10, height: 10 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                    width: 28, height: 28,
                    background: `${color}33`,
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}55`,
                }}>
                    <Bell size={14} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Notification
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#f0f9ff', fontWeight: 600 }}>
                        {data?.label || 'Send Alert'}
                    </div>
                </div>
            </div>

            {data?.notifMessage && (
                <div style={{
                    fontSize: '0.7rem',
                    color: '#bae6fd',
                    background: `${color}18`,
                    borderRadius: 6,
                    padding: '4px 8px',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderLeft: `2px solid ${color}`,
                    marginBottom: 6,
                }}>
                    "{data.notifMessage}"
                </div>
            )}

            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: '0.62rem',
                    color: '#7dd3fc',
                    background: `${color}22`,
                    padding: '1px 6px',
                    borderRadius: 4,
                }}>
                    ⚡ Auto • {notifType}
                </span>
                <span style={{
                    fontSize: '0.62rem',
                    color: recipientType === 'role' ? '#fbbf24' : '#86efac',
                    background: recipientType === 'role' ? '#78350f55' : '#14532d55',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: `1px solid ${recipientType === 'role' ? '#92400e' : '#166534'}`,
                    textTransform: 'capitalize',
                }}>
                    → {recipientType === 'role' ? (recipientRole || 'role') : 'Requester'}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: color, border: '2px solid #fff', width: 10, height: 10 }}
            />
        </div>
    );
}
