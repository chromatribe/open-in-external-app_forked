import { extname } from 'node:path';

import vscode from 'vscode';
import { init } from 'vscode-nls-i18n';

import commands from './commands';
import getExtensionConfig, { clearExtensionConfigCache } from './config';
import openInExternalApp from './openInExternalApp';
import { logger } from './utils/logger';

function getFallbackConfigItem(configuration: ExtensionConfigItem[]) {
    return configuration.find((item) => item.extensionName === '*');
}

function getConfigItemByExtName(configuration: ExtensionConfigItem[], extensionName: string) {
    const matchedConfigItem = configuration.find((item) =>
        Array.isArray(item.extensionName)
            ? item.extensionName.includes(extensionName)
            : item.extensionName === extensionName,
    );
    return matchedConfigItem ?? getFallbackConfigItem(configuration);
}

function shouldAutoOpenByConfigItem(configItem: ExtensionConfigItem | undefined) {
    return Boolean(configItem?.autoOpenOnFileOpen);
}

function shouldAutoOpen(document: vscode.TextDocument) {
    if (document.uri.scheme !== 'file') {
        return false;
    }

    const configuration = getExtensionConfig();
    const sharedConfigItem = configuration.find((item) => item.extensionName === '__ALL__');
    if (shouldAutoOpenByConfigItem(sharedConfigItem)) {
        return true;
    }

    const ext = extname(document.uri.fsPath);
    const extensionName = ext === '' || ext === '.' ? null : ext.slice(1);
    const matchedConfigItem = extensionName
        ? getConfigItemByExtName(configuration, extensionName)
        : getFallbackConfigItem(configuration);
    return shouldAutoOpenByConfigItem(matchedConfigItem);
}

export function activate(context: vscode.ExtensionContext): void {
    init(context.extensionPath);

    logger.info(`language: ${vscode.env.language}`);
    const { remoteName } = vscode.env;
    if (remoteName) {
        logger.info(`active extension in ${remoteName} remote environment`);
    }

    commands.forEach((command) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(command.identifier!, command.handler),
        );
    });

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('openInExternalApp.openMapper')) {
                clearExtensionConfigCache();
            }
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (document) => {
            if (!shouldAutoOpen(document)) {
                return;
            }
            logger.info(`auto open in external app for: ${document.uri.fsPath}`);
            await openInExternalApp(document.uri);
        }),
    );
}

export function deactivate(): void {
    logger.dispose();
}
