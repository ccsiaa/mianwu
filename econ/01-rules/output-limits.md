# 输出行数限制

> ⚠️ **超过限制会触发 Warning，导致试运行不通过！**
> 每次输出前必须确认结果行数在限制内。

---

## 限制总览

### DataFrame 方法

| 方法 | 输出上限 | 风险等级 |
|------|----------|---------|
| `corr` | 无限制 | 🟢 安全 |
| `nunique` | 无限制 | 🟢 安全 |
| `describe` | 无限制 | 🟢 安全 |
| **`value_counts`** | **🔴 100 行** | ⚠️ 高风险 |
| **`describe_by_discrete`** | **🔴 20 行** | ⚠️ 极高风险 |
| **`describe_by_continuous`** | **🔴 20 行** | ⚠️ 高风险 |

### Series 方法

| 方法 | 输出上限 | 风险等级 |
|------|----------|---------|
| **`value_counts`** | **🔴 100 行** | ⚠️ 高风险 |

---

## describe_by_discrete 安全使用指南（最常踩坑）

### 限制原理

`describe_by_discrete` 会按 `group_by_columns` 分组，对每个分组 × `cal_columns` × `fun_list` 的组合生成一行。**总行数 = 分组数 × 计算列数 × 函数数**。

### ✅ 安全做法：拆分调用

```python
# ❌ 危险！分组数可能远超20行
# 假设"城市级别"有6个值，"月份"有12个 → 6×12=72组 → 远超20行限制
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否报案", "是否理赔"],
              fun_list=["sum"])

# ✅ 正确：拆分成多次调用，每次确保 ≤ 20 行
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否报案"],
              fun_list=["sum"])

ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否理赔"],
              fun_list=["sum"])
```

### 行数估算公式

```
预计行数 = ∏(每个 group_by_column 的唯一值数量) × len(cal_columns) × len(fun_list)
```

**示例**：
- `group_by_columns=["性别"]`（2值）, `cal_columns=["y"]`（1列）, `fun_list=["mean"]`（1函数）
  → 2 × 1 × 1 = **2 行** ✅ 安全
- `group_by_columns=["城市级别"]`（6值）, `cal_columns=["y1", "y2"]`（2列）, `fun_list=["sum", "mean"]`（2函数）
  → 6 × 2 × 2 = **24 行** ❌ 超限！

### 如果确实需要多维度交叉

```python
# 方案1：减少 cal_columns（每次只看一列）
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否报案"],     # 只看一列
              fun_list=["sum"])

# 方案2：先用 value_counts 确认分组数，再决定拆分策略
ant_print_all(df["城市级别"], model_method="value_counts")  # 先看有多少个城市级别
```

---

## value_counts 安全使用指南

### 限制：100 行

通常用于查看离散变量的分布。当变量取值过多时会超限。

```python
# ✅ 安全：取值少的离散变量（如性别、是否理赔）
ant_print_all(df["性别"], model_method="value_counts")

# ⚠️ 有风险：取值多的变量（如用户ID、日期）
# ant_print_all(df["匿名化用户id"], model_method="value_counts")  # 可能 >100 行

# 解决方案：先筛选或用 describe_by_continuous 分箱
ant_print_all(df, model_method="describe_by_continuous",
              group_by_columns=["投保人年龄"],
              cal_columns=["年化保费"],
              q=5, cut_strategy="quantile",
              fun_list=["count"])
```

---

## describe_by_continuous 安全使用指南

### 限制：20 行

按连续变量分箱后统计，行数由分箱数决定。

```python
# ✅ 安全：5 等分 → 5 行
ant_print_all(df, model_method="describe_by_continuous",
              group_by_columns=["age"],
              cal_columns=["income"],
              q=5, cut_strategy="quantile",
              fun_list=["mean"])

# ⚠️ 注意：q 是分割点数量，不是分箱数
# q=[0.2, 0.5, 0.8] → 4 个分箱（≤20, ≤50%, ≤80%, >80%）→ 4 行 ✅
# q=100 → 101 个分箱 → 101 行 ❌ 超限！
```

---

## 快速决策树

```
我想要输出统计结果
├── 看数据基本概览（行列、类型、均值等）
│   └── 用 describe → 无限制，随便用 ✅
├── 看某列的值分布
│   ├── 取值少（<100种）→ value_counts ✅
│   └── 取值多（≥100种）→ 用 describe_by_continuous 分箱
├── 按类别分组统计
│   ├── 单分组（<20组）+ 单列 → describe_by_discrete ✅
│   ├── 单分组（<20组）+ 多列 → 拆成多次调用
│   ├── 多分组交叉 → 计算行数，可能超限 → 拆分
│   └── 按连续变量分组 → describe_by_continuous
├── 看相关性
│   └── corr() → 无限制 ✅
└── 不确定？
    └── 先估算行数，再选择方法
        行数 = 分组数 × 列数 × 函数数
        如果 > 20（discrete/continuous）或 > 100（value_counts）→ 拆分！
```
