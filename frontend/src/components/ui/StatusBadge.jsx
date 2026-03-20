import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Ban, Loader } from 'lucide-react';

const STATUS_MAP = {
  completed:  { label: 'Completed',  cls: 'badge-green',  Icon: CheckCircle },
  failed:     { label: 'Failed',     cls: 'badge-red',    Icon: XCircle },
  running:    { label: 'Running',    cls: 'badge-blue',   Icon: Loader },
  pending:    { label: 'Pending',    cls: 'badge-yellow', Icon: Clock },
  cancelled:  { label: 'Cancelled', cls: 'badge-gray',   Icon: Ban },
  rejected:   { label: 'Rejected',  cls: 'badge-red',    Icon: XCircle },
  approved:   { label: 'Approved',  cls: 'badge-green',  Icon: CheckCircle },
  skipped:    { label: 'Skipped',   cls: 'badge-gray',   Icon: AlertCircle },
  active:     { label: 'Active',    cls: 'badge-green',  Icon: CheckCircle },
  inactive:   { label: 'Inactive',  cls: 'badge-gray',   Icon: Ban },
  draft:      { label: 'Draft',     cls: 'badge-yellow', Icon: Clock },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, cls: 'badge-gray', Icon: AlertCircle };
  const { label, cls, Icon } = config;
  return (
    <span className={`badge ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}