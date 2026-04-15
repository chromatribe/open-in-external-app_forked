import vscode from 'vscode';
import { init } from 'vscode-nls-i18n';

import commands from './commands';
import { clearExtensionConfigCache } from './config';
import { logger } from './utils/logger';

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
}

export function deactivate(): void {
    logger.dispose();
}
