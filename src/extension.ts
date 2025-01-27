import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { convertToLibraries } from './refactor';
import { validateAngularProject, checkAngularCLI, createProjectBackup } from './validation-utils';
import { getConfiguration } from './config-types';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Extension "angular-monolith-to-libraries" is now active!');

    // Check if workspace has angular.json
    const hasAngularJson = await checkForAngularJson();
    await vscode.commands.executeCommand('setContext', 'workspaceHasAngularJson', hasAngularJson);

    // Register the convert command
    let convertCommand = vscode.commands.registerCommand('angular-monolith-to-libraries.convert', async () => {
        try {
            // Check Angular CLI first
            const cliCheck = await checkAngularCLI();
            if (!cliCheck.isValid) {
                vscode.window.showErrorMessage(cliCheck.message);
                return;
            }

            // Get source folder
            const sourceFolder = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Angular Project',
                title: 'Select the Angular project to convert',
            });

            if (!sourceFolder || sourceFolder.length === 0) {
                return;
            }

            // Validate project structure
            const validationResult = await validateAngularProject(sourceFolder[0].fsPath);
            if (!validationResult.isValid) {
                vscode.window.showErrorMessage(validationResult.message);
                return;
            }

            // Get destination folder
            const destinationFolder = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Destination',
                title: 'Select where to create the libraries',
            });

            if (!destinationFolder || destinationFolder.length === 0) {
                return;
            }

            // Load configuration
            const config = await getConfiguration();

            // Create backup if enabled
            if (config.backupEnabled) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Creating project backup...',
                    cancellable: false
                }, async () => {
                    const backupPath = await createProjectBackup(sourceFolder[0].fsPath);
                    vscode.window.showInformationMessage(`Backup created at: ${backupPath}`);
                });
            }

            // Perform conversion with progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Converting to libraries...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                await convertToLibraries(
                    sourceFolder[0].fsPath,
                    destinationFolder[0].fsPath,
                    config,
                    (status: string, increment: number) => {
                        progress.report({ increment, message: status });
                    }
                );
            });

            vscode.window.showInformationMessage('Successfully converted to libraries!');
        } catch (error) {
            vscode.window.showErrorMessage(`Error during conversion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Register the configure command
    let configureCommand = vscode.commands.registerCommand('angular-monolith-to-libraries.configure', async () => {
        if (!hasAngularJson) {
            vscode.window.showErrorMessage('No Angular project detected in the workspace.');
            return;
        }
        vscode.window.showInformationMessage('Configuring Angular Libraries...');
        // Your configuration UI implementation
    });

    context.subscriptions.push(convertCommand, configureCommand);
}

async function checkForAngularJson(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return false;
    }

    for (const folder of workspaceFolders) {
        const angularJsonPath = path.join(folder.uri.fsPath, 'angular.json');
        try {
            await fs.access(angularJsonPath);
            return true;
        } catch {
            continue;
        }
    }
    return false;
}

export function deactivate() {}