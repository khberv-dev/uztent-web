export const paths = {
    // Viewer (consumer) pages
    home: '/',
    auth: '/auth',
    googleCallback: '/auth/google',
    settings: '/settings', // account: profile, password
    channel: (username = ':username') => `/w/${username}`, // a user's live stream by username
    stream: (id = ':id') => `/streams/${id}`,
    vod: (id = ':id') => `/vods/${id}`,
    donationComplete: '/donations/complete', // Multicard returns donors here (the API's DONATION_RETURN_URL)

    // Streamer (publisher) pages
    dashboard: {
        home: '/dashboard', // stream manager: live status, title
        videos: '/dashboard/videos', // own recordings
        settings: '/dashboard/settings', // stream key, publish URL
    },
}
