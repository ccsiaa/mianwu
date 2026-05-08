# 迭代日志 (CHANGELOG)

> 本文件记录 skill 的每次迭代内容、原因和影响范围。
> **规则：每次修改任何文档后，必须同步更新本文件。**

---

## 迭代格式规范

每条记录遵循以下格式：

```markdown
### [YYYY-MM-DD] v{version} - {简短标题}

**触发原因**: {为什么做这次改动}
**修改范围**: {改了哪些文件}
**变更内容**:
- {具体改了什么}
**影响评估**:
- 对 AI 行为的影响: {描述}
- 风险: {是否有破坏性变更}
```

---

## 迭代历史

### [2026-04-30] v2.0.0 - 重构为四层递进框架

**触发原因**: 旧框架存在信息重复（SKILL.md 与 platform-reference.md 重叠约40%）、职责边界模糊、缺少决策指引和错误模式库等问题。

**修改范围**: 全部文件
  - 新建: `01-rules/` (3 files), `02-workflow/` (6 files), `03-reference/` (4 files), `04-patterns/` (3 files)
  - 重写: `SKILL.md`, `project-info.md`
  - 删除: `references/` 目录下4个旧文件 (platform-reference.md, models-reference.md, packages-list.md, plotting-reference.md)
  - 保留: `examples/` 目录不变

**变更内容**:
- 从扁平结构改为四层递进架构（rules -> workflow -> reference -> patterns）
- SKILL.md 从226行入口+FAQ精简为纯导航+核心概念入口
- 新增 `04-patterns/` 层：error-troubleshooting.md（按报错索引）、anti-patterns.md（11个常见错误对比）、code-templates.md（4个可复用模板）
- 每个 workflow 文件内置决策树（"我想要... -> 用什么方法"）
- project-info.md 按区域标记（A=研究背景, B=数据字典, C=处理代码, D=通用模板）
- 所有信息去重，每条信息只存在于一个文件中
- 移除所有 emoji

**影响评估**:
- 对 AI 行为的影响: 导航更精准，AI 可按场景直击目标文件而非阅读大量冗余信息；新增的错误模式库减少试错成本
- 风险: 破坏性变更 -- 文件路径全部变化，旧引用需更新；但内容100%来自旧文件的无损重组，无信息丢失
