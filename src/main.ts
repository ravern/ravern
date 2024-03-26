import { serve } from "./commands/serve.ts";
import { build } from "./commands/build.ts";
import { watch } from "./commands/watch.ts";
import { buildLogger } from "./helpers.ts";
import { Context } from "./context.ts";

type CommandFn = (context: Context) => Promise<void>;

const COMMANDS: { [name: string]: CommandFn } = {
  serve,
  build,
  watch,
};

async function main() {
  const logger = buildLogger();

  const command = Deno.args[1];
  if (!command) {
    logger.error("Command not provided.");
    Deno.exit(1);
  }

  const commandFn = COMMANDS[command];
  if (!commandFn) {
    logger.error("Invalid command provided.");
    Deno.exit(1);
  }

  await commandFn({ logger });
}

await main();
