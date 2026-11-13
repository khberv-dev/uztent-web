import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { LiveEventsBridge } from '@/features/streams'
import { queryClient } from '@/lib/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LiveEventsBridge />
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
