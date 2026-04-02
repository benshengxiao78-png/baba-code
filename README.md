# Baba Code

献给壮壮、老朱、易睿、大卫、吴奕凡和其他朋友们。

`Baba Code` 是一个受 Claude Code 工作流启发、基于 `Ink + React` 的本地终端编程助手原型。

## 1. Baba Code 简介

- 支持 `gemini` 和 `mock` 两种 provider
- 支持基础流式输出
- 内置 `bash` 和 `read_file` 两个 tool
- 内置 `/help`、`/provider`、`/model`、`/tools`、`/history`、`/buddy` 等命令
- 适合做本地 CLI、UI 和 tool 调度实验

## 2. API 配置

默认 provider 是 `gemini`，使用前先配置 `GEMINI_API_KEY`，可在 `Google AI Studio` 的 `API keys` 页面获取。

macOS / Linux:

```bash
export GEMINI_API_KEY="your_api_key"
```

Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_api_key"
```

可选配置：

- `GEMINI_MODEL`: 默认模型，未设置时默认使用 `gemini-2.5-flash`
- `REPRO_PROVIDER`: 启动时默认 provider，可选 `gemini` 或 `mock`

如果只是本地体验界面和命令，可以启动后切到：

```text
/provider mock
```

## 3. 启动方式

### macOS

```bash
cd baba-code
npm install
npm start
```

如果你想全局使用命令：

```bash
npm link
baba-code
```

### Windows

```powershell
cd .\baba-code
npm install
npm start
```

如果你只想直接启动，也可以：

```powershell
node .\src\main.mjs
```

注意：

- Windows 下不建议直接依赖全局 `baba-code` 命令，因为当前 `bin/baba-code` 是 `zsh` 脚本
- `/run` 命令当前通过 `/bin/zsh` 执行 shell，纯 Windows 环境下可能不可用；更稳妥的方式是使用 Git Bash、WSL，或暂时避免使用 `/run`

## 4. 命令列表

- `/help`: 查看所有命令
- `/tools`: 查看当前注册的 tools
- `/history`: 查看当前会话历史
- `/provider [name]`: 查看或切换 provider
- `/models`: 查看当前 provider 可用模型，目前仅 `gemini` 支持
- `/model [name]`: 查看或切换当前模型
- `/buddy`: 查看 buddy 用法
- `/buddy list`: 列出可选 buddy
- `/buddy roster`: 查看当前用户和 buddy 分配
- `/buddy use <user>`: 切换当前用户
- `/buddy set <buddy-id>`: 给当前用户设置 buddy
- `/buddy assign <user> <buddy-id>`: 给指定用户分配 buddy
- `/run <shell command>`: 执行 shell 命令
- `/read <path>`: 读取文本文件
- `/exit`: 退出

## 5. TODO List

- 增加只读以外的文件编辑能力
- 增加更细的权限策略
- 增加更完整的 tool 调度和错误恢复
- 完善 Windows 兼容性，尤其是 `/run` 的执行环境
- 增加用户系统、持久化和管理员能力
