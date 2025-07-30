// Mock API responses for testing
export const mockApiResponses = {
  users: {
    list: {
      users: [
        {
          id: 1,
          name: 'Mock User 1',
          email: 'mock1@example.com',
          createdAt: new Date('2024-01-01')
        },
        {
          id: 2,
          name: 'Mock User 2', 
          email: 'mock2@example.com',
          createdAt: new Date('2024-01-02')
        }
      ]
    },
    create: {
      success: true,
      user: {
        id: 3,
        name: 'New Mock User',
        email: 'newmock@example.com',
        createdAt: new Date()
      }
    },
    error: {
      success: false,
      message: 'Mock error message'
    }
  },
  api: {
    index: {
      message: 'Hello from Mock FluxStack API!'
    }
  }
}

export const mockApi = {
  api: {
    index: {
      get: () => Promise.resolve({ data: mockApiResponses.api.index })
    },
    users: {
      get: () => Promise.resolve({ data: mockApiResponses.users.list }),
      post: (body: any) => {
        if (body.email === 'error@test.com') {
          return Promise.resolve({ data: mockApiResponses.users.error })
        }
        return Promise.resolve({ data: mockApiResponses.users.create })
      }
    }
  }
}