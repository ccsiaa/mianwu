# 反模式（常见错误写法）

> 收集平台开发中最常见的错误写法，每个都给出 ❌ 错误 vs ✅ 正确对比。

---

## 1. ❌ 使用 print() 输出

```python
# ❌ 错误：print 被禁用
print("处理完成")
print(df.head(10))
print(f"样本量: {len(df)}")
print(result.summary())

# ✅ 正确：使用 ant_print_all
from marvel.AntPrint import ant_print_all

ant_print_all(pd.DataFrame({"msg": ["处理完成"]}))
ant_print_all(df, model_method="describe")
ant_print_all(pd.DataFrame({"样本量": [len(df)]}))
ant_print_all(result, model_method='summary')
```

---

## 2. ❌ 直接调用 matplotlib/seaborn 绑图

```python
# ❌ 错误：直接绑图被阻止
import matplotlib.pyplot as plt
plt.figure()
plt.scatter(df['x'], df['y'])
plt.xlabel("X")
plt.ylabel("Y")
plt.show()

import seaborn as sns
sns.boxplot(data=df, x='cat', y='val')

# ✅ 正确：使用 ant_plot 系统
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="x", y="y")
ant_plot.plt_set(method="xlabel", xlabel="X")
ant_plot.plt_set(method="ylabel", ylabel="Y")
ant_plot.show()

# 箱线图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="box",
              x="cat", y="val")
ant_plot.show()
```

---

## 3. ❌ groupby + value_counts 链式操作

```python
# ❌ 错误：不支持链式输出
ant_print_all(df.groupby("性别")["是否理赔"].value_counts())
ant_print_all(df.groupby(["城市级别", "月份"])["年化保费"].mean())

# ✅ 正确：使用 describe_by_discrete
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["性别"],
              cal_columns=["是否理赔"],
              fun_list=["sum"])

ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["城市级别"],   # 注意：拆分！不要同时用月份
              cal_columns=["年化保费"],
              fun_list=["mean"])
```

---

## 4. ❌ describe_by_discrete 多分组多计算列（超限）

```python
# ❌ 错误：6个城市 × 12个月 × 2列 × 1函数 = 144 行 >> 20 行限制
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否报案", "是否理赔"],
              fun_list=["sum"])

# ✅ 正确：拆分成多次调用，每次确保 ≤ 20 行
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否报案"],
              fun_list=["sum"])

ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否理赔"],
              fun_list=["sum"])
```

---

## 5. ❌ 仿真环境不判断直接读表

```python
# ❌ 错误：仿真环境会报错 "No file exist"
df = ant_read_data('table_name')
result = sm.OLS(y, X).fit()    # 如果 df 为空会连锁报错

# ✅ 正确：添加环境判断
from marvel.AntPrint.sandbox.global_constant import envir

if envir() == '仿真环境':
    ant_print_all(pd.DataFrame({"提示": ["仿真环境，跳过"]}))
else:
    df = ant_read_data('table_name')
    # ... 后续分析代码 ...
```

---

## 6. ❌ 混淆 model_attr 和 model_method

```python
# ❌ 错误：属性用了 method（会尝试调用 result.params() → 报错）
ant_print_all(result, model_method=['params', 'pvalues'])

# ❌ 错误：方法用了 attr（只会输出方法对象地址，不会执行）
ant_print_all(result, model_attr='summary')

# ✅ 正确：
ant_print_all(result, model_attr=['params', 'pvalues'])     # 属性 = 不带括号
ant_print_all(result, model_method='summary')                # 方法 = 带括号
ant_print_all(result,
              model_attr=['params', 'pvalues'],
              model_method='summary')                          # 可同时使用
```

**记忆口诀**：
- `model_attr` → **属性** → 像访问变量 → `result.params`
- `model_method` → **方法** → 像调用函数 → `result.summary()`

---

## 7. ❌ Probit/Logit 直接输出边际效应

```python
# ❌ 错误：DiscreteMargins 对象格式化困难
model = sm.Probit(y, X).fit()
margeff = model.get_margeff(at="mean")
ant_print_all(margeff, model_attr=['margeff', 'se'])  # numpy数组，无列名

# ✅ 正确：用 summary_col 输出原始系数表格
from marvel.AntPrint import result_printer

model1 = sm.Probit(y, X1).fit(disp=0)
model2 = sm.Probit(y, X2).fit(disp=0)

ant_print_all(result_printer,
              model_method="summary_col",
              results=[model1, model2],
              model_names=["(1)", "(2)"],
              stars=True,
              info_list=["nobs", "prsquared"])

# 如确实需要边际效应，单独输出 summary
margeff = model.get_margeff(at="mean")
ant_print_all(margeff, model_method="summary")  # 用 method 而非 attr
```

---

## 8. ❌ ant_plot 流程不完整

```python
# ❌ 错误1：缺少 add_subplot
ant_plot.re_init()
ant_plot.plot(...)     # 报错或无输出

# ❌ 错误2：show 后继续绑图而不重新 init
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(...)      # 图1
ant_plot.show()
ant_plot.plot(...)      # 图2 — 无输出！画布已重置但未重新初始化

# ✅ 正确：每次绑图都完整执行4步
# 图1
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=data, kind="scatter", x="x1", y="y1")
ant_plot.show()

# 图2（完全重新开始）
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=data, kind="line", x="x2", y="y2")
ant_plot.show()
```

---

## 9. ❌ PSM test/control 分反

```python
# ❌ 错误概念：test=实验组, control=对照组
# 实际约定是按数据量分的！

# ✅ 正确理解：
# test = 数据量较小的组（不管是不是"实验组"）
# control = 数据量较大的组
# 匹配时从 control 中挑选样本去匹配 test

# 示例：如果实验组只有 1000 人，对照组有 8000 人
test = df[df['treatment'] == 1]    # 1000行 → 作为 test
control = df[df['treatment'] == 0]  # 8000行 → 作为 control
```

---

## 10. ❌ 导入未安装的包

```python
# ❌ 错误：这些包在平台上不可用
import matplotlib.pyplot as plt
import plotly.express as px
from tqdm import tqdm
from openpyxl import Workbook

# ✅ 正确：只导入可用包
import pandas as pd
import numpy as np
import statsmodels.api as sm
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot
```
📖 完整包列表 → `03-reference/packages.md`

---

## 11. ❌ Python 3.9+ 语法在 3.8.6 上运行

```python
# ❌ 错误：3.9+ 语法在 3.8.6 会报 SyntaxError
match value:                    # 3.10+
    case 1:
        ...

if (n := len(df)) > 100:       # 3.8+ 海象运算符（部分3.8支持但不稳定）
    pass

# ✅ 正确：使用 3.8.6 兼容语法
if len(df) > 100:
    pass

if value == 1:
    ...
elif value == 2:
    ...
```
