<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()

await navigateTo(localePath({
  path: '/auth/register',
  query: route.query
}), { replace: true })
</script>

<template>
  <div />
</template>
