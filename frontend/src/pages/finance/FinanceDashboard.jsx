import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, DollarSign, Bell, Settings } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import NotificationsPage from '../../components/ui/NotificationsPage';
import ApprovalQueue from './ApprovalQueue';
import FinanceOverview from './FinanceOverview';
import ProfilePage from '../shared/ProfilePage';

const NAV = [
  { type: 'section', label: 'Main' },
  { path: '/finance', label: 'Overview', icon: LayoutDashboard },
  { path: '/finance/approvals', label: 'Finance Approvals', icon: DollarSign },
  { type: 'section', label: 'Other' },
  { path: '/finance/notifications', label: 'Notifications', icon: Bell },
  { path: '/finance/profile', label: 'Profile', icon: Settings },
];

export default function FinanceDashboard() {
  return (
    <SidebarLayout navItems={NAV}>
      <Routes>
        <Route index element={<FinanceOverview />} />
        <Route path="approvals" element={<ApprovalQueue />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/finance" replace />} />
      </Routes>
    </SidebarLayout>
  );
}