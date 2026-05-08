# 因果推断

> PSM 倾向得分匹配、CausalModel、EconML 等因果推断方法的使用指南。

---

## 方法选择决策树

```
你的因果推断需求？
├── 有明确的处理组/对照组，想估计 ATE/ATT
│   ├── 观察数据，需要匹配 → PSM（倾向得分匹配）
│   ├── 观察数据，粗化精确匹配 → CEM
│   └── 观察数据，回归调整 → CausalModel
├── 有连续处理变量 / 异质性处理效应
│   └── 机器学习因果推断 → EconML (DML, XLearner, CausalForest)
├── 面板数据的政策评估
│   └── DID（双重差分）→ 用 PanelOLS 或 FixedEffect
└── 不确定？
    └── 从 PSM 开始（最常用、文档最全）
```

---

## 1. PSM（倾向得分匹配）— 最核心的因果推断工具

### 完整工作流

```python
from marvel.AntPrint.model import PSM
from marvel.AntPrint import ant_print_all, ant_read_data
import pandas as pd

# ===== Step 1: 准备数据 =====
df = ant_read_data('your_table')
test = df[df['treatment'] == 1]    # 处理组（数据量较小）
control = df[df['treatment'] == 0] # 对照组（数据量较大）

xvar = ['age', 'income', 'education']  # 协变量
yvar = 'outcome'                       # 因变量
```

### Step 2: 初始化模型

```python
model = PSM(test=test, control=control, xvar=xvar, yvar=yvar)
```

**⚠️ 重要约定**：
- `test` = 数据量**较小**的那一组（不一定是"实验组"）
- `control` = 数据量**较大**的那一组
- 匹配时从 control 中挑选样本去匹配 test

### Step 3: 计算倾向得分

```python
# 使用 Probit 模型计算倾向得分
model.calculate_pscore(covariates=xvar, method="probit")

# 输出倾向得分模型结果
ant_print_all(model.pscore_model, model_method="summary")

# 也可用 Logit
# model.calculate_pscore(covariates=xvar, method="logit")
```

### Step 4: 执行匹配

```python
# 方式A：最近邻匹配（最常用）
model.match(
    nmatches=2,           # 每个 test 样本匹配 2 个 control 样本
    replacement=True,     # 有放回（control 样本可被重复使用）
    radius=None,          # 无半径约束
    measure='pscore',     # 按倾向得分距离匹配
    scale=False,
    seed=0
)

# 方式B：带半径约束（卡尺匹配）
model.match(nmatches=2, replacement=True, radius=0.1, measure='pscore')

# 方式C：协变量距离匹配（注意维度诅咒！）
model.match(nmatches=1, replacement=True,
            measure='covariates', scale=True, radius=0.3)

# 方式D：核匹配（不选择特定样本，分配权重）
model.kernel_match(kernel="rbf")
```

### Step 5: 输出 ATT（平均处理效应）

```python
ant_print_all(model, model_method="calculate_att")
```

### Step 6: 平衡性检验（关键步骤！）

```python
# 匹配前后的 t 检验比较
model.match_quality(covariates=xvar, test_method="t", stage="before")
ant_print_all(model, model_attr="quality")

model.match_quality(covariates=xvar, test_method="t", stage="after")
ant_print_all(model, model_attr="quality")

# 也可用秩和检验
# model.match_quality(covariates=xvar, test_method="rank", stage="after")
```

### Step 7: 绑制平衡图

```python
from marvel.AntPrint import ant_plot

for x in xvar:
    # 匹配前分布
    model.plot_balance(covariates=x, stage="before")
    # 匹配后分布
    model.plot_balance(covariates=x, stage="after")
```

### Step 8: 获取匹配样本

```python
test_indices, control_indices = model.get_indices(stage="after")
matched_test = test.iloc[test_indices]
matched_control = control.iloc[control_indices]

# 获取权重（核匹配时有用）
test_weight = model.test_weight
control_weight = model.control_weight
```

---

## PSM 方法速查表

| 方法 | 说明 | 返回 |
|------|------|------|
| `calculate_pscore(covariates, method)` | 计算倾向得分 | self (PSM对象) |
| `set_pscore(test_ps, control_ps)` | 设置自定义倾向得分 | self |
| `match(nmatches, replacement, radius, measure, scale, seed)` | 执行匹配 | self |
| `kernel_match(kernel)` | 核匹配 | self |
| `get_indices(stage)` | 获取匹配样本索引 | (test_idx, control_idx) |
| `plot_balance(covariates, stage)` | 绑制平衡图 | - |
| `match_quality(covariates, test_method, stage)` | 平衡性检验 | DataFrame (P值) |

### match 参数详解

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nmatches` | int | 1 | 每个 test 样本匹配数 |
| `replacement` | bool | True | 是否有放回 |
| `radius` | float/None | None | 匹配半径（None=无约束） |
| `measure` | str | "pscore" | "pscore"或"covariates" |
| `scale` | bool | False | 是否标准化（协变量匹配时建议True） |
| `seed` | int | 0 | 随机种子 |

### ⚠️ 注意事项

1. **无放回匹配远慢于有放回匹配**
2. **协变量匹配存在维度诅咒** — 协变量越多越慢
3. **`get_indices` 返回的是位置索引（iloc），不是标签索引（loc）**
4. **test 是数据量小的组**，不是传统意义上的"实验组"

📎 完整 PSM 示例 → `examples/psm-example.py`

---

## 2. CausalModel（因果推断库）

```python
from causalinference import CausalModel

causal = CausalModel(Y, D, X)       # Y=结果, D=处理, X=协变量
causal.est_via_matching()            # 匹配法估计

ant_print_all(causal, model_attr="summary_stats")
ant_print_all(causal, model_attr="estimates")
```

---

## 3. EconML（机器学习因果推断）

```python
from econml.dml import DML, LinearDML, NonParamDML, CausalForestDML, SparseLinearDML
from econml.metalearners import XLearner, TLearner

# 双重机器学习 (DML)
est = DML(model_y=model_y, model_t=model_t, model_final=model_final)
est.fit(Y=Y, T=T, X=X)

# 输出平均处理效应
ant_print_all(est, X, model_method="ate")

# 输出处理效应推断
ant_print_all(est, X, model_method="ate_inference")
```

### EconML 方法

| 方法 | 说明 |
|------|------|
| `ate(X)` | 平均处理效应 (ATE) |
| `ate_inference(X)` | 处理效应推断（含置信区间） |
| `score()` | 模型得分 |

---

## 4. CEM（粗化精确匹配）

```python
from cem import CEM

c = CEM(data, treatment, outcome)
ant_print_all(c, model_attr="outcome")        # 匹配结果
ant_print_all(c, model_attr="H")              # H值
ant_print_all(c, model_method="imbalance")    # 不平衡度量
```

---

## 📖 深入阅读
- PSM 完整 API → `03-reference/model-api-catalog.md`（PSM 部分）
- PSM 示例代码 → `examples/psm-example.py`
- 错误排查 → `04-patterns/error-troubleshooting.md`
