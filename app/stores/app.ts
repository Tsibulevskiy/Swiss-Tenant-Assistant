export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(false)

  function setSidebarOpen(value: boolean) {
    sidebarOpen.value = value
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar
  }
})
