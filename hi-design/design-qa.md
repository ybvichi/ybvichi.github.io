# Hi Design 设计验收

## 对照依据

- 官网参考：`.design-evidence/source/desktop-top.png`
- 首页实现：`.design-evidence/implementation/desktop-top-final.png`
- 同屏对照：`.design-evidence/desktop-top-comparison.png`
- 桌面视口：1440 × 900，像素密度 1
- 移动视口：390 × 844，像素密度 1

## 验收范围

- 首页：官网首屏至“为什么选择 Hi Design？”部分
- 操作指南：桌面端和移动端页面、原始章节、平台切换和视频引用
- 版本介绍：桌面端和移动端页面、版本锚点导航
- 全局：Hi Design 标识、主导航、下载入口、横向边界

## 检查结果

- 首页与官网的字体层级、背景构图、绿色强调、标题框、圆角按钮和产品截图保持一致。
- 按用户要求移除了产品、解决方案、插件、语言切换、顶部下载、GitHub Star 和“浏览设计系统”入口。
- “操作指南”和“版本介绍”均为独立页面，共用首页的标识、字体、色彩、玻璃态导航和移动菜单交互。
- 操作指南已恢复 open-design-bak-2 原稿中的 6 个章节、全部原文字、图片和 6 组视频标签。
- 1440px、1024px、768px、390px 视口的 document scroll width 均等于 viewport width，没有横向溢出或右侧白区。
- 首页标签切换、移动菜单、指南 Windows/macOS 切换、页面跳转和下载链接均可操作。
- 当前 open-design-bak-2 中没有原稿引用的 resources/video 实体目录，6 个视频和 6 张封面仍会触发本地文件缺失错误。

## 视觉差异说明

- 顶部导航和主按钮数量是用户明确要求的内容差异。
- Open Design 名称与标识替换为本地 Hi Design 品牌资产。
- 子页面沿用官网首页视觉语言，但信息结构按“指南”和“版本”任务重新组织。

final result: pending source video files
