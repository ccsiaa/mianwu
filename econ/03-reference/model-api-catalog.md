# 模型 API 速查手册

> 所有支持模型的属性和方法速查表。**纯参考用途**，按需查阅。
> 使用指南 → `02-workflow/regression-models.md` | `02-workflow/causal-inference.md` | `02-workflow/specialized-models.md`

---

## 回归模型

### PanelOLS（`linearmodels`）

```python
import linearmodels as lm
model = lm.PanelOLS(y, X, entity_effects=True, time_effects=True)
result = model.fit(cov_type='clustered', cluster_entity=True)
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 (Series) |
| `pvalues` | attr | P值 (Series) |
| `tstats` | attr | T统计量 (Series) |
| `rsquared` | attr | R² (float) |
| `std_errors` | attr | 标准误 (Series) |
| `nobs` | attr | 观测数 (int) |
| `summary` | attr | 汇总表 |
| `conf_int(level)` | method | 置信区间 (DataFrame) |
| `cov` | attr | 协方差矩阵 |

### RandomEffects（`linearmodels`）

```python
result = lm.RandomEffects(y, X).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tstats` | attr | T统计量 |
| `rsquared` | attr | R² |
| `std_errors` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | attr | 汇总表 |

### IV2SLS（`linearmodels`）

```python
result = lm.IV2SLS(y, x, endogenous, instruments).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tstats` | attr | T统计量 |
| `rsquared` | attr | R² |
| `rsquared_adj` | attr | 调整R² |
| `std_errors` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary` | attr | 汇总表 |
| `sargan` | attr | Sargan检验 |
| `basmann` | attr | Basmann检验 |
| `wooldridge_score` | attr | Wooldridge得分检验 |
| `wooldridge_overid` | attr | Wooldridge过度识别检验 |
| `anderson_rubin` | attr | Anderson-Rubin检验 |
| `basmann_f` | attr | Basmann F检验 |
| `first_stage` | attr | 第一阶段信息 |
| `durbin()` | method | Durbin检验 |
| `wu_hausman()` | method | Wu-Hausman检验 |

### AbsorbingLS（`linearmodels.iv.absorbing`）

```python
from linearmodels.iv.absorbing import AbsorbingLS
model = AbsorbingLS(y, x, absorb=categorical_vars)
result = model.fit(method="lsmr", use_cache=False)
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `summary` | attr | 汇总表 |

### OLS（`statsmodels.api`）

```python
result = sm.OLS(y, X).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `rsquared` | attr | R² |
| `rsquared_adj` | attr | 调整R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `f_test()` | method | F检验结果 |
| `summary()` / `summary2()` | method | 汇总表 |

### Logit / Probit（`statsmodels.api`）

```python
result = sm.Logit(y, X).fit()   # 或 sm.Probit(y, X).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary()` / `summary2()` | method | 汇总表 |

### MNLogit（`statsmodels`）

```python
result = sm.MNLogit(y, X).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### RLM（`statsmodels`）

```python
result = sm.RLM(y, x).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### Poisson（`statsmodels.discrete.discrete_model`）

```python
from statsmodels.discrete.discrete_model import Poisson
result = Poisson(y, x).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### ARIMA（`statsmodels.tsa.arima.model`）

```python
from statsmodels.tsa.arima.model import ARIMA
result = ARIMA(data).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 模型参数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

---

## 因果推断模型

### PSM（`marvel.AntPrint.model.PSM`）

#### 类定义

```python
class marvel.AntPrint.model.PsmModel.PSM(test, control, xvar, yvar=None)
```

**构造参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `test` | DataFrame | 数据量较小的组 |
| `control` | DataFrame | 数据量较大的组 |
| `xvar` | list | 协变量名列表 |
| `yvar` | str | 因变量名（可选） |

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| `test_x` | DataFrame | 处理组数据 |
| `control_x` | DataFrame | 对照组数据 |
| `test_pscore` | ndarray | 处理组倾向得分 |
| `control_pscore` | ndarray | 对照组倾向得分 |
| `pscore_model` | BinaryResultsWrapper | 倾向得分模型拟合结果 |
| `test_weight` | ndarray | 处理组匹配权重 |
| `control_weight` | ndarray | 对照组匹配权重 |
| `quality` | DataFrame | 平衡性检验P值 |

**方法**：

| 方法签名 | 说明 |
|---------|------|
| `calculate_pscore(covariates, method)` | 计算倾向得分，method="probit"/"logit" |
| `set_pscore(test_pscore, control_pscore)` | 设置自定义倾向得分 |
| `match(nmatches, replacement, radius, measure, scale, seed)` | 执行匹配 |
| `kernel_match(kernel, **kwargs)` | 核匹配 |
| `get_indices(stage)` | 获取匹配索引，stage="before"/"after" |
| `plot_balance(covariates, stage)` | 绑制平衡图 |
| `match_quality(covariates, test_method, stage)` | 平衡性检验，test_method="t"/"rank" |

**match 参数详解**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nmatches` | int | 1 | 匹配数 |
| `replacement` | bool | True | 有放回 |
| `radius` | float/None | None | 半径约束 |
| `measure` | str | "pscore" | "pscore"或"covariates" |
| `scale` | bool | False | 是否标准化 |
| `seed` | int | 0 | 随机种子 |

### CausalModel（`causalinference`）

```python
from causalinference import CausalModel
causal = CausalModel(Y, D, X)
causal.est_via_matching()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `summary_stats` | attr | 汇总统计 |
| `estimates` | attr | 处理效应估计 |

### EconML（`econml`）

```python
from econml.dml import DML, LinearDML, NonParamDML, CausalForestDML, SparseLinearDML
from econml.metalearners import XLearner, TLearner
```

| 方法 | 说明 |
|------|------|
| `ate(X)` | 平均处理效应 |
| `ate_inference(X)` | 处理效应推断 |
| `score()` | 模型得分 |

### CEM（`cem`）

```python
from cem import CEM
c = CEM(data, treatment, outcome)
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `outcome` | attr | 匹配结果 |
| `H` | attr | H值 |
| `imbalance_scheme` | attr | 不平衡方案 |
| `imbalance()` | method | 不平衡计算 |

---

## 特殊模型

### OrderedModel（`marvel.AntPrint.model`）

```python
from marvel.AntPrint.model import OrderedModel
model = OrderedModel(df['y'], df[['x1', 'x2']], distr='logit')
result = model.fit(method="nm")
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `tvalues` | attr | T统计量 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### Heckman（`marvel.AntPrint.model`）

```python
from marvel.AntPrint.model import Heckman
model = Heckman(y, x, z)
result = model.fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `tvalues` | attr | T统计量 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### Tobit（`py4etrics.tobit`）

```python
from py4etrics.tobit import Tobit
result = Tobit(y, x).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `prsquared` | attr | 伪R² |
| `bse` | attr | 标准误 |
| `tvalues` | attr | T统计量 |
| `nobs` | attr | 观测数 |
| `summary()` | method | 汇总表 |

### SUR（`linearmodels.system.model`）

```python
model = lm.system.model.SUR.from_formula(formula, data)
result = model.fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `rsquared` | attr | R² |
| `summary` | attr | 汇总表 |
| `system_rsquared` | attr | 系统R² |
| `tstats` | attr | T统计量 |

### ConditionalLogit（`statsmodels.discrete.conditional_models`）

```python
from statsmodels.discrete.conditional_models import ConditionalLogit
result = ConditionalLogit(endog=y, exog=x, groups=g).fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `tvalues` | attr | T统计量 |
| `bse` | attr | 标准误 |
| `nobs` | attr | 观测数 |
| `t_test()` | method | T检验 |
| `f_test()` | method | F检验 |
| `summary()` | method | 汇总表 |

---

## 生存分析

### CoxPHFitter（`lifelines`）

```python
from lifelines import CoxPHFitter
cph = CoxPHFitter()
cph.fit(df, duration_col='duration', event_col='event')
```

| 方法 | 说明 |
|------|------|
| `print_summary` | 打印汇总 |

### CoxTimeVaryingFitter（`lifelines`）

```python
from lifelines import CoxTimeVaryingFitter
ctv = CoxTimeVaryingFitter(penalizer=0.1)
ctv.fit(df, id_col, event_col, start_col, stop_col)
```

| 方法 | 说明 |
|------|------|
| `print_summary` | 打印汇总 |

---

## 其他模型

### GMM（`statsmodels.sandbox.regression.gmm`）

```python
from statsmodels.sandbox.regression.gmm import GMM
class MyGMM(GMM):
    def momcond(self, params): ...
result = MyGMM(endog, exog, instrument).fit(start_params)
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `bse` | attr | 标准误 |
| `pvalues` | attr | P值 |
| `jval` | attr | J统计量 |
| `q` | attr | 目标函数值 |
| `tvalues` | attr | T统计量 |
| `summary()` | method | 汇总表 |

### FixedEffectModel（`FixedEffect`）

```python
from fem.iv import iv2sls, ivgmm
from fem.fe import fixedeffect, did
model = ivgmm(data_df=df, dependent=y, exog_x=exog,
              endog_x=endog, category=['id','time'], iv=iv)
result = model.fit()
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `params` | attr | 回归系数 |
| `pvalues` | attr | P值 |
| `bse` | attr | 标准误 |
| `tvalues` | attr | T统计量 |
| `nobs` | attr | 观测数 |
| `conf_int()` | method | 置信区间 |
| `summary()` | method | 汇总表 |

### 机器学习（`sklearn`）

```python
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.decomposition import PCA
```

| 类 | 关键属性 |
|----|---------|
| DecisionTree/RandomForest | `feature_importances_` |
| PCA | `explained_variance_`, `explained_variance_ratio_` |

### 图模型（`igraph`）

```python
import igraph as ig
g = ig.Graph(n=num_nodes, edges=edges, directed=True)
```

| 属性/方法 | 类型 | 返回 |
|-----------|------|------|
| `summary()` | method | 图汇总 |
| `degree()` | method | 节点度 |
| `vs` | attr | 节点序列 |
| `es` | attr | 边序列 |
