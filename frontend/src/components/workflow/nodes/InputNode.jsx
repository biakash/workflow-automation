import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';

export default function InputNode({ data, selected }) {
    const fieldCount = data?.fields?.length || 0;

    return (
        <div style={{
            background: selected ? '#1d4ed8' : '#1e3a8a',
            border: `2px solid ${selected ? '#60a5fa' : '#3b82f6'}`,
            borderRadius: 12,
            minWidth: 150,
            padding: '12px 16px',
            boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            cursor: 'pointer',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#3b82f6', border: '2px solid #fff', width: 10, height: 10 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                    width: 28, height: 28,
                    background: 'rgba(59,130,246,0.3)',
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <FileText size={14} color="#93c5fd" />
                </div>
                <div>
                    <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Input
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                        {data?.label || 'Collect Input'}
                    </div>
                </div>
            </div>

            {fieldCount > 0 && (
                <div style={{
                    fontSize: '0.68rem',
                    color: '#bfdbfe',
                    background: 'rgba(59,130,246,0.2)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    display: 'inline-block',
                }}>
                    {fieldCount} form field{fieldCount !== 1 ? 's' : ''}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: '#3b82f6', border: '2px solid #fff', width: 10, height: 10 }}
            />
        </div>
    );
}
