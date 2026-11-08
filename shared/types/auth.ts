declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    role: 'user' | 'admin'
  }
}

export {}
