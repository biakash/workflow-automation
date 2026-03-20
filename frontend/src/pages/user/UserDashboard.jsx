import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, Settings } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import NotificationsPage from '../../components/ui/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';
import UserHome from './UserHome';
import UserRequests from './UserRequests';

const NAV = [
    { type: 'section', label: 'Main' },
    { path: '/user', label: 'Available Workflows', icon: LayoutDashboard },
    { path: '/user/my-requests', label: 'My Requests', icon: FileText },
    { type: 'section', label: 'Other' },
    { path: '/user/notifications', label: 'Notifications', icon: Bell },
    { path: '/user/profile', label: 'Profile', icon: Settings },
];

export default function UserDashboard() {
    return (
        <SidebarLayout navItems={NAV}>
            <Routes>
                <Route index element={<UserHome />} />
                <Route path="my-requests" element={<UserRequests />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/user" replace />} />
            </Routes>
        </SidebarLayout>
    );
}
