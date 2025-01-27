import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import * as vscode from 'vscode';

export interface ValidationResult {
    isValid: boolean;
    message: string;
}

export async function validateAngularProject(projectPath: string): Promise<ValidationResult> {
    try {
        // Check for angular.json
        const angularJsonPath = path.join(projectPath, 'angular.json');
        if (!fs.existsSync(angularJsonPath)) {
            return {
                isValid: false,
                message: 'Not a valid Angular project: angular.json not found'
            };
        }

        // Check for package.json and verify Angular dependencies
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return {
                isValid: false,
                message: 'package.json not found'
            };
        }

        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const hasAngularDeps = packageJson.dependencies && 
            (packageJson.dependencies['@angular/core'] || packageJson.dependencies['@angular/common']);

        if (!hasAngularDeps) {
            return {
                isValid: false,
                message: 'No Angular dependencies found in package.json'
            };
        }

        // Check for src/app directory
        const srcAppPath = path.join(projectPath, 'src', 'app');
        if (!fs.existsSync(srcAppPath)) {
            return {
                isValid: false,
                message: 'src/app directory not found'
            };
        }

        // Check for at least one module file
        const hasModules = fs.readdirSync(srcAppPath, { recursive: true })
            .some(file => file.toString().endsWith('.module.ts'));

        if (!hasModules) {
            return {
                isValid: false,
                message: 'No Angular modules found in the project'
            };
        }

        return {
            isValid: true,
            message: 'Valid Angular project'
        };
    } catch (error) {
        return {
            isValid: false,
            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function checkAngularCLI(): Promise<ValidationResult> {
    try {
        execSync('ng version', { stdio: 'ignore' });
        return {
            isValid: true,
            message: 'Angular CLI is installed'
        };
    } catch (error) {
        return {
            isValid: false,
            message: 'Angular CLI is not installed. Please install it using: npm install -g @angular/cli'
        };
    }
}

export async function createProjectBackup(projectPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${projectPath}-backup-${timestamp}`;
    
    await fs.copy(projectPath, backupPath, {
        filter: (src) => !src.includes('node_modules')
    });
    
    return backupPath;
}