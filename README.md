# 老式门牌号字体图鉴

全栈 MVP 项目，包含后端 API 服务和前端 Svelte 应用。

## 本地检查命令

开发者在提交代码前，请在项目根目录依次执行以下命令进行本地检查，与自动化流水线保持一致：

```bash
# 1. 安装根目录依赖
npm install

# 2. 安装后端依赖
npm --prefix backend install

# 3. 安装前端依赖
npm --prefix frontend install

# 4. 后端 TypeScript 编译
npm --prefix backend run build

# 5. 前端类型检查
npm --prefix frontend run check

# 6. 前端构建打包
npm --prefix frontend run build
```

也可以使用根目录已封装的脚本：

```bash
# 一次性安装所有依赖
npm run install:all

# 一次性构建前后端
npm run build
```

任一步骤失败都需要修复后重新执行，确保所有检查通过后再提交代码。
