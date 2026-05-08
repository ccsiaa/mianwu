# 数据读取与初始化

> 研究的第一步：从平台读取数据，进行基础字段处理。

---

## 读取数据

### 基本用法

```python
from marvel.AntPrint import ant_read_data

# 读取整表
df = ant_read_data('table_name')

# 读取指定列（推荐大数据表使用，减少内存）
df = ant_read_data('table_name', cols=['col1', 'col2', 'col3'])
```

### 项目表名

> 📋 **项目特定的表名定义在 `project-info.md` 中**，写代码前务必先查看。

通用格式：
```python
T_POLICY   = "frlab_sample_..._risk_qt_vplc_twy_sp_202507ext_ds_1"
T_PORTRAIT = "frlab_sample_..._portrait_1"
T_INV1     = "frlab_sample_..._investment_1"
T_INV2     = "frlab_sample_..._investment_2"
T_CONS1    = "frlab_sample_..._consumption_1"
T_GREEN    = "frlab_sample_..._green_csr_1"
T_VISIT    = "frlab_sample_..._visit_1"
```

### 安全读取（带环境判断）

```python
from marvel.AntPrint.sandbox.global_constant import envir

if envir() == '仿真环境':
    ant_print_all(pd.DataFrame({"提示": ["仿真环境，跳过"]}))
else:
    df = ant_read_data('your_table')
```
📖 详细环境处理 → `01-rules/environment.md`

---

## 数据概览（读取后第一步）

```python
# 基本信息检查
ant_print_all(df, model_method="describe")                          # 数值统计
ant_print_all(df, model_method="describe", des=["shape", "columns", "dtypes"])  # 结构信息
ant_print_all(df, model_method="describe", des=["pct_5", "pct_95"])             # 分位数
```

**支持的 `des` 参数**：

| 参数 | 输出 |
|------|------|
| `shape` | (行数, 列数) |
| `columns` | 所有列名 |
| `dtypes` | 每列数据类型 |
| `describe` | count/mean/std/min/25%/50%/75%/max |
| `mean`, `std`, `min`, `max` | 单项统计量 |
| `median`, `sem` | 中位数、标准误 |
| `skew`, `kurtosis` | 偏度、峰度 |
| `pct_1`, `pct_99` | 1%/99% 分位数 |
| `pct_5`, `pct_95` | 5%/95% 分位数 |

---

## 字段处理常见模式

### 类型转换

```python
# 数值转换
df["金额"] = df["金额_单位分"].astype(float)

# 整数转换
df["年龄"] = df["年龄"].astype(int)

# 布尔/0-1 转换
df["是否理赔"] = (df["历史至今理赔数"] > 0).astype(int)
df["女性"] = (df["性别"] == "F").astype(int)
df["本人投保"] = (df["关系"] == "本人").astype(int)
```

### 时间处理

```python
df["时间"] = pd.to_datetime(df["时间列"])
df["年份"] = df["时间"].dt.year
df["月份"] = df["时间"].dt.month
```

### 条件变量生成

```python
# 是否触及限制
df["restrict"] = (df["实际保额"] == df["预测保额"]).astype(int)

# 是否实施后（有预测值）
df["post"] = df["预测保额"].notna().astype(int)
```

---

## 样本筛选

```python
# 组合条件筛选
cond1 = df["本人投保"] == 1
cond2 = df["实际保额"] <= 1_000_000          # 剔除异常大额
cond3 = (df["post"] == 0) | (df["实际保额"] <= df["预测保额"])

df = df[cond1 & cond2 & cond3].copy()
```

---

## 相关性矩阵

```python
# 无行数限制，可放心使用
ant_print_all(df[["var1", "var2", "var3", "var4"]].corr())
```

---

## 📖 深入阅读
- 描述性统计详细方法 → `02-workflow/descriptive-stats.md`
- 输出行数限制 → `01-rules/output-limits.md`
- 可用包列表 → `03-reference/packages.md`
