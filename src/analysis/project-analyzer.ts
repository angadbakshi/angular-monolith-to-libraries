import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';

export interface ModuleInfo {
    name: string;
    path: string;
    size: number;
    dependencies: string[];
    exports: string[];
}

export interface DependencyGraph {
    nodes: string[];
    edges: Array<{ source: string; target: string }>;
}

export interface AnalysisReport {
    modules: ModuleInfo[];
    dependencyGraph: DependencyGraph;
    circularDependencies: string[][];
    sizesAnalysis: {
        moduleSizes: Record<string, number>;
        totalSize: number;
        averageSize: number;
    };
    couplingMetrics: {
        afferentCoupling: Record<string, number>;
        efferentCoupling: Record<string, number>;
        instability: Record<string, number>;
    };
}

export class ProjectAnalyzer {
    constructor(private projectPath: string) {}

    public async analyzeProject(): Promise<AnalysisReport> {
        const modules = await this.findModules();
        const dependencyGraph = await this.buildDependencyGraph(modules);
        const circular = this.findCircularDependencies(dependencyGraph);
        const sizes = await this.analyzeSizes(modules);
        const coupling = this.calculateCouplingMetrics(dependencyGraph);

        return {
            modules,
            dependencyGraph,
            circularDependencies: circular,
            sizesAnalysis: sizes,
            couplingMetrics: coupling
        };
    }

    private async findModules(): Promise<ModuleInfo[]> {
        const moduleFiles = await glob('**/*.module.ts', {
            cwd: this.projectPath,
            absolute: true
        });

        const modules: ModuleInfo[] = [];
        for (const filePath of moduleFiles) {
            const content = await fs.readFile(filePath, 'utf-8');
            const sourceFile = ts.createSourceFile(
                filePath,
                content,
                ts.ScriptTarget.Latest,
                true
            );

            const dependencies = this.extractDependencies(sourceFile);
            const exports = this.extractExports(sourceFile);
            const stats = await fs.stat(filePath);

            modules.push({
                name: path.basename(filePath, '.module.ts'),
                path: filePath,
                size: stats.size,
                dependencies,
                exports
            });
        }

        return modules;
    }

    private extractDependencies(sourceFile: ts.SourceFile): string[] {
        const dependencies: string[] = [];
        
        const visit = (node: ts.Node) => {
            if (ts.isImportDeclaration(node)) {
                const importPath = node.moduleSpecifier.getText(sourceFile);
                dependencies.push(importPath.slice(1, -1));
            }
            ts.forEachChild(node, visit);
        };

        ts.forEachChild(sourceFile, visit);
        return dependencies;
    }

    private extractExports(sourceFile: ts.SourceFile): string[] {
        const exports: string[] = [];
        
        const visit = (node: ts.Node) => {
            if (ts.isExportDeclaration(node)) {
                // Extract export information
                if (node.moduleSpecifier) {
                    exports.push(node.moduleSpecifier.getText(sourceFile));
                }
            }
            ts.forEachChild(node, visit);
        };

        ts.forEachChild(sourceFile, visit);
        return exports;
    }

    private async buildDependencyGraph(modules: ModuleInfo[]): Promise<DependencyGraph> {
        const graph: DependencyGraph = {
            nodes: modules.map(m => m.name),
            edges: []
        };

        for (const module of modules) {
            for (const dep of module.dependencies) {
                const targetModule = modules.find(m => 
                    dep.includes(m.name.toLowerCase())
                );
                if (targetModule) {
                    graph.edges.push({
                        source: module.name,
                        target: targetModule.name
                    });
                }
            }
        }

        return graph;
    }

    private findCircularDependencies(graph: DependencyGraph): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const path: string[] = [];

        const dfs = (node: string) => {
            if (path.includes(node)) {
                const cycle = path.slice(path.indexOf(node));
                cycles.push(cycle);
                return;
            }

            if (visited.has(node)) {
                return;
            }

            visited.add(node);
            path.push(node);

            const edges = graph.edges.filter(e => e.source === node);
            for (const edge of edges) {
                dfs(edge.target);
            }

            path.pop();
        };

        for (const node of graph.nodes) {
            dfs(node);
        }

        return cycles;
    }

    private async analyzeSizes(modules: ModuleInfo[]): Promise<{
        moduleSizes: Record<string, number>;
        totalSize: number;
        averageSize: number;
    }> {
        const moduleSizes: Record<string, number> = {};
        let totalSize = 0;

        for (const module of modules) {
            const size = await this.calculateModuleSize(module.path);
            moduleSizes[module.name] = size;
            totalSize += size;
        }

        return {
            moduleSizes,
            totalSize,
            averageSize: totalSize / modules.length
        };
    }

    private async calculateModuleSize(modulePath: string): Promise<number> {
        // Get all related files (component, service, etc.)
        const baseDir = path.dirname(modulePath);
        const baseName = path.basename(modulePath, '.module.ts');
        const files = await glob(`${baseName}.*`, { cwd: baseDir, absolute: true });
        
        let totalSize = 0;
        for (const file of files) {
            const stats = await fs.stat(file);
            totalSize += stats.size;
        }
        
        return totalSize;
    }

    private calculateCouplingMetrics(graph: DependencyGraph): {
        afferentCoupling: Record<string, number>;
        efferentCoupling: Record<string, number>;
        instability: Record<string, number>;
    } {
        const afferentCoupling: Record<string, number> = {};
        const efferentCoupling: Record<string, number> = {};
        const instability: Record<string, number> = {};

        // Calculate afferent coupling (incoming dependencies)
        for (const node of graph.nodes) {
            afferentCoupling[node] = graph.edges.filter(e => e.target === node).length;
            efferentCoupling[node] = graph.edges.filter(e => e.source === node).length;
            
            const totalCoupling = afferentCoupling[node] + efferentCoupling[node];
            instability[node] = totalCoupling === 0 ? 0 : efferentCoupling[node] / totalCoupling;
        }

        return {
            afferentCoupling,
            efferentCoupling,
            instability
        };
    }
}