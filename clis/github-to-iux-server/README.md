# @iux/gtis

> GitHub → IUX Server metadata analysis CLI.

`@iux/gtis` 是一个零依赖的 Node.js CLI。运行它后会读取指定 GitHub 仓库的
Releases 页面（默认 `ybvichi/open-design`，即 Hi Design），定位最新 release
上的 `metadata.json` 资产，下载并**分析**其中的版本、渠道、平台产物、校验和与
下载统计信息。

## 快速开始

```bash
npx @iux/gtis
```

输出示例：

```
Hi Design 0.16.3  ·  stable  ·  v0.16.3
published 2026-08-15T09:58:12Z (0 days ago)

Latest tag         v0.16.3
Metadata version   0.16.3   ✓ matches tag
Channel            stable
Repository         ybvichi/open-design
Release URL        https://github.com/ybvichi/open-design/releases/tag/v0.16.3
Author             github-actions[bot]
Total downloads    14

Platforms
  win · x64
    installer  Hi.Design-0.16.3-win-x64-setup.exe   302.0 MB  13 dl
      sha256 a4c5347df4f5d427f7d5cac2ab4d4f42b561681bed628c6fa9d8e6b4d867c51f
    portable   Hi.Design-0.16.3-win-x64-portable.zip 346.8 MB   1 dl
      sha256 c59894589790e964558c72a81d120b4b9f6d8315af7ee26cfec88383bb70b847
```

## 用法

```
npx @iux/gtis [options] [repo-or-url]
```

### 选项

| 选项 | 说明 |
| --- | --- |
| `--repo <owner/repo>` | 指定仓库（默认 `ybvichi/open-design`） |
| `--tag <tag>` | 分析指定 release tag（如 `v0.16.2`），默认最新 |
| `--api <base-url>` | 指定 GitHub API 地址（默认 `https://api.github.com`） |
| `--json` | 输出完整分析结果 JSON（机器可读） |
| `--raw` | 直接输出原始 `metadata.json` |
| `--out <file>` | 同时把 `metadata.json` 写入本地文件 |
| `--check <version>` | 版本比对（见下） |
| `--no-color` | 关闭 ANSI 颜色 |
| `-h, --help` | 帮助 |
| `-v, --version` | 版本号 |

### 位置参数

可以直接传 `owner/repo`，也可以传完整的 GitHub Releases URL 作为 `--repo` 的快捷方式：

```bash
npx @iux/gtis ybvichi/open-design
npx @iux/gtis https://github.com/ybvichi/open-design/releases
npx @iux/gtis https://github.com/ybvichi/open-design/releases/tag/v0.16.2
```

### 版本比对（适合脚本/CI）

```bash
npx @iux/gtis --check 0.16.2      # 退出码 2（本地版本过旧）
npx @iux/gtis --check 0.16.3      # 退出码 0（已是最新）
```

退出码约定：`0` 成功（`--check` 时为最新）、`1` 出错、`2` 过旧（仅 `--check`）、`3` 用法错误。

### 机器可读输出

```bash
npx @iux/gtis --json
npx @iux/gtis --json --check 0.16.2 > report.json   # 退出码 2
```

### 同步 metadata.json 到本地

```bash
npx @iux/gtis --raw --out ./hi-design/stable/latest/metadata.json
```

## 分析内容

- **一致性校验**：release tag 与 `metadata.stableVersion` 是否一致；
- **平台产物**：每个平台的 `enabled` / `arch` 以及 installer / portable 等产物的
  URL、`sha256`、文件大小与 GitHub 下载次数（大小与下载数来自 GitHub API 的资产信息，
  与 metadata.json 中的 URL 做关联）；
- **版本与时效**：渠道（channel）、发布时间、距今天数；
- **汇总**：总下载量、作者、release 链接。

## 开发

```bash
# 本地运行
node bin/gtis.js

# 单元测试（离线，不访问网络）
npm test
```

## 发布

```bash
npm login
npm publish --access public
```

包名 `@iux/gtis`，发布后即可通过 `npx @iux/gtis` 使用。

## 环境变量

- `GITHUB_TOKEN` / `GH_TOKEN`：GitHub 令牌，可提高 API 速率限制（未认证约 60 次/小时）。
- `NO_COLOR`：禁用颜色输出。
