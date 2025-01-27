import * as vscode from 'vscode';

export interface LibraryConfig {
    name: string;
    pattern: string[];
}

export interface ExtensionConfig {
    libraries: LibraryConfig[];
    sourceRoot: string;
    backupEnabled: boolean;
}

export async function getConfiguration(): Promise<ExtensionConfig> {
    const config = vscode.workspace.getConfiguration('angularMonolithToLibraries');
    
    return {
        libraries: config.get<LibraryConfig[]>('libraries', [
            { name: 'shared', pattern: ['shared/**'] },
            { name: 'core', pattern: ['core/**'] },
            { name: 'feature', pattern: ['feature/**'] }
        ]),
        sourceRoot: config.get<string>('sourceRoot', 'src/app'),
        backupEnabled: config.get<boolean>('createBackup', true)
    };
}