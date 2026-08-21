export type CliCommand = "scan" | "graph" | "help" | "version";

export interface CliOptions {
  readonly command: CliCommand;
  readonly rootDir: string;
  readonly json: boolean;
  readonly outputPath?: string;
  readonly tsconfigPath?: string;
  readonly additionalClientModules: readonly string[];
}

export class CliArgumentError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CliArgumentError";
  }
}

function takeValue(
  args: readonly string[],
  index: number,
  option: string,
): [string, number] {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new CliArgumentError(`${option} requires a value.`);
  }
  return [value, index + 1];
}

export function parseCliArguments(args: readonly string[]): CliOptions {
  let command: CliCommand = "scan";
  let commandSet = false;
  let rootDir = ".";
  let rootSet = false;
  let json = false;
  let outputPath: string | undefined;
  let tsconfigPath: string | undefined;
  const additionalClientModules: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;

    if (argument === "--help" || argument === "-h") {
      command = "help";
      continue;
    }
    if (argument === "--version" || argument === "-v") {
      command = "version";
      continue;
    }
    if (argument === "scan" || argument === "graph") {
      if (commandSet) {
        throw new CliArgumentError("Only one command may be provided.");
      }
      command = argument;
      commandSet = true;
      continue;
    }
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--output" || argument === "-o") {
      [outputPath, index] = takeValue(args, index, argument);
      continue;
    }
    if (argument === "--tsconfig") {
      [tsconfigPath, index] = takeValue(args, index, argument);
      continue;
    }
    if (argument === "--client-module") {
      let moduleName: string;
      [moduleName, index] = takeValue(args, index, argument);
      additionalClientModules.push(moduleName);
      continue;
    }
    if (argument.startsWith("-")) {
      throw new CliArgumentError(`Unknown option: ${argument}`);
    }
    if (rootSet) {
      throw new CliArgumentError("Only one project root may be provided.");
    }
    rootDir = argument;
    rootSet = true;
  }

  return {
    command,
    rootDir,
    json,
    ...(outputPath ? { outputPath } : {}),
    ...(tsconfigPath ? { tsconfigPath } : {}),
    additionalClientModules,
  };
}
