# gamedata-editor

A simple way to manage your Data within your game application making creating new instancee simple. You can maintain and edit game and mod files with this editor it is build for `modding in mind` projects.

Work in progress

- ✅ - Electron Windows Build
- ✅ - Basic UI
- 🔄 - UI to display the Filetree
- ❌ - JsonSchema Support for schema of classes to serialize
- ❌ - Have default folder Structure
- ❌ - Ability to change `/Content` folder (currently root/Content wherever the binary is)
- ❌ - Ability to change `/Schema` folder (Currently root wherever the binary is)
- ❌ - Ability to save create and save new instances to filedisk
- ❌ - Have great tooltips with not only explanations but also usage examples!
- ❌ - Electron Mac Build
- ❌ - Electron Linux Build

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install --legacy-peer-deps
```

### Development

Debug logs:

```bash
set ELECTRON_ENABLE_LOGGING=true # windows
```

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
