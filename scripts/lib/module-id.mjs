const currentScriptPath = import.meta.url;
const moduleIdMatch = currentScriptPath.match(/modules\/([^/]+)\//);
export const MODULE_ID = moduleIdMatch ? moduleIdMatch[1] : null;
