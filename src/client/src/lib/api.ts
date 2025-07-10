// Cliente API para comunicação com o backend
const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000'

export const api = {
  api: {
    index: {
      get: async () => {
        const response = await fetch(`${baseUrl}/api`)
        const data = await response.json()
        return { data }
      }
    },
    users: {
      get: async () => {
        const response = await fetch(`${baseUrl}/api/users`)
        const data = await response.json()
        return { data }
      },
      post: async (body: { name: string; email: string }) => {
        const response = await fetch(`${baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const data = await response.json()
        return { data }
      }
    }
  }
}