# Baba Code v1.0

`Baba Code` 是一个从当前 Claude Code 源码快照思路里拆出来的 Ink 终端原型，目标不是 1:1 复刻上游，而是先做一个可运行、可观察、可继续迭代的本地 CLI 骨架。

当前目录名已经是 `baba-code`，`package.json` 里的包名也是更适合发布的 `baba-code`。

## 命令名

推荐直接使用：

```bash
baba-code
```

## 当前定位

- 基于 `Ink + React` 的终端交互原型
- 保留 Claude Code 风格的会话、命令、tool、审批回路
- 支持本地 mock provider 和真实 Gemini provider
- 适合继续做 UI 试验、命令回路验证和 tool 调度验证

## 当前能力

- Ink 欢迎页、消息流和输入框
- `/help`、`/models`、`/tools`、`/history` 等基础命令
- `/provider [name]` 和 `/model [name]` 切换
- 简单权限确认流
- 本地可运行的 `bash` tool
- 本地可运行的 `read_file` tool
- Gemini API 的基础文本对话
- 基础流式输出
- 基础函数调用回路

## 目录说明

- `src/main.mjs`: CLI 入口
- `src/app/cli.mjs`: 启动分发，区分交互模式和预览模式
- `src/app/InkApp.mjs`: Ink 根组件、欢迎页、消息流、输入和审批
- `src/core/session.mjs`: provider/model/session 状态
- `src/core/registry.mjs`: 命令和 tool 注册表
- `src/core/runtime.mjs`: 统一调度运行时
- `src/providers/geminiProvider.mjs`: Gemini provider
- `src/providers/mockProvider.mjs`: 本地 mock provider
- `src/tools/`: 当前内置 `bash` 和 `read_file`

## 启动方式

```bash
npm install
npm start
```

克隆仓库后，先进入项目目录再执行上面的命令。

如果你已经通过 `npm link` 安装了全局命令，也可以直接：

```bash
baba-code
```


## Gemini 配置

最小配置：

```bash
export GEMINI_API_KEY=your_api_key
```

当前默认 provider 是 `gemini`。

如果没有设置 `GEMINI_API_KEY`，启动后会直接给出提示。这时可以：

- 配置 `GEMINI_API_KEY`
- 或执行 `/provider mock` 切回本地演示 provider

## 当前支持的命令

- `/help`
- `/models`
- `/tools`
- `/model [name]`
- `/provider [name]`
- `/history`
- `/run <shell command>`
- `/read <path>`
- `/exit`

## 终端兼容性

更推荐在这些终端里运行：

- VS Code Terminal
- iTerm2
- Ghostty
- Kitty

`Apple Terminal` 在 macOS 下的中文输入和 IME 兼容性原本更差，尤其是中英切换、预编辑文本和输入光标这条链路。当前项目已经加入了 `Apple Terminal` 专用降级，用来规避之前的渲染异常和直接退出问题。

目前的实际状态是：

- 基本交互和常规使用已经可以正常工作
- 为了优先保证稳定性，`Apple Terminal` 下会关闭一部分更激进的输入光标/渲染能力
- 如果你特别在意中文 IME 的内联预编辑显示效果，`VS Code Terminal`、`iTerm2`、`Ghostty` 和 `Kitty` 仍然会更稳一些

如果你的目标是日常使用，`Apple Terminal` 现在已经可用；如果你的目标是做更稳定的中文输入和界面对比测试，优先使用上面这些终端会更合适。

## 为什么单独建目录

当前仓库是 Claude Code 源码快照，不带完整构建配置。直接在快照上补到“可直接跑完整产品”成本很高，也容易误判。

这个目录采用的是更稳妥的路线：

1. 先重建最小可运行骨架
2. 先把会话循环、UI、命令和 tool 调度跑通
3. 再逐步补齐更接近 Claude Code 的能力

## 下一步可继续补的点

- 增加文件编辑而不是只读
- 增加更细的权限策略
- 增加更完整的 tool 调度和错误恢复
- 增加更接近 Claude Code 的状态栏和布局层次
- 继续打磨 `Baba Code` 欢迎页和品牌化界面

## License

MIT
