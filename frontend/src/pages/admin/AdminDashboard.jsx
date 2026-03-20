import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Users, Play, Bell, Settings,
} from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import AdminOverview from './AdminOverview';
import WorkflowsPage from './WorkflowsPage';
import UsersPage from './UsersPage';
import ExecutionsPage from './ExecutionsPage';
import NotificationsPage from '../../components/ui/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const NAV = [
  { type: 'section', label: 'Main' },
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/admin/executions', label: 'Executions', icon: Play },
  { type: 'section', label: 'Management' },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/profile', label: 'Profile', icon: Settings },
];

export default function AdminDashboard() {
  return (
    <SidebarLayout navItems={NAV}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="workflows/*" element={<WorkflowsPage />} />
        <Route path="executions" element={<ExecutionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </SidebarLayout>
  );
}