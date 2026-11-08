<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { signupSchema } from '~~/shared/schemas/auth'

definePageMeta({
  layout: 'auth'
})

const { fetch: refreshSession } = useUserSession()
const { toast } = useToast()

const formSchema = signupSchema.extend({
  confirmPassword: z.string().min(8)
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

const { handleSubmit, values } = useForm({
  validationSchema: toTypedSchema(formSchema)
})

const onSubmit = handleSubmit(async () => {
  try {
    await $fetch('/api/signup', {
      method: 'POST',
      body: {
        username: values.username,
        password: values.password
      }
    })
    await refreshSession()
    toast.success('Account created successfully')
    await navigateTo('/')
  }
  catch {
    toast.error('Unable to create account')
  }
})
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">
        Create an account
      </h1>
      <p class="text-sm text-gray-500">
        Pick a username and a password.
      </p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <NFormField name="username" :required="true">
        <NInput type="text" placeholder="Username" />
      </NFormField>
      <NFormField name="password" :required="true">
        <NInput type="password" placeholder="Password" />
      </NFormField>
      <NFormField name="confirmPassword" :required="true">
        <NInput type="password" placeholder="Confirm password" />
      </NFormField>
      <NButton label="Register" type="submit" />
    </form>

    <p class="text-sm text-gray-500">
      Already have an account?
      <NuxtLink class="underline" to="/login">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
