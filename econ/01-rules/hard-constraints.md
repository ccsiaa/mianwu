# 硬性约束（Hard Constraints）

> 🔴 **这是平台绝对规则，违反任何一条都会导致代码运行失败或试运行不通过。**
> 每次写代码前必须首先阅读本文档。

---

## 1. 禁用函数

| 被禁用的函数/用法 | 严重程度 | 替代方案 |
|-------------------|---------|----------|
| `print()` | ❌ 运行失败 | `ant_print_all()` |
| `matplotlib.pyplot` 任何调用 | ❌ 运行失败 | `ant_plot` 系统 |
| `seaborn` 直接绑图（如 `sns.plot()`） | ❌ 运行失败 | `ant_plot.plot(...)` |
| `pandas` 的直接 HTML/文本输出 | ⚠️ 可能被截断 | `ant_print_all(df, model_method=...)` |

**正确做法示例**：
```python
# ❌ 错误
print("Hello")
print(df.head())
plt.scatter(x, y)

# ✅ 正确
from marvel.AntPrint import ant_print_all, ant_plot

ant_print_all(pd.DataFrame({"msg": ["Hello"]}))
ant_print_all(df, model_method="describe")

ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter", x="x", y="y")
ant_plot.show()
```

---

## 2. Python 环境限制

| 项目 | 值 | 注意事项 |
|------|-----|---------|
| **Python 版本** | 3.8.6 | 不支持 3.8+ 新语法（海象运算符 `:=`、match-case 等） |
| **每代码块输出上限** | 50 KB | 超出部分会被截断 |
| **每文件输出上限** | 500 KB | 超出部分会被截断 |
| **描述性统计最小行数** | ≥ 100 行 | 数据不足时统计结果可能异常 |

---

## 3. 必要导入（每个代码块都必须包含）

```python
# ===== 基础包 =====
import pandas as pd
import numpy as np
import statsmodels.api as sm
import linearmodels as lm

# ===== 平台专用（必须导入）=====
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot
```

按需额外导入：
```python
# 因果推断模型
from marvel.AntPrint.model import PSM, OrderedModel, Heckman

# 多模型聚合输出
from marvel.AntPrint import result_printer

# 环境判断
from marvel.AntPrint.sandbox.global_constant import envir, print_envir

# 其他常用
import scipy.stats as sci_s
from lifelines import CoxPHFitter
```

> 📖 完整可用包列表 → `03-reference/packages.md`

---

## 4. ant_print_all 核心规则

### 4.1 两种参数模式（必须区分）

```python
# 模式 A：model_attr — 访问属性（不需要括号）
ant_print_all(result, model_attr=['params', 'pvalues'])
# 等价于：result.params  和  result.pvalues

# 模式 B：model_method — 调用方法（需要括号）
ant_print_all(result, model_method='summary')
# 等价于：result.summary()

# 可同时使用两种模式
ant_print_all(result,
              model_attr=['params', 'pvalues', 'rsquared'],
              model_method='summary')
```

### 4.2 支持的输入对象类型

| 输入对象类型 | 示例 | 常用 mode |
|-------------|------|-----------|
| DataFrame | `df` | `describe`, `value_counts`, `describe_by_discrete`, `corr` |
| Series | `df["col"]` | `value_counts` |
| 模型结果对象 | OLS/PanelOLS 结果 | `summary`, `params`(attr), `pvalues`(attr) |
| PSM 对象 | `model` | `quality`(attr), `calculate_att`(method) |
| 统计检验函数 | `ws.ztest`, `sci_s.ttest_ind` | 直接传参 |
| result_printer | `result_printer` | `summary_col`(method) |

### 4.3 输出前自检清单

在每次调用 `ant_print_all` 前，快速确认：

- [ ] 没有使用 `print()`
- [ ] 如果是 `value_counts`，结果 ≤ 100 行？
- [ ] 如果是 `describe_by_discrete`，分组后 ≤ 20 行？
- [ ] 如果是 `describe_by_continuous`，分箱后 ≤ 20 行？
- [ ] `model_attr` 传的是属性名（无括号），`model_method` 传的是方法名？

> 📖 详细行数限制 → `01-rules/output-limits.md`

---

## 5. ant_plot 核心规则

### 5.1 必须遵循的四步流程

```python
# Step 1: 初始化画布（每次绑图前必须调用）
ant_plot.re_init()

# Step 2: 添加子图区域（re_init 后必须调用）
ant_plot.add_subplot(nrows=1, ncols=1, index=1)

# Step 3: 绑图
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="col1", y="col2")

# Step 4: 显示（show 后画布重置，新图需重新 init）
ant_plot.show()
```

### 5.2 关键约束

| 约束 | 说明 |
|------|------|
| `re_init()` 后必须 `add_subplot()` | 否则报错 |
| `show()` 后画布重置 | 绑制新图需重新初始化整个流程 |
| 只能使用 `ant_plot` 系统 | 直接调用 matplotlib/seaborn 绑图函数会被阻止 |
| 树可视化最大深度 | `max_depth=5`（安全限制） |

> 📖 ant_plot 完整 API → `03-reference/ant_plot-api.md`
> 📎 绑图示例 → `examples/plotting-examples.py`
