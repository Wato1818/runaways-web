<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { loginSchema } from '~~/shared/schemas/auth'

definePageMeta({
  layout: 'auth'
})

const { fetch: refreshSession } = useUserSession()
const { toast } = useToast()

const { handleSubmit, values } = useForm({
  validationSchema: toTypedSchema(loginSchema)
})

const onSubmit = handleSubmit(async () => {
  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: { ...values }
    })
    await refreshSession()
    toast.success('Signed in successfully')
    await navigateTo('/')
  }
  catch {
    toast.error('Invalid username or password')
  }
})
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">
        Sign in
      </h1>
      <p class="text-sm text-gray-500">
        Use your username and password.
      </p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <NFormField name="username" :required="true">
        <NInput type="text" placeholder="Username" />
      </NFormField>
      <NFormField name="password" :required="true">
        <NInput type="password" placeholder="Password" />
      </NFormField>
      <NButton label="Sign in" type="submit" />
    </form>

    <p class="text-sm text-gray-500">
      No account?
      <NuxtLink class="underline" to="/register">
        Register
      </NuxtLink>
    </p>
  </div>
</template>
