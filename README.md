# Baba Code v1.0
献给壮壮、老朱、易睿和大卫。

`Baba Code` 是一个献给粑粑群兄弟们的编程助手，申请免费的Gemini api即可开始使用(详见`aistudio.google.com`中的`get api key`部分)

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
克隆仓库后，先进入项目目录，然后执行以下命令：

```bash
npm install
npm start
```

如果你已经通过 `npm link` 安装了全局命令，也可以直接：

```bash
baba-code
```
当对话需要使用 Gemini 模型时，需先配置 GEMINI_API_KEY。
配置方式：
```bash
export GEMINI_API_KEY=your_api_key
```
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
- 如果你特别在意中文 IME 的内联预编辑显示效果，更推荐使用`VS Code Terminal`、`iTerm2`、`Ghostty` 和 `Kitty` 。

如果你的目标是日常使用，`Apple Terminal` 现在已经可用；如果你的目标是做更稳定的中文输入和界面对比测试，优先使用上面这些终端会更合适。


## 下一步可继续补的点

- 增加文件编辑而不是只读
- 增加更细的权限策略
- 增加更完整的 tool 调度和错误恢复
- 继续打磨 `Baba Code` 欢迎页和品牌化界面

## License

MIT
