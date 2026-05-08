# 面板回归示例

## 基本面板OLS（固定效应）

```python
import pandas as pd
import numpy as np
import linearmodels as lm
from marvel.AntPrint import ant_read_data, ant_print_all

# 读取数据
df = ant_read_data('panel_data')

# 设置面板数据结构
df = df.set_index(['entity_id', 'time_id'])

# 定义变量
y = df['dependent_var']
X = df[['x1', 'x2', 'x3']]

# 拟合模型（个体和时间固定效应）
model = lm.PanelOLS(y, X, entity_effects=True, time_effects=True, drop_absorbed=True)
result = model.fit(cov_type='clustered', cluster_entity=True, cluster_time=True)

# 输出结果
ant_print_all(result, model_attr=['params', 'pvalues', 'rsquared', 'nobs', 'summary'])
```

## 面板OLS带置信区间

```python
import linearmodels as lm
from marvel.AntPrint import ant_read_data, ant_print_all

df = ant_read_data('my_table')
df = df.set_index(['firm_id', 'year'])

y = df['investment']
X = df[['cash_flow', 'tobin_q']]

model = lm.PanelOLS(y, X, entity_effects=True)
result = model.fit(cov_type='robust')

# 输出系数和置信区间
ant_print_all(result, model_attr=['params', 'pvalues', 'std_errors'])
ant_print_all(result, model_method='conf_int', level=0.95)
ant_print_all(result, model_attr='summary')
```

## 随机效应模型

```python
import linearmodels as lm
from marvel.AntPrint import ant_read_data, ant_print_all

df = ant_read_data('panel_data')
df = df.set_index(['id', 'year'])

y = df['y']
X = df[['x1', 'x2']]

# 随机效应
result = lm.RandomEffects(y, X).fit()
ant_print_all(result, model_attr=['params', 'pvalues', 'rsquared', 'summary'])
```

## 工具变量回归（IV2SLS）

```python
import linearmodels as lm
from marvel.AntPrint import ant_read_data, ant_print_all

df = ant_read_data('iv_data')
df = df.set_index(['entity', 'time'])

y = df['y']           # 因变量
x = df[['x1', 'x2']]  # 外生变量
e = df[['endog']]     # 内生变量
z = df[['z1', 'z2']]  # 工具变量

model = lm.IV2SLS(y, x, e, z)
result = model.fit(cov_type='robust')

# 输出结果（包含检验）
ant_print_all(result, model_attr=['params', 'pvalues', 'summary'])
ant_print_all(result, model_attr=['sargan', 'wu_hausman'])
```

## AbsorbingLS（类似Stata的reghdfe）

```python
from linearmodels.iv.absorbing import AbsorbingLS
from marvel.AntPrint import ant_read_data, ant_print_all

df = ant_read_data('wage_panel')

y = df['lwage']
x = df[['expersq']]

# 创建分类变量用于吸收
import pandas as pd
cats = pd.DataFrame([pd.Categorical(df[name]) for name in ['year', 'married']])

model = AbsorbingLS(y, x, absorb=cats)
result = model.fit(method="lsmr", use_cache=False)

ant_print_all(result, model_attr="summary")
```

## SUR（似不相关回归）

```python
import linearmodels as lm
from marvel.AntPrint import ant_read_data, ant_print_all

df = ant_read_data('sur_data')

# 使用公式定义方程
formula = {
    'eq1': 'y1 ~ x1 + x2',
    'eq2': 'y2 ~ x1 + x3'
}

model = lm.system.model.SUR.from_formula(formula, data=df)
result = model.fit()

ant_print_all(result, model_attr=['params', 'pvalues', 'rsquared', 'summary'])
```

## 完整工作流示例

```python
import pandas as pd
import numpy as np
import linearmodels as lm
import statsmodels.api as sm
from marvel.AntPrint import ant_read_data, ant_print_all

# 1. 读取数据
df = ant_read_data('firm_panel')

# 2. 描述性统计
ant_print_all(df, model_method="describe")
ant_print_all(df, model_method="describe", des=['shape', 'dtypes', 'pct_5', 'pct_95'])

# 3. 相关系数矩阵
ant_print_all(df[['y', 'x1', 'x2', 'x3']], model_method="corr")

# 4. 准备面板数据
df = df.set_index(['firm_id', 'year'])
y = df['investment']
X = df[['cash_flow', 'size', 'leverage']]

# 5. OLS对比
ols_result = sm.OLS(y, sm.add_constant(X)).fit()
ant_print_all(ols_result, model_attr=['params', 'pvalues', 'rsquared_adj'], model_method='summary')

# 6. 面板OLS固定效应
panel_model = lm.PanelOLS(y, X, entity_effects=True, time_effects=True)
panel_result = panel_model.fit(cov_type='clustered', cluster_entity=True)

# 7. 输出完整结果
ant_print_all(panel_result, model_attr=['params', 'pvalues', 'tstats', 'rsquared', 'nobs'])
ant_print_all(panel_result, model_method='conf_int', level=0.95)
ant_print_all(panel_result, model_attr='summary')
```
