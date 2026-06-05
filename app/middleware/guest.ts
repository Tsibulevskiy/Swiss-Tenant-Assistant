export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const auth = useAuth()
  const user = await auth.fetchCurrentUser()

  if (user) {
    return navigateTo(localePath('/'))
  }
})
