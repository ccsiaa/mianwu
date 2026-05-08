# 特殊模型

> Heckman、OrderedModel、Tobit、Cox 生存分析等特殊模型的使用指南。

---

## 模型选择决策树

```
你的因变量特征？
├── 有序分类（如 1=差, 2=中, 3=好）→ OrderedModel
├── 样本选择偏差（观察到的是非随机样本）→ Heckman
├── 截断/删失数据（如有大量0值或上限截断）→ Tobit
├── 时间到事件数据（生存时间 + 是否发生）→ CoxPHFitter
└── 其他
    ├── 多分类无序 → MNLogit（见 regression-models.md）
    └── 计数数据 → Poisson（见 regression-models.md）
```

---

## 1. OrderedModel（有序选择模型）

**适用场景**：因变量是有序的分类变量（如评分 1-5 级、教育程度等）。

```python
from marvel.AntPrint.model import OrderedModel

# distr: "logit" 或 "probit"
model = OrderedModel(df['y'], df[['x1', 'x2']], distr='logit')
result = model.fit(method="nm")   # nm = Nelder-Mead 优化

ant_print_all(result,
              model_attr=['params', 'pvalues', 'prsquared'],
              model_method='summary')
```

### 可输出项

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | method | 汇总表 |

---

## 2. Heckman（赫克曼选择模型）

**适用场景**：样本存在选择偏差。例如只观察到就业者的工资，但需要推断总体。

```python
from marvel.AntPrint.model import Heckman

# y: 结果方程的因变量（如工资）
# x: 结果方程的自变量
# z: 选择方程的自变量（需至少有一个不在 x 中的排除约束变量）

model = Heckman(y, x, z)
result = model.fit()

ant_print_all(result,
              model_attr=['params', 'pvalues', 'prsquared'],
              model_method='summary')
```

### 可输出项

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `params` | attr | 回归系数（含逆米尔斯比） |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | method | 汇总表 |

---

## 3. Tobit（托宾模型）

**适用场景**：因变量被截断（censored），如大量值为0或达到上下限。

```python
from py4etrics.tobit import Tobit

result = Tobit(y, x).fit()

ant_print_all(result,
              model_attr=['params', 'pvalues', 'prsquared'],
              model_method='summary')
```

### 可输出项

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | method | 汇总表 |

---

## 4. 生存分析 — CoxPHFitter

**适用场景**：分析"时间到事件"数据，如客户流失时间、设备故障时间等。

### 基本用法

```python
from lifelines import CoxPHFitter

cph = CoxPHFitter()
cph.fit(df,
        duration_col='duration',    # 持续时间列
        event_col='event')          # 事件是否发生（0/1）

ant_print_all(cph, model_method='print_summary')
```

### 时变协变量版本

```python
from lifelines import CoxTimeVaryingFitter

ctv = CoxTimeVaryingFitter(penalizer=0.1)
ctv.fit(df,
        id_col='id',           # 个体ID
        event_col='event',     # 事件列
        start_col='start',     # 开始时间
        stop_col='stop')       # 结束时间

ant_print_all(ctv, model_method='print_summary')
```

---

## 📖 深入阅读
- 所有模型完整 API → `03-reference/model-api-catalog.md`
- 可用包及版本 → `03-reference/packages.md`
