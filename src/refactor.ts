import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';
import * as ts from 'typescript';
import { ExtensionConfig, LibraryConfig } from './config-types';

/**
 * Converts a monolithic Angular app into multiple private Angular libraries.
 * @param sourcePath The path to the Angular project.
 * @param destinationPath The path where libraries will be created.
 * @param config Extension configuration.
 * @param progressCallback Callback for reporting progress.
 */
export async function convertToLibraries(
    sourcePath: string,
    destinationPath: string,
    config: ExtensionConfig,
    progressCallback?: (status: string, increment: number) => void
) {
    const reportProgress = (status: string, increment: number) => {
        progressCallback?.(status, increment);
    };

    try {
        // Step 1: Analyze the source folder structure
        reportProgress('Analyzing project structure...', 10);
        const moduleFolders = await findParentModuleFolders(sourcePath, config.sourceRoot);

        // Step 2: Create Angular libraries in the destination folder
        reportProgress('Creating library projects...', 20);
        for (const lib of config.libraries) {
            console.log(`Creating library: ${lib.name}`);
            execSync(`ng generate library ${lib.name} --skip-install`, { cwd: destinationPath });
        }

        // Step 3: Categorize modules into libraries
        reportProgress('Categorizing modules...', 30);
        const libraryAssignments = categorizeModules(moduleFolders, config.libraries);

        // Step 4: Move modules to appropriate libraries
        reportProgress('Moving modules to libraries...', 50);
        let modulesMoved = 0;
        const totalModules = Object.values(libraryAssignments).flat().length;
        
        for (const [libName, modules] of Object.entries(libraryAssignments)) {
            for (const moduleFolder of modules) {
                await moveModuleFolderToLibrary(moduleFolder, libName, sourcePath, destinationPath);
                modulesMoved++;
                reportProgress(
                    `Moving modules (${modulesMoved}/${totalModules})...`, 
                    50 + (modulesMoved / totalModules) * 20
                );
            }
        }

        // Step 5: Update imports
        reportProgress('Updating import paths...', 70);
        await updateImports(destinationPath, config);

        // Step 6: Update library public APIs
        reportProgress('Updating library public APIs...', 90);
        await updateLibraryApis(destinationPath, config.libraries);

        reportProgress('Finalizing...', 100);
    } catch (error) {
        console.error('Error during conversion:', error);
        throw error;
    }
}

/**
 * Finds all parent module folders in the project.
 */
async function findParentModuleFolders(sourcePath: string, sourceRoot: string): Promise<string[]> {
    const moduleFolders: string[] = [];
    const rootPath = path.join(sourcePath, sourceRoot);

    const allFiles = await glob('**/*.module.ts', { 
        cwd: rootPath,
        absolute: true
    });

    for (const file of allFiles) {
        const folderPath = path.dirname(file);
        if (!moduleFolders.includes(folderPath)) {
            moduleFolders.push(folderPath);
        }
    }

    return moduleFolders;
}

/**
 * Categorizes modules into their target libraries based on patterns.
 */
function categorizeModules(
    moduleFolders: string[], 
    libraries: LibraryConfig[]
): Record<string, string[]> {
    const assignments: Record<string, string[]> = {};
    
    // Initialize empty arrays for each library
    libraries.forEach(lib => {
        assignments[lib.name] = [];
    });

    // Assign each module to a library based on patterns
    for (const moduleFolder of moduleFolders) {
        let assigned = false;
        for (const lib of libraries) {
            for (const pattern of lib.pattern) {
                if (moduleFolder.includes(pattern.replace('/**', ''))) {
                    assignments[lib.name].push(moduleFolder);
                    assigned = true;
                    break;
                }
            }
            if (assigned) break;
        }
        
        // If no pattern matched, assign to the first library as fallback
        if (!assigned && libraries.length > 0) {
            assignments[libraries[0].name].push(moduleFolder);
        }
    }

    return assignments;
}

/**
 * Moves a module folder to its target library.
 */
async function moveModuleFolderToLibrary(
    moduleFolder: string,
    libraryName: string,
    sourcePath: string,
    destinationPath: string
) {
    const libPath = path.join(destinationPath, 'projects', libraryName, 'src', 'lib');
    const relativePath = path.relative(sourcePath, moduleFolder);
    const destinationFolderPath = path.join(libPath, path.basename(moduleFolder));

    await fs.move(moduleFolder, destinationFolderPath, { overwrite: true });
}

/**
 * Updates import paths across the project.
 */
async function updateImports(projectPath: string, config: ExtensionConfig) {
    const files = await glob('**/*.ts', { 
        cwd: projectPath, 
        ignore: ['**/node_modules/**', '**/dist/**'],
        absolute: true
    });

    for (const file of files) {
        const sourceCode = await fs.readFile(file, 'utf-8');
        const sourceFile = ts.createSourceFile(
            file,
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const updatedCode = updateImportsInFile(sourceFile, config);
        if (updatedCode !== sourceCode) {
            await fs.writeFile(file, updatedCode);
        }
    }
}

/**
 * Updates import paths in a single file.
 */
function updateImportsInFile(sourceFile: ts.SourceFile, config: ExtensionConfig): string {
    const changes: ts.TextChange[] = [];

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node)) {
            const importPath = node.moduleSpecifier.getText(sourceFile).slice(1, -1);
            const updatedPath = getUpdatedImportPath(importPath, config);

            if (updatedPath !== importPath) {
                const start = node.moduleSpecifier.getStart(sourceFile) + 1;
                const end = node.moduleSpecifier.getEnd() - 1;
                changes.push({
                    span: { start, length: end - start },
                    newText: updatedPath,
                });
            }
        }
    });

    if (changes.length === 0) {
        return sourceFile.getFullText();
    }

    return applyTextChanges(sourceFile.getFullText(), changes);
}

/**
 * Updates a single import path based on the configuration.
 */
function getUpdatedImportPath(importPath: string, config: ExtensionConfig): string {
    if (importPath.startsWith(config.sourceRoot)) {
        const relativePath = importPath.replace(`${config.sourceRoot}/`, '');
        for (const lib of config.libraries) {
            for (const pattern of lib.pattern) {
                const patternBase = pattern.replace('/**', '');
                if (relativePath.startsWith(patternBase)) {
                    return `@${lib.name}/${relativePath.replace(patternBase + '/', '')}`;
                }
            }
        }
    }
    return importPath;
}

/**
 * Updates the public API (public-api.ts) files for each library.
 */
async function updateLibraryApis(destinationPath: string, libraries: LibraryConfig[]) {
    for (const lib of libraries) {
        const libPath = path.join(destinationPath, 'projects', lib.name, 'src');
        const publicApiPath = path.join(libPath, 'public-api.ts');
        
        // Find all modules in the library
        const modules = await glob('lib/**/*.module.ts', { 
            cwd: libPath,
            absolute: true
        });

        // Generate exports for each module
        const exports = modules.map(module => {
            const relativePath = path.relative(libPath, module).replace('.ts', '');
            return `export * from './${relativePath}';`;
        });

        // Update public-api.ts
        await fs.writeFile(publicApiPath, exports.join('\n'));
    }
}

/**
 * Applies text changes to source code.
 */
function applyTextChanges(sourceCode: string, changes: ts.TextChange[]): string {
    let result = sourceCode;
    for (const change of changes.sort((a, b) => b.span.start - a.span.start)) {
        const prefix = result.slice(0, change.span.start);
        const suffix = result.slice(change.span.start + change.span.length);
        result = prefix + change.newText + suffix;
    }
    return result;
}