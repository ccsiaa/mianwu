# 描述性统计

> 读取数据后，用描述性统计了解数据分布、发现异常、为建模做准备。

---

## 我想要… → 用什么方法

| 需求 | 方法 | 行数限制 | 风险 |
|------|------|---------|------|
| 看数据基本概览（行列、类型、均值等） | `describe` + des 参数 | 无限制 | 🟢 安全 |
| 看某离散列的值分布 | `value_counts` | **≤100行** | ⚠️ 注意 |
| 按类别变量分组统计 | `describe_by_discrete` | **≤20行** | 🔴 极高风险 |
| 按连续变量分箱统计 | `describe_by_continuous` | **≤20行** | ⚠️ 注意 |
| 看多变量相关性 | `corr()` | 无限制 | 🟢 安全 |
| 加权统计量 | `DescrStatsW` | 无限制 | 🟢 安全 |

---

## 方法1：describe（通用描述性统计）

### 基本用法

```python
# 默认输出：count, mean, std, min, 25%, 50%, 75%, max
ant_print_all(df, model_method="describe")

# 指定信息类型
ant_print_all(df, model_method="describe",
              des=["shape", "columns", "dtypes"])   # 数据结构

# 指定统计函数
ant_print_all(df, model_method="describe",
              fun_list=["mean", "std", "median", "pct_5", "pct_95"])
```

**适用场景**：
- ✅ 读取数据后的第一步检查
- ✅ 了解数值变量的分布范围
- ✅ 检查缺失值（count < 总行数说明有缺失）

---

## 方法2：value_counts（值计数）

```python
# Series 的值计数（≤100行）
ant_print_all(df["性别"], model_method="value_counts")
ant_print_all(df["城市级别"], model_method="value_counts")
```

⚠️ **当唯一值 > 100 时会超限**。解决方案：
- 使用 `describe_by_continuous` 对连续变量分箱
- 先筛选数据减少类别数

---

## 方法3：describe_by_discrete（按离散变量分组）⚠️ 最常踩坑！

### 基本用法

```python
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["城市级别"],       # 分组列（离散）
              cal_columns=["是否理赔"],            # 计算列
              fun_list=["sum", "mean"])            # 聚合函数
```

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `group_by_columns` | 分组列（离散变量），支持多列 | `["性别", "城市级别"]` |
| `cal_columns` | 要计算的列 | `["是否报案", "理赔金额"]` |
| `fun_list` | 聚合函数 | `["count", "sum", "mean"]` |

### ⚠️ 行数计算公式

```
总行数 = (∏ 每个分组列的唯一值数) × len(cal_columns) × len(fun_list)
```

**必须 ≤ 20 行！**

### ✅ 正确示例

```python
# 单分组 + 单列 → 6×1×1 = 6 行 ✅
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],    # 6个城市级别
              cal_columns=["是否理赔"],
              fun_list=["mean"])

# 单分组 + 单列 + 多函数 → 6×1×2 = 12 行 ✅
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否理赔"],
              fun_list=["sum", "mean"])
```

### ❌ 错误示例

```python
# 多分组交叉 + 多列 + 多函数 → 6×12×2×2 = 288 行 ❌❌❌
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],  # 6×12=72组
              cal_columns=["是否报案", "是否理赔"],     # 2列
              fun_list=["sum", "mean"])                # 2函数
```

### 🔧 超限解决策略

**策略1：拆分 cal_columns**
```python
# 拆成两次调用
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否报案"],
              fun_list=["sum"])

ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否理赔"],
              fun_list=["sum"])
```

**策略2：拆分 group_by_columns**
```python
# 每个月份单独做
for month in df["月份"].unique():
    sub_df = df[df["月份"] == month]
    ant_print_all(sub_df, model_method="describe_by_discrete",
                  group_by_columns=["城市级别"],
                  cal_columns=["是否理赔"],
                  fun_list=["mean"])
```

> 📖 完整安全指南 → `01-rules/output-limits.md`

---

## 方法4：describe_by_continuous（按连续变量分箱）

```python
# 等频分箱（quantile）：每个箱子样本数大致相等
ant_print_all(df,
              model_method="describe_by_continuous",
              group_by_columns=["投保人年龄"],        # 连续变量
              cal_columns=["年化保费"],
              q=[0.2, 0.5, 0.8],                     # 分割点 → 4个箱
              cut_strategy="quantile",               # 等频
              fun_list=["mean"])

# 等宽分箱（uniform）：每个箱子宽度相等
ant_print_all(df,
              model_method="describe_by_continuous",
              group_by_columns=["投保人年龄"],
              cal_columns=["年化保费"],
              q=5,                                   # 5个箱
              cut_strategy="uniform",                # 等宽
              fun_list=["mean"])
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `group_by_columns` | 用于分箱的连续变量 |
| `cal_columns` | 要计算的列 |
| `q` | 分割点列表或分箱数（分箱数 = len(q)+1 或 q 本身） |
| `cut_strategy` | `"quantile"` 等频 / `"uniform"` 等宽 |
| `fun_list` | 聚合函数 |

⚠️ **分箱数 ≤ 20**

---

## 方法5：corr（相关性矩阵）

```python
# 无行数限制，可放心使用
ant_print_all(df[["var1", "var2", "var3"]].corr())
```

---

## 方法6：DescrStatsW（加权描述性统计）

```python
from statsmodels.stats.weightstats import DescrStatsW
import numpy as np

# 创建权重（例如抽样权重）
weights = pd.DataFrame(np.random.randint(3, 10, df.shape[0]))

# 计算加权统计量
d = DescrStatsW(df[["var1", "var2"]], weights=weights)

# 输出加权均值和标准差
ant_print_all(d, model_attr=["mean", "std"])
```

支持的属性：`mean`, `std`, `var`, `sum`, `std_mean`, `corrcoef`, `cov`

---

## 替代方案速查表

| 你想做的 | pandas 原生写法（❌ 不支持） | 平台写法（✅ 正确） |
|---------|--------------------------|-------------------|
| `df.groupby("x")["y"].value_counts()` | ❌ | `describe_by_discrete(group_by=["x"], cal=["y"], fun=["sum"])` |
| `df.groupby("x")["y"].mean()` | ❌ | `describe_by_discrete(group_by=["x"], cal=["y"], fun=["mean"])` |
| `df["x"].value_counts()` | ❌ 直接输出不行 | `ant_print_all(df["x"], model_method="value_counts")` |
| `print(df.describe())` | ❌ print 被禁用 | `ant_print_all(df, model_method="describe")` |
| `print(df.corr())` | ❌ print 被禁用 | `ant_print_all(df[...].corr())` |

---

## 📖 深入阅读
- 输出行数限制详解 → `01-rules/output-limits.md`
- ant_print_all 规则 → `01-rules/hard-constraints.md`
