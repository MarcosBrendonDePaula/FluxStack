export const config = {
  port: process.env.PORT || 3000,
  vitePort: 5173,
  isDevelopment: process.env.NODE_ENV !== "production",
  clientPath: "src/client",
  clientDistPath: "src/client/dist"
}