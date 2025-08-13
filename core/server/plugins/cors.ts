import { cors } from '@elysiajs/cors'
import { Plugin, FluxStackContext } from '@/core/types'

export const corsPlugin: Plugin = {
    name: 'cors',
    setup(context: FluxStackContext, app: any) {
        // Configure CORS for development and production
        const developmentOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            // Common Vite ports
            'http://localhost:5173',
            'http://localhost:5174', 
            'http://localhost:5175',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:5175'
        ]

        const corsOptions = {
            origin: context.isDevelopment 
                ? developmentOrigins
                : true, // In production, configure with specific origins
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            maxAge: 86400 // 24 hours
        }

        app.use(cors(corsOptions))
        console.log(`🌐 CORS plugin loaded (dev: ${context.isDevelopment})`)
        
        if (context.isDevelopment) {
            console.log(`   ✅ Allowed origins: ${corsOptions.origin}`)
        }
    }
}