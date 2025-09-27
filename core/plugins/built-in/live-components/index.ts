import { createLiveComponentCommand } from './commands/create-live-component';

// This is the entry point for the live-components built-in plugin.
// It exports all the commands that should be registered by the CLI.

export const commands = [createLiveComponentCommand];
