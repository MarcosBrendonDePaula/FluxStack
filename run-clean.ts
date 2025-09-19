#!/usr/bin/env bun
/**
 * Clean server runner that filters Elysia HEAD bug errors
 */

// Redirect stderr to filter out HEAD errors
const originalWrite = process.stderr.write;

process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
  const str = chunk.toString();
  
  // Filter out Elysia HEAD bug errors
  if (str.includes("TypeError: undefined is not an object (evaluating '_res.headers.set')") ||
      str.includes("HEAD - / failed")) {
    // Silently ignore these errors
    if (callback) callback();
    return true;
  }
  
  // Pass through all other stderr
  return originalWrite.call(process.stderr, chunk, encoding, callback);
};

// Now run the server
console.log('🚀 Starting FluxStack with filtered output...\n');
await import('./app/server/index.ts');