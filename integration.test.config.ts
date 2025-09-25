
        export default {
          app: {
            name: '', // Invalid empty name
            version: 'invalid-version' // Invalid version format
          },
          server: {
            port: 70000, // Invalid port
            host: 'localhost',
            apiPrefix: '/api',
            cors: {
              origins: [], // Invalid empty array
              methods: ['GET'],
              headers: ['Content-Type']
            },
            middleware: []
          }
        }
      