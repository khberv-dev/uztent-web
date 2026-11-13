import { useState } from 'react'
import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './SearchBar.module.css'

/** Twitch-style search: input joined to a square search button. */
export function SearchBar({ onSearch, placeholder = 'Qidirish', className }) {
    const [value, setValue] = useState('')

    function handleSubmit(event) {
        event.preventDefault()
        const query = value.trim()
        if (query) onSearch?.(query)
    }

    return (
        <form role="search" className={cn(styles.searchBar, className)} onSubmit={handleSubmit}>
            <input
                type="search"
                className={styles.input}
                placeholder={placeholder}
                aria-label={placeholder}
                value={value}
                onChange={(event) => setValue(event.target.value)}
            />
            <button type="submit" className={styles.button} aria-label="Qidirish">
                <Icon name="search" size={18} />
            </button>
        </form>
    )
}
