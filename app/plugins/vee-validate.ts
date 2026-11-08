import { configure } from 'vee-validate'

export default defineNuxtPlugin(() => {
  configure({
    validateOnBlur: true,
    validateOnInput: false,
    validateOnChange: false,
    validateOnModelUpdate: false
  })
})
