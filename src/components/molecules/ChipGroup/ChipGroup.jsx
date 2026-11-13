import { cn } from '@/lib/cn'
import styles from './ChipGroup.module.css'

/**
 * Single-choice row of chips (filters, periods).
 * @param {{label: string, options: {value: any, label: React.ReactNode}[], value: any, onChange: (value: any) => void, disabled?: boolean, className?: string}} props
 */
export function ChipGroup({ label, options, value, onChange, disabled = false, className }) {
    return (
        <div className={cn(styles.group, className)} role="radiogroup" aria-label={label}>
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    className={cn(styles.chip, option.value === value && styles.selected)}
                    disabled={disabled}
                    onClick={() => option.value !== value && onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
