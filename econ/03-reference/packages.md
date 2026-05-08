# 可用 Python 包列表

> Python 版本：**3.8.6**
> 未列在此处的包在平台中**不可用**，导入前请先确认。

---

## 统计与计量经济学

| 包名 | 版本 | 说明 | 文档链接 |
|------|------|------|---------|
| `CausalInference` | 0.1.3 | 因果推断库 | [文档](https://causalinferenceinpython.org/#main-features) |
| `econml` | 0.12.0 | 因果推断机器学习（DML, CausalForest） | [文档](https://econml.azurewebsites.net/) |
| `lifelines` | 0.25.11 | 生存分析（CoxPH 等） | [文档](https://lifelines.readthedocs.io/en/latest/) |
| `linearmodels` | 4.25 | 面板数据模型、IV、SUR、随机效应等 | [文档](https://bashtage.github.io/linearmodels/doc/index.html) |
| `statsmodels` | 0.13.2 | 统计模型与检验（OLS, Logit, Probit, ARIMA） | [文档](https://www.statsmodels.org/stable/user-guide.html) |
| `py4etrics` | 0.1.7 | 截断/删失模型（Tobit, Heckit） | [文档](https://py4etrics-github-io.translate.goog/) |

## 数据处理

| 包名 | 版本 | 说明 | 文档链接 |
|------|------|------|---------|
| `numpy` | 1.23.4 | 数值计算 | [文档](https://numpy.org/doc/stable/user/quickstart.html) |
| `pandas` | 1.4.1 | 数据操作（DataFrame） | [文档](https://pandas.pydata.org/) |
| `scipy` | 1.5.4 | 科学计算（统计检验、优化等） | [文档](https://docs.scipy.org/doc/scipy/reference/) |
| `patsy` | 0.5.1 | 模型公式符号（如 R-style formula） | [文档](https://patsy.readthedocs.io/en/latest/) |

## 机器学习

| 包名 | 版本 | 说明 | 文档链接 |
|------|------|------|---------|
| `sklearn` (scikit-learn) | 0.24.2 | 机器学习库（回归、分类、聚类、PCA、树模型） | [文档](https://scikit-learn.org/stable/) |

## 可视化

| 包名 | 版本 | 说明 | 文档链接 |
|------|------|------|---------|
| `seaborn` | 0.11.1 | 统计可视化（仅用于数据准备，绑图需用 ant_plot） | [文档](https://seaborn.pydata.org/index.html) |

## 图分析

| 包名 | 版本 | 说明 | 文档链接 |
|------|------|------|---------|
| `igraph` | 0.11.3 | 图/网络分析 | [文档](https://python.igraph.org/en/stable/) |

## 标准库（Python 内置）

| 包名 | 说明 | 文档链接 |
|------|------|---------|
| `math` | 数学函数 | [文档](https://docs.python.org/3/library/math.html) |
| `json` | JSON 处理 | - |
| `datetime` | 日期时间 | - |
| `collections` | 容器数据类型 | - |
| `itertools` | 迭代工具 | - |
| `functools` | 函数工具 | - |

## 平台专用模块

| 模块路径 | 说明 |
|---------|------|
| `marvel.AntPrint` | 主输出模块（ant_print_all, ant_read_data, ant_plot, result_printer） |
| `marvel.AntPrint.model` | 自定义模型（PSM, OrderedModel, Heckman） |
| `marvel.AntPrint.function` | 自定义函数 |
| `marvel.AntPrint.sandbox` | 工具函数和环境检查（envir, print_envir） |

---

## 标准导入模板

```python
# ===== 常用包 =====
import math
import pandas as pd
import numpy as np
import statsmodels.api as sm
import scipy
import linearmodels as lm
import seaborn as sns
import lifelines
import sklearn
import econml

# ===== 平台专用（必须）=====
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot
from marvel.AntPrint.model import PSM, OrderedModel, Heckman
from marvel.AntPrint import result_printer
from marvel.AntPrint.sandbox.global_constant import envir, print_envir
```

---

## 注意事项

- ⚠️ 未列在此处的**第三方包不可用**（无法 pip install）
- ⚠️ Python **3.8.6** 固定版本，不支持 3.9+ 语法特性
- ⚠️ `seaborn` 仅可用于数据准备和颜色映射，**不能直接调用其绑图函数**
- ⚠️ 部分包可能因安全限制而功能受限
