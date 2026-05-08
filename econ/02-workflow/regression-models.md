# 回归模型

> 面板数据回归、OLS、工具变量、SUR 等核心回归模型的使用指南。

---

## 模型选择决策树

```
数据结构？
├── 面板数据（有 entity + time 双索引）
│   ├── 固定效应 → PanelOLS (entity_effects=True, time_effects=True)
│   ├── 随机效应 → RandomEffects
│   ├── 高维固定效应 → AbsorbingLS (类似 reghdfe)
│   └── 工具变量 → IV2SLS (面板版)
├── 横截面数据
│   ├── OLS → sm.OLS
│   ├── 工具变量 → IV2SLS
│   ├── 二值因变量 → Logit / Probit
│   ├── 多分类因变量 → MNLogit
│   ├── 计数因变量 → Poisson
│   └── 稳健回归 → RLM
└── 多方程系统
    └── 联合估计 → SUR
```

---

## 1. PanelOLS（面板固定效应）— 最常用

### 基本用法

```python
import linearmodels as lm

# 准备面板数据（必须设置双索引）
df = df.set_index(['entity_id', 'time_id'])

y = df['dependent_var']
X = df[['x1', 'x2', 'x3']]

# 双向固定效应
model = lm.PanelOLS(y, X,
                    entity_effects=True,    # 个体固定效应
                    time_effects=True,      # 时间固定效应
                    drop_absorbed=True)     # 吸收共线性列
result = model.fit(cov_type='clustered',
                   cluster_entity=True,
                   cluster_time=True)

# 输出结果
ant_print_all(result,
              model_attr=['params', 'pvalues', 'tstats', 'rsquared', 'nobs'],
              model_method='summary')
ant_print_all(result, model_method='conf_int', level=0.95)
```

### 常用变体

```python
# 仅个体固定效应
model = lm.PanelOLS(y, X, entity_effects=True)

# 仅时间固定效应
model = lm.PanelOLS(y, X, time_effects=True)

# 聚类稳健标准误（仅按个体聚类）
result = model.fit(cov_type='clustered', cluster_entity=True)
```

### 可输出的属性/方法

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tstats` | attr | T统计量 |
| `rsquared` | attr | R² |
| `std_errors` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | attr | 汇总表 |
| `conf_int` | method | 置信区间 |
| `cov` | attr | 协方差矩阵 |

📎 完整示例 → `examples/panel-regression.py`

---

## 2. OLS（普通最小二乘法）

```python
import statsmodels.api as sm

y = df['y']
X = df[['x1', 'x2', 'x3']]

# 添加常数项
result = sm.OLS(y, sm.add_constant(X)).fit(
    cov_type='cluster',
    cov_kwds={'groups': df['cluster_var']}
)

ant_print_all(result,
              model_attr=['params', 'pvalues', 'rsquared_adj'],
              model_method='summary')
```

### OLS 特有属性

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `rsquared` | attr | R² |
| `rsquared_adj` | attr | 调整R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `f_test` | method | F检验 |
| `summary` / `summary2` | method | 汇总表 |

---

## 3. Logit / Probit（二值选择模型）

```python
# Logit
result = sm.Logit(y, X).fit()

# Probit
result = sm.Probit(y, X).fit()

ant_print_all(result,
              model_attr=['params', 'pvalues', 'prsquared'],
              model_method='summary')
```

⚠️ **边际效应输出注意**：`DiscreteMargins` 对象属性是 numpy 数组，难以自定义格式。
推荐使用 `result_printer.summary_col` 输出原始系数：
```python
from marvel.AntPrint import result_printer
ant_print_all(result_printer, model_method="summary_col",
              results=[model1, model2], model_names=["(1)", "(2)"],
              stars=True, info_list=["nobs", "prsquared"])
```
📖 详细说明 → `03-reference/result_printer.md`

---

## 4. IV2SLS（工具变量回归）

### 横截面版本

```python
import linearmodels as lm

y = df['y']           # 因变量
x = df[['x1']]        # 外生变量
e = df[['endog']]     # 内生变量
z = df[['z1', 'z2']]  # 工具变量

model = lm.IV2SLS(y, x, e, z)
result = model.fit(cov_type='robust')

ant_print_all(result,
              model_attr=['params', 'pvalues', 'summary'])
# IV 检验
ant_print_all(result, model_attr=['sargan', 'wu_hausman'])
```

### IV2SLS 特有检验属性

| 属性 | 说明 |
|------|------|
| `sargan` | Sargan 过度识别检验 |
| `basmann` | Basmann 检验 |
| `wooldridge_score` | Wooldridge 得分检验 |
| `wooldridge_overid` | Wooldridge 过度识别检验 |
| `anderson_rubin` | Anderson-Rubin 检验 |
| `first_stage` | 第一阶段信息 |

---

## 5. RandomEffects（随机效应）

```python
result = lm.RandomEffects(y, X).fit()
ant_print_all(result,
              model_attr=['params', 'pvalues', 'rsquared', 'summary'])
```

---

## 6. AbsorbingLS（高维固定效应，类似 reghdfe）

```python
from linearmodels.iv.absorbing import AbsorbingLS

y = df['lwage']
x = df[['exper']]

# 创建要吸收的分类变量
import pandas as pd
cats = pd.DataFrame([pd.Categorical(df[name]) for name in ['year', 'married']])

model = AbsorbingLS(y, x, absorb=cats)
result = model.fit(method="lsmr", use_cache=False)

ant_print_all(result, model_attr="summary")
```

---

## 7. SUR（似不相关回归）

```python
formula = {
    'eq1': 'y1 ~ x1 + x2',
    'eq2': 'y2 ~ x1 + x3'
}
model = lm.system.model.SUR.from_formula(formula, data=df)
result = model.fit()

ant_print_all(result,
              model_attr=['params', 'pvalues', 'rsquared', 'summary'])
```

---

## 标准误类型速查

| 场景 | cov_type | 参数 |
|------|----------|------|
| 异方差稳健 | `'robust'` | - |
| 聚类稳健（OLS） | `'cluster'` | `cov_kwds={'groups': var}` |
| 聚类稳健（PanelOLS） | `'clustered'` | `cluster_entity=True`, `cluster_time=True` |
| HC标准误 | `'hc0'`, `'hc1'`, `'hc2'`, `'hc3'` | - |

---

## 📖 深入阅读
- 所有模型完整 API → `03-reference/model-api-catalog.md`
- 多模型聚合输出表格 → `03-reference/result_printer.md`
- 面板回归完整示例 → `examples/panel-regression.py`
- 通用多模型回归模板 → `04-patterns/code-templates.md`
