import type { ExecOptions } from 'node:child_process';
import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { Options as OpenOptions } from 'open';
import _open from 'open';
import vscode, { Uri } from 'vscode';
import { wslToWindows } from 'wsl-path';

import { logger } from './logger';
import { getShellEnv, mergeEnvironments, isWindows, isMacintosh, isLinux } from './platform';
import { parseVariables } from './variable';

export function isObject(value: any) {
    return value !== null && typeof value === 'object';
}

export const exec = promisify(_exec);
const OPEN_TIMEOUT_MS = 15_000;
const SHELL_COMMAND_TIMEOUT_MS = 15_000;
const EXEC_MAX_BUFFER_SIZE = 10 * 1024 * 1024;

function formatError(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string) {
    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timeoutHandle !== undefined) {
            clearTimeout(timeoutHandle);
        }
    }
}

async function openByPkg(filePath: string, options?: OpenOptions) {
    logger.info(`open file by open pkg, options:\n${JSON.stringify(options, undefined, 4)}`);
    return withTimeout(_open(filePath, options), OPEN_TIMEOUT_MS, 'open pkg');
}

async function openByBuiltinApi(filePath: string) {
    logger.info('open file by vscode builtin api');
    // https://github.com/microsoft/vscode/issues/88273
    return withTimeout(
        vscode.env.openExternal(Uri.file(filePath)),
        OPEN_TIMEOUT_MS,
        'vscode openExternal',
    );
}

export async function open(filePath: string, appConfig?: string | ExternalAppConfig) {
    logger.info(`opened file is: "${filePath}"`);
    try {
        // Convert WSL path to Windows path if needed (only once at the beginning)
        // Default is true to support Windows applications in WSL (the most common use case)
        let convertedPath = filePath;
        if (vscode.env.remoteName === 'wsl') {
            const shouldConvert =
                typeof appConfig === 'object' ? appConfig.wslConvertWindowsPath !== false : true;

            if (shouldConvert) {
                convertedPath = await withTimeout(
                    wslToWindows(filePath, { wslCommand: 'wsl.exe' }),
                    OPEN_TIMEOUT_MS,
                    'wsl path conversion',
                );
            }
        }

        if (typeof appConfig === 'string') {
            await openByPkg(convertedPath, {
                app: {
                    name: appConfig,
                },
            });
        } else if (appConfig !== null && typeof appConfig === 'object') {
            if (appConfig.isElectronApp) {
                await openByBuiltinApi(convertedPath);
            } else if (appConfig.shellCommand) {
                const parsedCommand = (
                    await parseVariables([appConfig.shellCommand!], Uri.file(convertedPath))
                )[0];
                logger.info(`open file by shell command: "${parsedCommand}"`);
                if (appConfig.shellEnv) {
                    const shellEnv = getShellEnv();

                    let additionalEnv: NodeJS.ProcessEnv;
                    if (isWindows && typeof appConfig.shellEnv.windows === 'object') {
                        additionalEnv = appConfig.shellEnv.windows;
                    } else if (isMacintosh && typeof appConfig.shellEnv.osx === 'object') {
                        additionalEnv = appConfig.shellEnv.osx;
                    } else if (isLinux && typeof appConfig.shellEnv.linux === 'object') {
                        additionalEnv = appConfig.shellEnv.linux;
                    } else {
                        additionalEnv = appConfig.shellEnv as NodeJS.ProcessEnv;
                    }

                    await mergeEnvironments(shellEnv, additionalEnv, Uri.file(convertedPath));
                    const options: ExecOptions = {
                        env: shellEnv,
                        timeout: SHELL_COMMAND_TIMEOUT_MS,
                        maxBuffer: EXEC_MAX_BUFFER_SIZE,
                    };
                    await exec(parsedCommand, options);
                } else {
                    await exec(parsedCommand, {
                        timeout: SHELL_COMMAND_TIMEOUT_MS,
                        maxBuffer: EXEC_MAX_BUFFER_SIZE,
                    });
                }
            } else if (appConfig.openCommand) {
                const args = await parseVariables(appConfig.args ?? [], Uri.file(convertedPath));
                await openByPkg(convertedPath, {
                    app: {
                        name: appConfig.openCommand,
                        arguments: args,
                    },
                });
            }
        } else if (vscode.env.remoteName === 'wsl') {
            await openByPkg(convertedPath);
        } else {
            await openByBuiltinApi(convertedPath);
        }
    } catch (error) {
        const appName =
            typeof appConfig === 'string'
                ? appConfig
                : appConfig?.title ?? appConfig?.openCommand ?? 'default app';
        vscode.window.showErrorMessage(
            `Failed to open file "${filePath}" with ${appName}: ${formatError(error)}`,
        );
        logger.info('open failed with error:');
        logger.info(error);
        if (appConfig !== undefined && typeof appConfig === 'object' && appConfig.shellCommand) {
            logger.info('failed shell command context:');
            logger.info({
                shellCommand: appConfig.shellCommand,
                openCommand: appConfig.openCommand,
            });
        }
    }
}
