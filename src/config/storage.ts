import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ConfigurationPreset {
    name: string;
    libraries: Array<{
        name: string;
        pattern: string[];
    }>;
}

export class ConfigurationStorage {
    private readonly configPath: string;
    private readonly presetsPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.configPath = path.join(context.globalStorageUri.fsPath, 'config');
        this.presetsPath = path.join(this.configPath, 'presets');
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        await fs.ensureDir(this.configPath);
        await fs.ensureDir(this.presetsPath);
    }

    public async savePreset(preset: ConfigurationPreset): Promise<void> {
        const filePath = path.join(this.presetsPath, `${preset.name}.json`);
        await fs.writeJSON(filePath, preset, { spaces: 2 });
    }

    public async loadPreset(name: string): Promise<ConfigurationPreset | null> {
        try {
            const filePath = path.join(this.presetsPath, `${name}.json`);
            return await fs.readJSON(filePath);
        } catch (error) {
            return null;
        }
    }

    public async listPresets(): Promise<string[]> {
        const files = await fs.readdir(this.presetsPath);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    }

    public async deletePreset(name: string): Promise<void> {
        const filePath = path.join(this.presetsPath, `${name}.json`);
        await fs.remove(filePath);
    }
}