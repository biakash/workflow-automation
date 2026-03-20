import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Bell, Settings } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import NotificationsPage from '../../components/ui/NotificationsPage';
import ApprovalQueue from './ApprovalQueue';
import ManagerOverview from './ManagerOverview';
import ProfilePage from '../shared/ProfilePage';

const NAV = [
  { type: 'section', label: 'Main' },
  { path: '/manager', label: 'Overview', icon: LayoutDashboard },
  { path: '/manager/approvals', label: 'Approval Queue', icon: CheckSquare },
  { type: 'section', label: 'Other' },
  { path: '/manager/notifications', label: 'Notifications', icon: Bell },
  { path: '/manager/profile', label: 'Profile', icon: Settings },
];

export default function ManagerDashboard() {
  return (
    <SidebarLayout navItems={NAV}>
      <Routes>
        <Route index element={<ManagerOverview />} />
        <Route path="approvals" element={<ApprovalQueue />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    </SidebarLayout>
  );
}