
import type { CliCommand } from "../../../types";
import { promises as fs } from "fs";
import path from "path";

const serverTemplate = (componentName: string) => `
import { LiveComponent } from "@/core/types/types";

interface ${componentName}State {
  message: string;
}

export class ${componentName}Component extends LiveComponent<${componentName}State> {
  constructor(initialState: ${componentName}State, ws: any, options?: { room?: string; userId?: string }) {
    super({ message: "Hello from ${componentName}!", ...initialState }, ws, options);
  }

  async updateMessage(payload: { message: string }) {
    this.setState({ message: payload.message });
    return { success: true };
  }
}
`;

const clientTemplate = (componentName: string) => `
import React from 'react';
import { useHybridLiveComponent } from '@/hooks/useHybridLiveComponent';

interface ${componentName}State {
  message: string;
}

const initialState: ${componentName}State = {
  message: "Loading...",
};

export function ${componentName}() {
  const { state, call, connected } = useHybridLiveComponent<${componentName}State>('${componentName}', initialState);

  if (!connected) {
    return <div>Connecting to ${componentName}...</div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h2>${componentName} Live Component</h2>
      <p>Server message: <strong>{state.message}</strong></p>
      <button onClick={() => call('updateMessage', { message: 'Hello from the client!' })}>
        Update Message
      </button>
    </div>
  );
}
`;

export const createLiveComponentCommand: CliCommand = {
  name: "create:live-component",
  description: "Create a new live component (server and client files)",
  category: "Live Components",
  arguments: [
    {
      name: "ComponentName",
      description: "The name of the component (e.g., UserProfile)",
      required: true,
    },
  ],
  handler: async (args, options, context) => {
    const [componentName] = args;

    if (!componentName || !/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
      context.logger.error("Invalid component name. It must be in PascalCase (e.g., UserProfile).");
      return;
    }

    const serverFilePath = path.join(context.workingDir, "app", "server", "live", `${componentName}Component.ts`);
    const clientFilePath = path.join(context.workingDir, "app", "client", "src", "components", `${componentName}.tsx`);

    try {
      context.logger.info(`Creating server component: ${serverFilePath}`);
      await fs.writeFile(serverFilePath, serverTemplate(componentName).trim());

      context.logger.info(`Creating client component: ${clientFilePath}`);
      await fs.writeFile(clientFilePath, clientTemplate(componentName).trim());

      context.logger.info(`✅ Successfully created '${componentName}' live component.`);
      context.logger.info("Do not forget to add your new component to your App.tsx to see it in action!");

    } catch (error) {
      context.logger.error(`Failed to create component files: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

