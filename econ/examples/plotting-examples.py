# 绑图示例

## 基本散点图

```python
from marvel.AntPrint import ant_read_data, ant_plot

# 读取数据
df = ant_read_data('my_data')

# 初始化并绑图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter", x="var1", y="var2")
ant_plot.show()
```

## 带分组的散点图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

# 使用hue参数分组
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="x", y="y", hue="category", alpha=0.7, palette="deep")

ant_plot.axes_set(method="set_title", axindex=0, label="按类别分组散点图")
ant_plot.show()
```

## 折线图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="line",
              x="year", y="sales", hue="region", style="region")

ant_plot.axes_set(method="set_title", axindex=0, label="销售额随时间变化")
ant_plot.plt_set(method="xlabel", xlabel="年份")
ant_plot.plt_set(method="ylabel", ylabel="销售额")
ant_plot.show()
```

## 直方图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="hist",
              x="income", bins=30, hue="group", kde=True)

ant_plot.show()
```

## 箱线图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="box",
              x="category", y="value", hue="treatment")

ant_plot.show()
```

## 核密度图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="kde",
              x="score", hue="group")

ant_plot.show()
```

## 热力图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

# 准备透视表
pivot_df = df.pivot_table(index='row_var', columns='col_var', values='value')

ant_plot.plot(df=pivot_df, method="ant_plot_df", kind="heatmap")

ant_plot.show()
```

## 柱状图

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="bar",
              x="category", y="mean_value", hue="group")

ant_plot.show()
```

## 多子图

```python
from marvel.AntPrint import ant_plot

# 初始化
ant_plot.re_init()

# 创建2x2布局
ant_plot.add_subplot(2, 2, 1)  # 左上
ant_plot.add_subplot(2, 2, 2)  # 右上
ant_plot.add_subplot(2, 2, 3)  # 左下
ant_plot.add_subplot(2, 2, 4)  # 右下

# 图1：散点图
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="x1", y="y1", axindex=0)

# 图2：折线图
ant_plot.plot(df=df, method="ant_plot_df", kind="line",
              x="x2", y="y2", axindex=1)

# 图3：直方图
ant_plot.plot(df=df, method="ant_plot_df", kind="hist",
              x="var3", axindex=2)

# 图4：箱线图
ant_plot.plot(df=df, method="ant_plot_df", kind="box",
              x="cat", y="val", axindex=3)

ant_plot.show()
```

## 分组统计图

```python
import seaborn as sns
from marvel.AntPrint import ant_plot

# 加载示例数据
flights = sns.load_dataset("flights")

ant_plot.re_init()
ant_plot.add_subplot()

# 按离散变量（年份）分组并求和乘客数
ant_plot.plot(df=flights, method="ant_plot_df_groupby_discrete", kind="line",
              group_by_columns=["year"], cal_columns=["passengers"], fun_list=["sum"])

ant_plot.axes_set(method="set_title", axindex=0, label="年度乘客总数")
ant_plot.show()
```

## 连续变量分箱

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

# 将连续变量按分位数分组
ant_plot.plot(df=df, method="ant_plot_df_groupby_continuous", kind="line",
              group_by_columns=["age"], cal_columns=["income"],
              q=4, cut_strategy="quantile", fun_list=["mean"])

ant_plot.show()
```

## 带主题定制的图表

```python
from marvel.AntPrint import ant_plot

# 先设置主题
ant_plot.set_theme(style="whitegrid", palette="deep", font_scale=1.2)

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="x", y="y", hue="category", alpha=0.8)

# 定制坐标轴
ant_plot.axes_set(method="set_title", axindex=0, label="我的图表标题")
ant_plot.axes_set(method="set_xlabel", axindex=0, xlabel="X变量")
ant_plot.axes_set(method="set_ylabel", axindex=0, ylabel="Y变量")

# 添加垂直线
ant_plot.axes_set(method="vlines", axindex=0, x=0, ymin=-2, ymax=2)

# 设置图形大小
ant_plot.figure_set(method="set_size_inches", w=10, h=6)

ant_plot.show()
```

## 添加参考线

```python
from marvel.AntPrint import ant_plot

ant_plot.re_init()
ant_plot.add_subplot()

ant_plot.plot(df=df, method="ant_plot_df", kind="scatter", x="x", y="y")

# 在x=0处添加垂直线
ant_plot.plt_set(method="axvline", x=0)

# 添加水平参考线
ant_plot.axes_set(method="hlines", axindex=0, y=0, xmin=-5, xmax=5)

ant_plot.show()
```

## 完整分析绑图示例

```python
import pandas as pd
import numpy as np
from marvel.AntPrint import ant_read_data, ant_print_all, ant_plot

# 1. 读取数据
df = ant_read_data('analysis_data')

# 2. 描述性统计
ant_print_all(df, model_method="describe")

# 3. 设置多图布局
ant_plot.set_theme(style="white", palette="deep")

# 分布图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="hist",
              x="outcome", bins=50, kde=True)
ant_plot.axes_set(method="set_title", axindex=0, label="结果变量分布")
ant_plot.show()

# 关系图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="treatment", y="outcome", hue="group", alpha=0.6)
ant_plot.axes_set(method="set_title", axindex=0, label="处理与结果的关系")
ant_plot.show()

# 时间序列
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df_groupby_discrete", kind="line",
              group_by_columns=["year"], cal_columns=["outcome"], fun_list=["mean"])
ant_plot.axes_set(method="set_title", axindex=0, label="结果变量趋势")
ant_plot.show()
```

## 注意事项

1. **开始新图形前必须调用 `re_init()`**
2. **`re_init()` 后必须调用 `add_subplot()`**
3. **`show()` 后画布重置**
4. **多子图时使用 `axindex` 参数**
5. **绑图前设置主题以保持风格一致**
