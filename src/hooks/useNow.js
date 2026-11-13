import { useEffect, useState } from 'react'

/** Current time (ms), updated every `intervalMs`. For ticking durations like "live for 1:02:05". */
export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(timer)
    }, [intervalMs])

    return now
}
