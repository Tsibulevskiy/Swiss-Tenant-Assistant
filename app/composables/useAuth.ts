type AuthUser = {
  id: number
  email: string
  role: 'user' | 'admin'
  locale: string
  createdAt: string | Date
}

type MeResponse = {
  ok: true
  data: {
    user: AuthUser | null
  }
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)

  async function fetchCurrentUser(force = false) {
    if (initialized.value && !force) {
      return user.value
    }

    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const response = await $fetch<MeResponse>('/api/auth/me', {
        credentials: 'include',
        headers
      })

      user.value = response.data.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }

    return user.value
  }

  function setUser(value: AuthUser | null) {
    user.value = value
    initialized.value = true
  }

  function clearUser() {
    user.value = null
    initialized.value = true
  }

  async function logout() {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })

    clearUser()
  }

  return {
    user,
    initialized,
    fetchCurrentUser,
    setUser,
    clearUser,
    logout
  }
}
