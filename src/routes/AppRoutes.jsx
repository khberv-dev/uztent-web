import { Navigate, Route, Routes } from 'react-router'
import { AuthLayout, DashboardLayout, MainLayout } from '@/components/templates'
import { AuthPage } from '@/pages/AuthPage'
import { ChannelPage } from '@/pages/ChannelPage'
import { StreamManagerPage, StreamSettingsPage, VideosPage } from '@/pages/dashboard'
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StreamPage } from '@/pages/StreamPage'
import { VodPage } from '@/pages/VodPage'
import { GuestRoute } from './GuestRoute'
import { paths } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route element={<GuestRoute />}>
                    <Route path={paths.auth} element={<AuthPage />} />
                </Route>
                {/* Google redirects here with #id_token=...; must match VITE_GOOGLE_REDIRECT_URI */}
                <Route path={paths.googleCallback} element={<GoogleCallbackPage />} />
            </Route>

            {/* Viewer (consumer) pages. Live pages are public (the live endpoints need no token). */}
            <Route element={<MainLayout />}>
                <Route path={paths.home} element={<HomePage />} />
                <Route path={paths.channel()} element={<ChannelPage />} />
                <Route path={paths.stream()} element={<StreamPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path={paths.vod()} element={<VodPage />} />
                    <Route path={paths.settings} element={<SettingsPage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute />}>

                {/* Streamer (publisher) pages */}
                <Route path={paths.dashboard.home} element={<DashboardLayout />}>
                    <Route index element={<StreamManagerPage />} />
                    <Route path="videos" element={<VideosPage />} />
                    <Route path="settings" element={<StreamSettingsPage />} />
                    <Route path="*" element={<Navigate to={paths.dashboard.home} replace />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}
