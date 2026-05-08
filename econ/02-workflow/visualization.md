# 绑图系统（ant_plot）

> 平台专用的绑图系统，替代 matplotlib/seaborn 直接调用。

---

## 核心四步流程（每次绑图都必须遵循）

```python
from marvel.AntPrint import ant_plot

# Step 1: 初始化画布
ant_plot.re_init()

# Step 2: 添加子图区域
ant_plot.add_subplot(nrows=1, ncols=1, index=1)

# Step 3: 绑图
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="col1", y="col2")

# Step 4: 显示
ant_plot.show()
```

⚠️ **关键约束**：
- `re_init()` 后**必须**调用 `add_subplot()`
- `show()` 后画布**重置**，新图需重新执行全部 4 步
- 只能使用 `ant_plot` 系统，直接调用 matplotlib/seaborn 会被阻止

---

## 图表类型选择

| 你想绑 | kind 参数 | 需要的参数 |
|-------|----------|-----------|
| 散点图 | `"scatter"` | x, y |
| 折线图 | `"line"` | x, y |
| 直方图 | `"hist"` | x, bins |
| 箱线图 | `"box"` | x(类别), y(数值) |
| 核密度图 | `"kde"` | x |
| 经验累积分布 | `"ecdf"` | x |
| 热力图 | `"heatmap"` | 需要透视表 |
| 柱状图 | `"bar"` | x(类别), y(数值) |

---

## 基础图表示例

### 散点图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="x_var", y="y_var",
              hue="category",        # 颜色分组
              alpha=0.7,             # 透明度
              palette="deep")        # 调色板
```

### 折线图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="line",
              x="year", y="sales",
              hue="region",
              style="region")        # 线型分组
```

### 直方图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="hist",
              x="income",
              bins=30,               # 分箱数
              hue="group",
              kde=True)             # 叠加核密度曲线
```

### 箱线图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="box",
              x="category",          # X轴为类别变量
              y="value",             # Y轴为数值变量
              hue="treatment")
```

### 核密度图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="kde",
              x="score",
              hue="group")
```

### 热力图

```python
# 先准备透视表
pivot = df.pivot_table(index='row', columns='col', values='val')

ant_plot.plot(df=pivot, method="ant_plot_df", kind="heatmap")
```

### 柱状图

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="bar",
              x="category", y="mean_val", hue="group")
```

---

## 分组统计图

### 按离散变量分组

```python
ant_plot.plot(df=data,
              method="ant_plot_df_groupby_discrete",
              kind="line",
              group_by_columns=["year"],       # 分组列（离散）
              cal_columns=["sales"],           # 计算列
              fun_list=["sum"])                # 聚合函数
```

### 按连续变量分箱

```python
ant_plot.plot(df=data,
              method="ant_plot_df_groupby_continuous",
              kind="line",
              group_by_columns=["age"],         # 分组列（连续）
              cal_columns=["income"],
              q=[0.25, 0.5, 0.75, 1],          # 分割点 → 4个箱
              cut_strategy="quantile",          # 等频分箱
              fun_list=["mean"])
```

---

## 多子图布局

```python
ant_plot.re_init()

# 创建 2×2 布局
ant_plot.add_subplot(2, 2, 1)   # 左上 (index=0)
ant_plot.add_subplot(2, 2, 2)   # 右上 (index=1)
ant_plot.add_subplot(2, 2, 3)   # 左下 (index=2)
ant_plot.add_subplot(2, 2, 4)   # 右下 (index=3)

# 图1：散点图
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="x1", y="y1", axindex=0)

# 图2：折线图
ant_plot.plot(df=data, method="ant_plot_df", kind="line",
              x="x2", y="y2", axindex=1)

# 图3：直方图
ant_plot.plot(df=data, method="ant_plot_df", kind="hist",
              x="var3", axindex=2)

# 图4：箱线图
ant_plot.plot(df=data, method="ant_plot_df", kind="box",
              x="cat", y="val", axindex=3)

ant_plot.show()
```

---

## 图表定制

### 设置主题（在 re_init 之前调用）

```python
ant_plot.set_theme(
    style="whitegrid",          # "white"/"dark"/"whitegrid"/"darkgrid"/"ticks"
    palette="deep",             # "deep"/"dark"/"pastel"/"bright"/"muted"
    font_scale=1.2,             # 字体大小缩放
    font='SimHei'               # 中文字体
)
```

### 定制坐标轴

```python
# 子图级别（axes_set）
ant_plot.axes_set(method="set_title",     axindex=0, label="图表标题")
ant_plot.axes_set(method="set_xlabel",    axindex=0, xlabel="X轴标签")
ant_plot.axes_set(method="set_ylabel",    axindex=0, ylabel="Y轴标签")
ant_plot.axes_set(method="vlines",        axindex=0, x=0, ymin=-2, ymax=2)
ant_plot.axes_set(method="hlines",        axindex=0, y=0, xmin=-5, xmax=5)
ant_plot.axes_set(method="set_xlim",      axindex=0, xmin=0, xmax=100)
ant_plot.axes_set(method="set_ylim",      axindex=0, ymin=0, ymax=50)
ant_plot.axes_set(method="legend",        axindex=0, loc="upper right")

# 全图级别（plt_set）
ant_plot.plt_set(method="xlabel", xlabel="全局X标签")
ant_plot.plt_set(method="ylabel", ylabel="全局Y标签")
ant_plot.plt_set(method="axvline", x=0.5)            # 垂直参考线
ant_plot.plt_set(method="suptitle", t="总标题")        # 总标题

# 图形级别（figure_set）
ant_plot.figure_set(method="set_size_inches", w=10, h=6)
ant_plot.figure_set(method="set_dpi", dpi=150)
```

---

## 完整工作流示例

```python
from marvel.AntPrint import ant_read_data, ant_print_all, ant_plot

# 1. 读取数据
df = ant_read_data('analysis_data')
ant_print_all(df, model_method="describe")

# 2. 设置主题
ant_plot.set_theme(style="white", palette="deep", font_scale=1.2)

# 3. 分布图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="hist",
              x="outcome", bins=50, kde=True)
ant_plot.axes_set(method="set_title", axindex=0, label="结果变量分布")
ant_plot.show()

# 4. 关系散点图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df", kind="scatter",
              x="treatment", y="outcome", hue="group", alpha=0.6)
ant_plot.axes_set(method="set_title", axindex=0, label="处理 vs 结果")
ant_plot.show()

# 5. 趋势折线图
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=df, method="ant_plot_df_groupby_discrete", kind="line",
              group_by_columns=["year"],
              cal_columns=["outcome"],
              fun_list=["mean"])
ant_plot.axes_set(method="set_title", axindex=0, label="趋势变化")
ant_plot.show()
```

---

## 📖 深入阅读
- ant_plot 完整参数手册 → `03-reference/ant_plot-api.md`
- 绑图示例代码 → `examples/plotting-examples.py`
- ant_plot 核心规则 → `01-rules/hard-constraints.md`
