import type { Uri } from 'vscode';

import { parseVariables } from './variable';

let _isWindows = false;
let _isMacintosh = false;
let _isLinux = false;

switch (process.platform) {
    case 'win32':
        _isWindows = true;
        break;
    case 'darwin':
        _isMacintosh = true;
        break;
    case 'linux':
        _isLinux = true;
        break;
}

export const isWindows = _isWindows;
export const isMacintosh = _isMacintosh;
export const isLinux = _isLinux;

export function getShellEnv(): NodeJS.ProcessEnv {
    return { ...process.env };
}

export async function mergeEnvironments(
    parent: NodeJS.ProcessEnv,
    other: NodeJS.ProcessEnv | undefined,
    activeFile?: Uri,
) {
    if (!other) {
        return;
    }

    const entries = Object.entries(other).filter(([, value]) => value !== undefined);
    const stringValues = entries
        .map(([, value]) => value)
        .filter((value): value is string => typeof value === 'string');
    const parsedStringValues = await parseVariables([...stringValues], activeFile);
    let parsedStringIndex = 0;

    for (const [key, value] of entries) {
        const mergedKey = isWindows ? resolveWindowsEnvironmentKey(parent, key) : key;
        if (typeof value === 'string') {
            parent[mergedKey] = parsedStringValues[parsedStringIndex++];
        } else {
            delete parent[mergedKey];
        }
    }
}

function resolveWindowsEnvironmentKey(env: NodeJS.ProcessEnv, key: string): string {
    // In Windows, environment variables are case-insensitive.
    for (const envKey in env) {
        if (key.toLowerCase() === envKey.toLowerCase()) {
            return envKey;
        }
    }
    return key;
}
