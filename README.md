# Angular Monolith to Libraries

A Visual Studio Code extension that helps you convert monolithic Angular applications into a well-structured library-based architecture. This extension provides an interactive UI for configuring libraries, analyzing dependencies, and managing the conversion process.

## Features

### 🎯 Interactive Library Configuration
- Visual interface for organizing modules into libraries
- Drag-and-drop functionality for module organization
- Save and load configuration presets
- Real-time preview of library structure

### 📊 Project Analysis
- Dependency graph visualization
- Module size analysis
- Circular dependency detection
- Coupling metrics visualization
- Detailed analysis reports

### 🔄 Conversion Process
- Automated conversion of modules to libraries
- Smart import path updates
- Progress tracking
- Backup creation before conversion
- Validation checks

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Angular Monolith to Libraries"
4. Click Install

## Prerequisites

- Visual Studio Code version 1.96.0 or higher
- Node.js and npm installed
- Angular CLI installed globally (`npm install -g @angular/cli`)
- An Angular project (version 12 or higher recommended)

## Usage

### Starting the Configuration

1. Open your Angular project in VS Code
2. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "Configure Angular Libraries" and select the command

### Configuring Libraries

1. In the configuration UI, you can:
   - Create new libraries
   - Drag and drop modules between libraries
   - Save your configuration as a preset
   - Load existing presets

2. The analysis panel shows:
   - Dependency relationships
   - Module sizes
   - Potential issues (like circular dependencies)
   - Coupling metrics

### Converting Your Project

1. Open the Command Palette
2. Type "Convert to Angular Libraries" and select the command
3. Select your source project folder
4. Select the destination folder
5. The extension will:
   - Analyze your project
   - Create a backup
   - Perform the conversion
   - Update import paths
   - Generate library configurations

## Extension Settings

This extension contributes the following settings:

* `angularMonolithToLibraries.libraries`: Configure default libraries and their patterns
* `angularMonolithToLibraries.sourceRoot`: Set the default source root directory
* `angularMonolithToLibraries.createBackup`: Enable/disable automatic backup creation

Example configuration:
```json
{
  "angularMonolithToLibraries.libraries": [
    {
      "name": "shared",
      "pattern": ["shared/**"]
    },
    {
      "name": "core",
      "pattern": ["core/**"]
    },
    {
      "name": "feature",
      "pattern": ["feature/**"]
    }
  ],
  "angularMonolithToLibraries.sourceRoot": "src/app",
  "angularMonolithToLibraries.createBackup": true
}
```

## Development

### Project Structure
```
src/
├── extension.ts                 # Main extension file
├── analysis/
│   └── project-analyzer.ts      # Analysis implementation
├── webview/
│   ├── components/
│   │   ├── LibraryConfigurationUI.tsx
│   │   ├── visualizations.tsx
│   │   └── dnd.tsx
│   └── panel.ts
├── config/
│   └── storage.ts
└── refactor.ts
```

### Building the Extension

1. Clone the repository
```bash
git clone https://github.com/angadbakshi/angular-monolith-to-libraries.git
cd angular-monolith-to-libraries
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run compile
```

4. Launch in development mode
```bash
F5 in VS Code
```

### Running Tests
```bash
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the [FAQ](link-to-faq)
2. Search existing [issues](link-to-issues)
3. Open a new issue if needed

## Release Notes

### 1.0.0
- Initial release
- Interactive library configuration UI
- Project analysis features
- Automated conversion process

## 🚧 Work in Progress

### Analysis Implementation (`src/analysis/project-analyzer.ts`)
- ✅ Basic project structure analysis
- ✅ Module dependency detection
- 🏗️ Circular dependency detection algorithm
- 🏗️ Module size calculation
- 🏗️ Coupling metrics implementation
- 📝 Planned features:
  - Advanced dependency graph analysis
  - Code quality metrics
  - Performance impact analysis
  - Bundle size predictions

### Webview Components

#### Configuration UI (`src/webview/components/LibraryConfigurationUI.tsx`)
- ✅ Basic layout structure
- ✅ Library configuration interface
- 🏗️ Drag and drop module organization
- 🏗️ Preset management interface
- 🏗️ Real-time validation
- 📝 Planned features:
  - Module search and filtering
  - Configuration validation rules
  - Undo/redo functionality
  - Configuration comparison view

#### Visualizations (`src/webview/components/visualizations.tsx`)
- ✅ Basic chart components
- 🏗️ Dependency graph visualization
- 🏗️ Module size charts
- 🏗️ Coupling metrics visualization
- 📝 Planned features:
  - Interactive dependency explorer
  - Time-series analysis views
  - Impact analysis visualization
  - Custom chart configurations

#### Drag and Drop (`src/webview/components/dnd.tsx`)
- ✅ Basic DnD setup
- 🏗️ Module drag functionality
- 🏗️ Library drop zones
- 🏗️ Drag preview
- 📝 Planned features:
  - Multi-module selection
  - Smart module grouping
  - Drag constraints
  - Custom drag handles

#### Webview Panel (`src/webview/panel.ts`)
- ✅ Basic panel setup
- ✅ Message handling
- 🏗️ State management
- 🏗️ Configuration persistence
- 📝 Planned features:
  - Multiple panel support
  - Panel state restoration
  - Custom panel layouts
  - Panel synchronization

### Legend
- ✅ Completed
- 🏗️ In Progress
- 📝 Planned

## Current Focus
1. Completing the drag and drop functionality for module organization
2. Implementing the dependency visualization system
3. Enhancing the analysis engine with more detailed metrics
4. Improving the configuration persistence system

## Next Steps
1. Implementing the circular dependency detection
2. Adding detailed module analysis reports
3. Creating the configuration preset system
4. Adding validation and error handling