---
name: ant-research-platform
description: 当用户要求"为蚂蚁开放研究平台写代码"、"蚂蚁开放研究平台"、"ant_print_all"、"ant_read_data"、"ant_plot"，或提到 marvel.AntPrint、PSM、PanelOLS、Heckman、OrderedModel，或需要在蚂蚁集团安全研究环境中编写 Python 代码时，应使用此技能。
version: 2.0.0
---

# 蚂蚁开放研究平台 Skill

本技能帮助你在蚂蚁集团开放研究平台进行代码开发、调试和学习。

---

## 文档导航

### 按使用场景选择文档

| 需求 | 首选文档 | 补充阅读 |
|------|---------|---------|
| 开始写代码前（了解所有限制） | `01-rules/hard-constraints.md` | -> `01-rules/output-limits.md` -> `01-rules/environment.md` |
| 读取数据 / 字段处理 / 样本筛选 | `02-workflow/data-io.md` | -> `project-info.md`（项目表名和变量） |
| 描述性统计 / 数据分布 | `02-workflow/descriptive-stats.md` | |
| 回归模型（OLS / 面板 / IV / SUR） | `02-workflow/regression-models.md` | -> `examples/panel-regression.py` |
| 因果推断（PSM / DID / EconML） | `02-workflow/causal-inference.md` | -> `examples/psm-example.py` |
| 特殊模型（Heckman / OrderedModel / Tobit / Cox） | `02-workflow/specialized-models.md` | |
| 绑图 / 可视化 | `02-workflow/visualization.md` | -> `03-reference/ant_plot-api.md` -> `examples/plotting-examples.py` |
| 多模型结果汇总表格 | `03-reference/result_printer.md` | |
| 报错排查 | `04-patterns/error-troubleshooting.md` | -> `04-patterns/anti-patterns.md` |
| 可复用代码模板 | `04-patterns/code-templates.md` | |
| 确认包是否可用 | `03-reference/packages.md` | |
| 查模型属性/方法 API | `03-reference/model-api-catalog.md` | |

### 文档层级说明

```
01-rules/      --> 红线规则（必须最先加载，违反即运行失败）
02-workflow/   --> 工作流指南（按研究流程组织，含决策树和代码模板）
03-reference/  --> 详细参考（纯 API 参数手册，按需查阅）
04-patterns/   --> 模式库（错误排查、反模式、可复用模板）
```

---

## 必须遵守的核心规则

> 每次写代码前必须先读取 `01-rules/hard-constraints.md` 获取完整规则。以下是最高优先级的摘要：

**禁用替代**：
- `print()` 被禁用 -> 使用 `ant_print_all()`
- `matplotlib` / `seaborn` 直接绑图被禁用 -> 使用 `ant_plot` 系统
- Python 版本固定为 **3.8.6**（不支持 walrus operator、match-case 等新语法）

**输出限制**：
- 每代码块 <= 50KB，每文件 <= 500KB
- 描述性统计需 >= 100 行数据
- `value_counts` <= **100 行**
- `describe_by_discrete` / `describe_by_continuous` <= **20 行**

完整限制与安全使用指南：`01-rules/output-limits.md`
环境判断（仿真 vs 真实）：`01-rules/environment.md`

---

## ant_print_all 核心用法

这是平台最核心的输出函数，所有输出都必须通过它。

### 两种参数模式

```python
# 模式 A：model_attr -- 访问属性（不需要括号调用）
ant_print_all(result, model_attr=['params', 'pvalues'])
# 等价于直接访问 result.params 和 result.pvalues

# 模式 B：model_method -- 调用方法（需要括号调用）
ant_print_all(result, model_method='summary')
# 等价于调用 result.summary()

# 两种模式可同时使用
ant_print_all(result,
              model_attr=['params', 'pvalues', 'rsquared'],
              model_method='summary')
```

### 支持的输入对象类型

| 输入类型 | 示例 | 常用 mode |
|---------|------|-----------|
| DataFrame | `df` | `describe`, `value_counts`, `describe_by_discrete`, `corr` |
| Series | `df["col"]` | `value_counts` |
| 模型结果 | OLS / PanelOLS 结果 | `summary`(method), `params`(attr), `pvalues`(attr) |
| PSM 对象 | `model` | `quality`(attr), `calculate_att`(method) |
| 统计检验函数 | `ws.ztest`, `sci_s.ttest_ind` | 直接传参 |
| result_printer | `result_printer` | `summary_col`(method) |

完整规则与自检清单：`01-rules/hard-constraints.md`
描述性统计方法选择指南：`02-workflow/descriptive-stats.md`

---

## ant_plot 核心用法

平台专用的绑图系统，替代 matplotlib/seaborn 直接调用。

### 必须遵循的四步流程

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()                                            # 1. 初始化画布
ant_plot.add_subplot(nrows=1, ncols=1, index=1)              # 2. 添加子图区域
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="col1", y="col2")                             # 3. 绑图
ant_plot.show()                                              # 4. 显示
```

**关键约束**：
- `re_init()` 后必须调用 `add_subplot()`
- `show()` 后画布重置，绑制新图需重新执行全部四步
- 只能使用 `ant_plot` 系统，不能直接调用 matplotlib/seaborn

完整 API 参数手册：`03-reference/ant_plot-api.md`
图表类型与定制示例：`02-workflow/visualization.md`

---

## 环境判断

平台有仿真环境和真实环境两种模式。

```python
from marvel.AntPrint.sandbox.global_constant import envir, print_envir

current_env = envir()       # 返回 '仿真环境' 或 '真实环境'
print_envir()               # 打印当前环境状态（调试用）

if envir() == '仿真环境':
    # 跳过数据读取等操作
    pass
```

详细环境处理策略（含三种兼容写法模板）：`01-rules/environment.md`

---

## 标准导入模板

```python
# 基础包
import pandas as pd
import numpy as np
import statsmodels.api as sm
import linearmodels as lm

# 平台专用（必须导入）
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot

# 按需导入
from marvel.AntPrint.model import PSM, OrderedModel, Heckman    # 因果/特殊模型
from marvel.AntPrint import result_printer                      # 多模型聚合输出
from marvel.AntPrint.sandbox.global_constant import envir         # 环境判断
import scipy.stats as sci_s                                     # 假设检验
from lifelines import CoxPHFitter                               # 生存分析
```

完整可用包列表及版本：`03-reference/packages.md`

---

## 自我迭代闭环

每次使用本 skill 完成任务后，按以下流程检查并迭代文档质量。

### Step 1 -- 自检（每次任务完成后自动执行）

对照以下触发条件，检查本次任务中是否发现任何问题：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | 新错误 | 是否遇到 `error-troubleshooting.md` 中未记录的报错？ |
| 2 | 新反模式 | 是否写了 `anti-patterns.md` 中未记录的错误代码？ |
| 3 | 文档歧义 | 是否有按文档操作但结果不符合预期的情况？ |
| 4 | 信息缺失 | 是否有需要但在所有文件中都找不到的信息？ |
| 5 | 信息过时 | 是否发现平台 API 行为与文档描述不一致？ |
| 6 | 用户反馈 | 用户是否指出了文档的任何问题？ |

### Step 2 -- 向用户确认（有关键问题时必须执行）

如果 Step 1 中发现 **任意一项** 问题，**必须先向用户汇报，获得确认后再执行修改**。

汇报格式如下：

```
我在本次使用中发现了以下可能需要迭代的问题：

[1] {问题描述} -- 触发场景：{什么时候发现的}
    建议修改方案：{打算改哪个文件的什么内容}

[2] {问题描述}（如有更多）

是否需要我现在进行这些迭代？（可指定编号选择部分执行）
```

**注意**：
- 如果没有发现任何问题，可以跳过确认，不主动打扰用户
- 如果用户说"不需要"/"跳过"，则不执行修改，继续下一步
- 用户可能只选择部分问题进行迭代

### Step 3 -- 执行修改（仅在用户确认后执行）

收到用户确认后，按以下流程修改：

1. **定位归属** -- 判断问题属于哪一层：
   - `01-rules/`   --> 红线规则变更
   - `02-workflow/` --> 工作流指南补充
   - `03-reference/` --> API 文档更新
   - `04-patterns/`  --> 新增模式/模板
   - `SKILL.md`      --> 入口导航调整

2. **执行修改** -- 修改对应文件，确保不引入新的信息重复（每条信息只存在于一个文件）

3. **更新 CHANGELOG** -- 在 `CHANGELOG.md` 末尾追加本次迭代记录，版本号递增

4. **一致性检查** -- 确认：
   - `SKILL.md` 导航表中的文件路径是否正确
   - 跨文件引用链接是否有效
   - 是否有其他文件需要同步更新

### 版本号规则

| 变更类型 | 版本递增 | 示例 |
|---------|---------|------|
| 修复错别字 / 格式 / 补充小细节 | patch (第三位) | 2.0.0 -> 2.0.1 |
| 新增 workflow / pattern / 更新 API 文档 | minor (第二位) | 2.0.0 -> 2.1.0 |
| 重构框架结构 / 破坏性变更 | major (第一位) | 1.1.0 -> 2.0.0 |

### 当前版本: v2.0.0

查看完整迭代历史：`CHANGELOG.md`
