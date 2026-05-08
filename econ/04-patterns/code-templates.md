# 通用代码模板

> 可复用的代码模板，直接复制使用，根据项目替换变量名即可。

---

## 模板1：多模型回归框架（6模型对比）

适用于需要系统性地比较不同控制变量组合下回归结果的场景（如经济学论文）。

### 函数定义

```python
def run_regression_models(y_data, x_data, control_data,
                          province_var, birth_year_var, cluster_var,
                          model_name_suffix=""):
    """
    运行6个回归模型并返回结果

    参数:
        y_data: 因变量 (Series)
        x_data: 核心自变量 (Series，需有 .name 属性)
        control_data: 控制变量 (DataFrame)
        province_var: 省份变量（用于省份固定效应）
        birth_year_var: 出生年份变量（用于出生队列固定效应）
        cluster_var: 聚类变量 (Series)
        model_name_suffix: 模型名称后缀

    返回:
        result_list: 模型结果列表
        model_names: 模型名称列表
        key_variables: 关键变量名列表（用于控制输出行）
    """
    # 准备固定效应虚拟变量
    province_dummies = pd.get_dummies(province_var, prefix='prov', drop_first=True)
    birth_cohort = (birth_year_var // 10) * 10
    cohort_dummies = pd.get_dummies(birth_cohort, prefix='cohort', drop_first=True)

    # 模型1：仅核心自变量 + 常数项
    x_basic = sm.add_constant(x_data)
    model1 = sm.OLS(y_data, x_basic).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型2：核心自变量 + 控制变量
    x_controls = sm.add_constant(pd.concat([x_data, control_data], axis=1))
    model2 = sm.OLS(y_data, x_controls).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型3：核心自变量 + 省份FE + 出生队列FE（无控制变量）
    x_fe_only = sm.add_constant(
        pd.concat([x_data, province_dummies, cohort_dummies], axis=1))
    model3 = sm.OLS(y_data, x_fe_only).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型4：核心自变量 + 控制变量 + 省份FE
    x_prov = sm.add_constant(
        pd.concat([x_data, control_data, province_dummies], axis=1))
    model4 = sm.OLS(y_data, x_prov).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型5：核心自变量 + 控制变量 + 出生队列FE
    x_cohort = sm.add_constant(
        pd.concat([x_data, control_data, cohort_dummies], axis=1))
    model5 = sm.OLS(y_data, x_cohort).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型6：全包含（核心 + 控制 + 省份FE + 队列FE）
    x_full = sm.add_constant(
        pd.concat([x_data, control_data, province_dummies, cohort_dummies], axis=1))
    model6 = sm.OLS(y_data, x_full).fit(
        cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 准备关键变量列表（决定表格输出哪些行）
    key_variables = [x_data.name] + control_data.columns.tolist() + ['const']

    # 组织结果
    result_list = [model1, model2, model3, model4, model5, model6]
    model_names = [
        f"basic{model_name_suffix}",
        f"controls{model_name_suffix}",
        f"FE{model_name_suffix}",
        f"controls+provFE{model_name_suffix}",
        f"controls+cohortFE{model_name_suffix}",
        f"all{model_name_suffix}"
    ]

    return result_list, model_names, key_variables
```

### 使用示例

```python
from marvel.AntPrint import ant_print_all, result_printer

# 定义要分析的因变量列表
y_variables = ['是否报案', '是否理赔', '累计报案次数']  # ← 替换为实际变量

all_results = {}

for i, y_var in enumerate(y_variables):
    y = regdata[y_var]                              # 因变量
    x = regdata['restrict']                         # 核心自变量
    control = regdata[['投保人年龄', '投保人性别', '城市级别']]  # 控制变量

    results, names, keys = run_regression_models(
        y_data=y,
        x_data=x,
        control_data=control,
        province_var=regdata['证件省份名称'],
        birth_year_var=regdata['被保人年龄'],       # 用年龄近似出生年份效应
        cluster_var=regdata['匿名化用户id'],
        model_name_suffix=f"_{i+1}"
    )

    all_results[y_var] = (results, names, keys)

    # 输出汇总表格
    ant_print_all(result_printer,
                  model_method="summary_col",
                  results=results,
                  model_names=names,
                  info_list=["rsquared", "nobs"],
                  regressor_order=keys,
                  drop_omitted=True)
```

### 模型规格说明

| 模型 | 包含内容 | 用途 |
|------|---------|------|
| `basic` | 核心自变量 + 常数项 | 基准效果 |
| `controls` | 核心 + 控制变量 | 控制混淆因素 |
| `FE` | 核心 + 省份FE + 出生队列FE | 固定效应基准 |
| `controls+provFE` | 核心 + 控制 + 省份FE | 地区固定效应 |
| `controls+cohortFE` | 核心 + 控制 + 出生队列FE | 队列固定效应 |
| `all` | 全部变量 + 两种FE | 最完整规格 |

---

## 模板2：完整分析工作流（读取 → 描述 → 回归 → 输出）

```python
import pandas as pd
import numpy as np
import statsmodels.api as sm
from marvel.AntPrint import ant_print_all, ant_read_data

# ===== 1. 读取数据 =====
df = ant_read_data('your_table')

# ===== 2. 数据概览 =====
ant_print_all(df, model_method="describe")
ant_print_all(df, model_method="describe",
              des=["shape", "columns", "dtypes"])

# ===== 3. 字段处理 =====
df["y_binary"] = (df["结果变量"] > 0).astype(int)
df["x_continuous"] = df["原始变量"].astype(float)

# ===== 4. 描述性统计 =====
ant_print_all(df[["y_binary", "x_continuous"]].corr())

# 按分组描述
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["分组变量"],
              cal_columns=["y_binary"],
              fun_list=["mean", "count"])

# ===== 5. 准备回归数据 =====
y = df['y_binary']
X = df[['x1', 'x2', 'x3']]
cluster_var = df['聚类变量']

# ===== 6. OLS 基准回归 =====
ols_result = sm.OLS(y, sm.add_constant(X)).fit(
    cov_type='cluster',
    cov_kwds={'groups': cluster_var}
)
ant_print_all(ols_result,
              model_attr=['params', 'pvalues', 'rsquared_adj'],
              model_method='summary')

# ===== 7. 多模型对比输出 =====
from marvel.AntPrint import result_printer

result2 = sm.OLS(y, sm.add_constant(pd.concat([X, df[['ctrl1', 'ctrl2']]], axis=1))).fit(
    cov_type='cluster', cov_kwds={'groups': cluster_var}
)

ant_print_all(result_printer,
              model_method="summary_col",
              results=[ols_result, result2],
              model_names=["(1)", "(2)"],
              stars=True,
              info_list=["rsquared_adj", "nobs"],
              drop_omitted=True)
```

---

## 模板3：PSM 完整分析流程

```python
import pandas as pd
import numpy as np
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot

# ===== 1. 读取数据 =====
df = ant_read_data('evaluation_data')
ant_print_all(df, model_method="describe")

# ===== 2. 分组 =====
test = df[df['treatment'] == 1]   # 处理组（较小）
control = df[df['treatment'] == 0] # 对照组（较大）

xvar = ['age', 'income', 'education', 'experience']
yvar = 'outcome'

# ===== 3. 初始化 PSM =====
model = PSM(test=test, control=control, xvar=xvar, yvar=yvar)

# ===== 4. 计算倾向得分 =====
model.calculate_pscore(covariates=xvar, method="probit")
ant_print_all(model.pscore_model, model_method="summary")

# ===== 5. 执行匹配 =====
model.match(nmatches=2, replacement=True, measure='pscore')

# ===== 6. 计算 ATT =====
ant_print_all(model, model_method="calculate_att")

# ===== 7. 平衡性检验 =====
print("=== 匹配前 ===")
model.match_quality(covariates=xvar, test_method="t", stage="before")
ant_print_all(model, model_attr="quality")

print("=== 匹配后 ===")
model.match_quality(covariates=xvar, test_method="t", stage="after")
ant_print_all(model, model_attr="quality")

# ===== 8. 绑制平衡图 =====
for x in xvar:
    model.plot_balance(covariates=x, stage="before")
    model.plot_balance(covariates=x, stage="after")

# ===== 9. 获取匹配样本用于后续分析 =====
test_idx, control_idx = model.get_indices(stage="after")
matched_test = test.iloc[test_idx]
matched_control = control.iloc[control_idx]

# 对匹配样本做后续回归等分析...
```
📎 PSM 详细指南 → `02-workflow/causal-inference.md`

---

## 模板4：面板数据完整工作流

```python
import pandas as pd
import numpy as np
import statsmodels.api as sm
import linearmodels as lm
from marvel.AntPrint import ant_print_all, ant_read_data

# ===== 1. 读取数据 =====
df = ant_read_data('panel_table')

# ===== 2. 描述性统计 =====
ant_print_all(df, model_method="describe")
ant_print_all(df, model_method="describe", des=["shape", "dtypes"])

# ===== 3. 设置面板结构 =====
df = df.set_index(['entity_id', 'time_id'])
y = df['dependent_var']
X = df[['x1', 'x2', 'x3']]

# ===== 4. OLS 基准（忽略面板结构）=====
ols_result = sm.OLS(y, sm.add_constant(X)).fit(
    cov_type='cluster', cov_kwds={'groups': df.index.get_level_values(0)}
)
ant_print_all(ols_result,
              model_attr=['params', 'pvalues', 'rsquared_adj'],
              model_method='summary')

# ===== 5. 面板 FE =====
fe_model = lm.PanelOLS(y, X,
                        entity_effects=True,
                        time_effects=True,
                        drop_absorbed=True)
fe_result = fe_model.fit(cov_type='clustered',
                         cluster_entity=True,
                         cluster_time=True)

ant_print_all(fe_result,
              model_attr=['params', 'pvalues', 'tstats', 'rsquared', 'nobs'],
              model_method='summary')
ant_print_all(fe_result, model_method='conf_int', level=0.95)

# ===== 6. 多模型对比 =====
from marvel.AntPrint import result_printer

re_model = lm.RandomEffects(y, X).fit()

ant_print_all(result_printer,
              model_method="summary_col",
              results=[ols_result, fe_result, re_model],
              model_names=["OLS", "FE", "RE"],
              stars=True,
              info_list=["rsquared", "nobs"],
              drop_omitted=True)
```
📎 更多面板示例 → `examples/panel-regression.py`
