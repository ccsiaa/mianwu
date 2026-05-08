# 倾向得分匹配（PSM）示例

## 基本PSM流程

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all, ant_read_data
import pandas as pd
import numpy as np

# 读取或准备数据
df = ant_read_data('treatment_data')

# 分为处理组和对照组
test = df[df['treatment'] == 1]
control = df[df['treatment'] == 0]

# 定义变量
xvar = ['age', 'income', 'education']
yvar = 'outcome'

# 初始化PSM模型
model = PSM(test=test, control=control, xvar=xvar, yvar=yvar)

# 使用probit计算倾向得分
model.calculate_pscore(covariates=xvar, method="probit")

# 输出倾向得分模型结果
ant_print_all(model.pscore_model, model_method="summary")

# 执行1对2最近邻匹配（有放回）
model.match(nmatches=2, replacement=True, radius=None, measure='pscore', scale=False)

# 计算处理组平均处理效应（ATT）
ant_print_all(model, model_method="calculate_att")

# 获取匹配样本索引
test_indices, control_indices = model.get_indices(stage="after")
selected_test = test.iloc[test_indices]
selected_control = control.iloc[control_indices]
```

## 带协变量匹配的PSM

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all

# 初始化模型
model = PSM(test=test_df, control=control_df, xvar=['x1', 'x2', 'x3'], yvar='y')

# 计算倾向得分
model.calculate_pscore(covariates=['x1', 'x2', 'x3'], method="logit")

# 使用标准化协变量距离匹配
# 注意：协变量匹配建议设置scale=True
model.match(nmatches=1, replacement=False, radius=0.3,
            measure='covariates', scale=True, seed=0)

# 计算ATT
ant_print_all(model, model_method="calculate_att")
```

## 带平衡性诊断的PSM

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all

# 初始化并拟合
model = PSM(test=test, control=control, xvar=xvar, yvar='y')
model.calculate_pscore(covariates=xvar, method="probit")
model.match(nmatches=2, replacement=True)

# 绑制匹配前协变量平衡图
for x in xvar:
    model.plot_balance(covariates=x, stage="before")

# 绑制匹配后协变量平衡图
for x in xvar:
    model.plot_balance(covariates=x, stage="after")

# 平衡性统计检验（t检验）
model.match_quality(covariates=xvar, test_method="t", stage="before")
ant_print_all(model, model_attr="quality")

model.match_quality(covariates=xvar, test_method="t", stage="after")
ant_print_all(model, model_attr="quality")

# 备选：秩和检验
model.match_quality(covariates=xvar, test_method="rank", stage="after")
ant_print_all(model, model_attr="quality")
```

## 核匹配

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all

# 初始化模型
model = PSM(test=test, control=control, xvar=xvar, yvar='y')
model.calculate_pscore(covariates=xvar, method="probit")

# 核匹配（RBF核）
model.kernel_match("rbf")

# 计算ATT
ant_print_all(model, model_method="calculate_att")

# 获取权重
test_weight, control_weight = model.test_weight.copy(), model.control_weight.copy()

# 归一化权重
test_weight /= test_weight.sum()
control_weight /= control_weight.sum()

# 使用权重进行后续分析
# 例如：加权回归
```

## 完整PSM分析示例

```python
import pandas as pd
import numpy as np
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all, ant_read_data, ant_plot

# 1. 读取数据
df = ant_read_data('evaluation_data')

# 2. 查看描述性统计
ant_print_all(df, model_method="describe")

# 3. 定义分组
test = df[df['treated'] == 1]
control = df[df['treated'] == 0]

xvar = ['age', 'tenure', 'prior_income', 'education_level']
yvar = 'post_income'

# 4. 初始化PSM
model = PSM(test=test, control=control, xvar=xvar, yvar=yvar)

# 5. 计算倾向得分
model.calculate_pscore(covariates=xvar, method="probit")
ant_print_all(model.pscore_model, model_method="summary")

# 6. 执行匹配
model.match(nmatches=2, replacement=True, radius=None, measure='pscore')

# 7. 计算ATT
ant_print_all(model, model_method="calculate_att")

# 8. 检查平衡性
print("=== 匹配前平衡性 ===")
model.match_quality(covariates=xvar, test_method="t", stage="before")
ant_print_all(model, model_attr="quality")

print("=== 匹配后平衡性 ===")
model.match_quality(covariates=xvar, test_method="t", stage="after")
ant_print_all(model, model_attr="quality")

# 9. 绑制各协变量平衡图
for x in xvar:
    model.plot_balance(covariates=x, stage="before")
    model.plot_balance(covariates=x, stage="after")

# 10. 获取匹配样本
test_idx, control_idx = model.get_indices(stage="after")
matched_test = test.iloc[test_idx]
matched_control = control.iloc[control_idx]

# 11. 对匹配样本进行后续分析
# 示例：简单比较
ant_print_all(matched_test[[yvar]], model_method="describe")
ant_print_all(matched_control[[yvar]], model_method="describe")
```

## 带半径约束的PSM

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all

model = PSM(test=test, control=control, xvar=xvar, yvar='y')
model.calculate_pscore(covariates=xvar, method="probit")

# 仅在半径（卡尺）内匹配
# 超出半径的样本将不会被匹配
model.match(nmatches=2, replacement=True, radius=0.1, measure='pscore')

ant_print_all(model, model_method="calculate_att")
```

## PSM重要说明

1. **匹配方法**：
   - `measure='pscore'`：按倾向得分距离匹配
   - `measure='covariates'`：按标准化协变量距离匹配

2. **使用协变量匹配时**：
   - 设置 `scale=True` 确保变量在同一尺度
   - 注意"维度诅咒"——协变量越多匹配越慢

3. **有放回匹配**：
   - `replacement=True`：对照组样本可被多次匹配
   - `replacement=False`：每个对照组样本仅使用一次

4. **半径（卡尺）**：
   - `radius=None`：无约束
   - `radius=0.1`：仅在0.1距离内匹配

5. **核匹配**：
   - 不选择特定样本
   - 为所有样本分配权重
   - 使用 `test_weight` 和 `control_weight` 属性
