import { useState } from 'react'
import { getErrorStatus, getValidationErrors } from '@/api/errors'
import { Button } from '@/components/atoms'
import { Alert, FormField, PasswordField } from '@/components/molecules'
import { usePasswordLogin } from '@/features/auth'
import styles from './LoginForm.module.css'

const FIELDS = ['login', 'password']

/** Email-or-username + password login (POST /auth/login). Route guards redirect on success. */
export function LoginForm() {
    const [values, setValues] = useState({ login: '', password: '' })
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState(null)

    const { mutate, isPending } = usePasswordLogin({
        onError: (error) => {
            if (getErrorStatus(error) === 401) {
                setFormError('Login yoki parol notoʻgʻri. Google orqali roʻyxatdan oʻtganmisiz? Avval Sozlamalarda parol oʻrnating.')
                return
            }
            const { fieldErrors, formError } = getValidationErrors(error, FIELDS)
            setErrors(fieldErrors)
            setFormError(formError)
        },
    })

    function update(field) {
        return (event) => {
            setValues((prev) => ({ ...prev, [field]: event.target.value }))
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    function handleSubmit(event) {
        event.preventDefault()
        const login = values.login.trim()
        const nextErrors = {}
        if (!login) nextErrors.login = 'Email yoki username kiriting.'
        if (!values.password) nextErrors.password = 'Parolni kiriting.'
        setErrors(nextErrors)
        setFormError(null)
        if (Object.keys(nextErrors).length) return

        mutate({ login, password: values.password })
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {formError && <Alert>{formError}</Alert>}
            <FormField
                label="Email yoki username"
                name="login"
                autoComplete="username"
                maxLength={254}
                value={values.login}
                onChange={update('login')}
                error={errors.login}
            />
            <PasswordField
                label="Parol"
                name="password"
                autoComplete="current-password"
                maxLength={128}
                value={values.password}
                onChange={update('password')}
                error={errors.password}
            />
            <Button type="submit" size="lg" fullWidth loading={isPending}>
                Kirish
            </Button>
        </form>
    )
}
