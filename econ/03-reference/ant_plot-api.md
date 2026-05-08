# ant_plot 完整 API 手册

> 平台绑图系统的完整参数参考。**纯查询用途**，按需查阅。
> 使用指南 → `02-workflow/visualization.md` | 示例 → `examples/plotting-examples.py`

---

## 核心方法

### re_init()

重新初始化画布，创建空白图形。

```python
ant_plot.re_init()
```

**注意**：每次绑制新图前必须调用。

### add_subplot(nrows, ncols, index)

向画布添加子图区域。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nrows` | int | 1 | 行数 |
| `ncols` | int | 1 | 列数 |
| `index` | int/tuple | 1 | 子图位置（从1开始） |

返回值：int（axes_list 中的索引，用于 axindex）

```python
# 单图（默认）
ant_plot.add_subplot()

# 2×2 布局
ant_plot.add_subplot(2, 2, 1)   # 左上 (axindex=0)
ant_plot.add_subplot(2, 2, 2)   # 右上 (axindex=1)
ant_plot.add_subplot(2, 2, 3)   # 左下 (axindex=2)
ant_plot.add_subplot(2, 2, 4)   # 右下 (axindex=3)
```

### plot(df, method, kind, axindex, **kwargs)

主绑图函数。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `df` | DataFrame | **必需** | 要绑制的数据 |
| `method` | str | **必需** | 数据处理方法 |
| `kind` | str | **必需** | 图表类型 |
| `axindex` | int | 0 | 子图索引 |

**method 取值**：
- `"ant_plot_df"` — 直接 DataFrame 绑图
- `"ant_plot_df_groupby_discrete"` — 按离散变量分组
- `"ant_plot_df_groupby_continuous"` — 按连续变量分组

---

## 图表类型参数

### 散点图 scatter

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="col1", y="col2", hue="category")
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `x`, `y` | 坐标轴列名 | `"age"`, `"income"` |
| `hue` | 颜色分组变量 | `"gender"` |
| `style` | 标记样式分组变量 | `"region"` |
| `palette` | 调色板 | `"deep"`, `"dark"`, `"pastel"` |
| `markers` | 标记样式 | `["o", "s", "^"]` |
| `alpha` | 透明度 (0-1) | `0.7` |
| `legend` | 图例模式 | `"auto"`, `"brief"`, `"full"`, `False` |

### 折线图 line

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="line",
              x="col1", y="col2", hue="category")
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `x`, `y` | 坐标轴列名 | - |
| `hue` | 分组变量 | - |
| `style` | 线型变量 | - |
| `estimator` | 聚合函数 | `"mean"`, `"sum"`, `"count"` |
| `ci` | 置信区间大小 | `0.95`, `None`(不显示) |
| `n_boot` | Bootstrap 迭代次数 | `1000` |

### 直方图 hist

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="hist",
              x="col1", bins=30, hue="group")
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `x` | 要绑制的列 | - |
| `bins` | 分箱数 | `20`, `50` |
| `hue` | 分组变量 | - |
| `kde` | 是否叠加核密度曲线 | `True`, `False` |
| `stat` | 统计量 | `"count"`, `"frequency"`, `"probability"`, `"percent"` |

### 箱线图 box

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="box",
              x="category", y="value", hue="group")
```

| 参数 | 说明 |
|------|------|
| `x` | 类别列（X轴） |
| `y` | 数值列（Y轴） |
| `hue` | 分组变量 |
| `order` | 类别顺序列表 |

### 核密度图 kde

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="kde",
              x="col1", hue="group")
```

| 参数 | 说明 |
|------|------|
| `x` | 要绑制的列 |
| `hue` | 分组变量 |

### 经验累积分布图 ecdf

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="ecdf",
              x="col1", hue="group")
```

### 热力图 heatmap

```python
pivot = df.pivot_table(index='row', columns='col', values='val')
ant_plot.plot(df=pivot, method="ant_plot_df", kind="heatmap")
```

| 参数 | 说明 |
|------|------|
| `x` | 行变量（透视表的 index） |
| `y` | 列变量（透视表的 columns） |
| `values` | 值变量 |

### 柱状图 bar

```python
ant_plot.plot(df=data, method="ant_plot_df", kind="bar",
              x="category", y="value", hue="group")
```

| 参数 | 说明 |
|------|------|
| `x` | 类别列 |
| `y` | 数值列 |
| `hue` | 分组变量 |

---

## 分组绑图

### 按离散变量分组 groupby_discrete

```python
ant_plot.plot(df=data,
              method="ant_plot_df_groupby_discrete",
              kind="line",
              group_by_columns=["year"],
              cal_columns=["sales"],
              fun_list=["sum"])
```

| 参数 | 说明 |
|------|------|
| `group_by_columns` | 分组列（离散变量），list |
| `cal_columns` | 计算列，list |
| `fun_list` | 聚合函数，list：`"count"`, `"sum"`, `"mean"`, `"std"` 等 |

### 按连续变量分组 groupby_continuous

```python
ant_plot.plot(df=data,
              method="ant_plot_df_groupby_continuous",
              kind="line",
              group_by_columns=["age"],
              cal_columns=["income"],
              q=[0.25, 0.5, 0.75, 1],
              cut_strategy="quantile",
              fun_list=["mean"])
```

| 参数 | 说明 |
|------|------|
| `group_by_columns` | 分组列（连续变量） |
| `cal_columns` | 计算列 |
| `q` | 分箱数量或分割点列表 |
| `cut_strategy` | `"quantile"`（等频）或 `"uniform"`（等宽） |
| `fun_list` | 聚合函数 |

---

## 定制方法

### plt_set(method, **kwargs)

设置 plt（全局）级别属性。

| 方法 | 说明 | 关键参数 |
|------|------|---------|
| `axline` | 添加无限长直线 | `x`, `y`, `slope` |
| `axvline` | 添加垂直线 | `x` |
| `legend` | 添加图例 | `loc`, `labels` |
| `suptitle` | 添加总标题 | `t` |
| `xlabel` | 设置X轴标签 | `xlabel` |
| `xlim` | 设置X轴范围 | `xmin`, `xmax` |
| `xticks` | 设置X轴刻度 | `ticks`, `labels` |
| `ylabel` | 设置Y轴标签 | `ylabel` |
| `ylim` | 设置Y轴范围 | `ymin`, `ymax` |
| `yticks` | 设置Y轴刻度 | `ticks`, `labels` |

### figure_set(method, **kwargs)

设置图形级别属性。

| 方法 | 说明 | 关键参数 |
|------|------|---------|
| `suptitle` | 添加总标题 | `t` |
| `set_size_inches` | 设置图形大小 | `w`, `h` |
| `set_dpi` | 设置DPI | `dpi` |

### axes_set(method, axindex, **kwargs)

设置坐标轴级别属性。

| 方法 | 说明 | 关键参数 |
|------|------|---------|
| `vlines` | 添加垂直线 | `x`, `ymin`, `ymax` |
| `hlines` | 添加水平线 | `y`, `xmin`, `xmax` |
| `set_xlim` | 设置X范围 | `xmin`, `xmax` |
| `set_ylim` | 设置Y范围 | `ymin`, `ymax` |
| `set_xlabel` | 设置X标签 | `xlabel` |
| `set_ylabel` | 设置Y标签 | `ylabel` |
| `set_title` | 设置标题 | `label` |
| `legend` | 添加图例 | `loc`, `labels` |
| `set_xticks` | 设置X刻度 | `ticks` |
| `set_xticklabels` | 设置X刻度标签 | `labels` |
| `set_yticks` | 设置Y刻度 | `ticks` |
| `set_yticklabels` | 设置Y刻度标签 | `labels` |

### set_theme(**kwargs)

设置视觉主题（在 `re_init()` 之前调用）。

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `context` | 缩放参数 | `"notebook"`, `"paper"`, `"talk"`, `"poster"` |
| `style` | 坐标轴样式 | `"white"`, `"dark"`, `"whitegrid"`, `"darkgrid"`, `"ticks"` |
| `palette` | 调色板 | `"deep"`, `"dark"`, `"pastel"`, `"bright"`, `"muted"` |
| `font` | 字体族 | `"SimHei"`（中文推荐） |
| `font_scale` | 字体大小缩放 | `1.0`, `1.2`, `1.5` 等 |
| `color_codes` | 启用颜色代码 | `True`, `False` |
| `rc` | 自定义rc参数 | `dict` |

```python
# 中文支持
ant_plot.set_theme(font='SimHei', rc={'font.sans-serif': ['SimHei']})

# 学术风格
ant_plot.set_theme(style="whitegrid", palette="deep", font_scale=1.2)

# 报告风格
ant_plot.set_theme(context="talk", style="ticks", palette="muted")
```
