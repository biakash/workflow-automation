import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Bell, Settings } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import NotificationsPage from '../../components/ui/NotificationsPage';
import EmployeeOverview from './EmployeeOverview';
import ApprovalQueue from './ApprovalQueue';
import ProfilePage from '../shared/ProfilePage';

const NAV = [
  { type: 'section', label: 'Main' },
  { path: '/employee', label: 'Overview', icon: LayoutDashboard },
  { path: '/employee/approvals', label: 'Approval Queue', icon: CheckSquare },
  { type: 'section', label: 'Other' },
  { path: '/employee/notifications', label: 'Notifications', icon: Bell },
  { path: '/employee/profile', label: 'Profile', icon: Settings },
];

export default function EmployeeDashboard() {
  return (
    <SidebarLayout navItems={NAV}>
      <Routes>
        <Route index element={<EmployeeOverview />} />
        <Route path="approvals" element={<ApprovalQueue />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </SidebarLayout>
  );
}