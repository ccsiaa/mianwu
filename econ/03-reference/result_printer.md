# 多模型聚合输出（result_printer）

> 类似 Stata `outreg2` / `esttab` 的功能，将多个回归模型的结果汇总到一个表格中。
> 这是经济学论文写作中最常用的输出功能之一。

---

## 基本用法

### 导入

```python
from marvel.AntPrint import ant_print_all, result_printer
```

### 最简示例

```python
import statsmodels.api as sm

# 运行多个模型
y = data['lwage']
x1 = data[['year', 'married']]
result1 = sm.OLS(y, x1).fit()

x2 = data[['year', 'married', 'black']]
result2 = sm.OLS(y, x2).fit()

# 聚合输出为一张表格
ant_print_all(result_printer,
              model_method="summary_col",
              results=[result1, result2],
              model_names=["model1", "model2"])
```

---

## summary_col 完整参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `results` | list | **必需** | 模型结果列表（OLS/Logit/Probit/PanelOLS 等） |
| `float_format` | str | `'%.2f'` | 输出小数点位数 |
| `model_names` | list | `None` | 模型名称列表，为空则自动分配 (1)(2)(3)... |
| `stars` | bool | `True` | 是否按显著性标星 (* p<0.1, ** p<0.05, *** p<0.01) |
| `info_list` | list | `["rsquared", "nobs"]` | 表格底部显示的统计量 |
| `info_dict` | dict | `None` | 通过函数字典配置自定义统计量 |
| `info_order` | list | `None` | 指定底部统计量的显示顺序 |
| `info_bracket` | str | `"std_errors"` | 括号内显示内容：`"std_errors"` 或 `"tstats"` |
| `regressor_order` | list | `None` | 自变量输出顺序（控制表格行的排列） |
| `drop_omitted` | bool | `False` | 是否省略不在 regressor_order 中的自变量 |

### 支持的模型类型

- ✅ `statsmodels`: OLS, GLM, Probit, Logit, MNLogit 等
- ✅ `linearmodels`: PanelOLS, IV2SLS, RandomEffects 等
- ❌ 不支持: PSM, Heckman, OrderedModel 等自定义模型

---

## 高级用法示例

### 1. 控制变量顺序 + 隐藏部分变量

```python
ant_print_all(result_printer,
              model_method="summary_col",
              results=[result1, result2, result3],
              model_names=["(1)", "(2)", "(3)"],
              regressor_order=["year", "black"],   # 只显示这两个变量
              drop_omitted=True)                    # 隐藏其他变量
```

### 2. 自定义底部统计量

```python
ant_print_all(result_printer,
              model_method="summary_col",
              results=[result1, result2, result3],
              model_names=["(1)", "(2)", "(3)"],
              regressor_order=["year", "black"],
              drop_omitted=True,
              info_list=["rsquared"],               # 只保留 R²
              info_dict={"样本量": lambda x: x.nobs},  # 自定义：显示样本量
              info_order=["rsquared", "样本量"])      # 控制顺序
```

### 3. Logit/Probit 模型汇总

```python
# 运行多个 Logit 模型
model1 = sm.Probit(y, X1).fit(disp=0)
model2 = sm.Probit(y, X2).fit(disp=0)

# 推荐：用 summary_col 输出原始系数（而非边际效应）
ant_print_all(result_printer,
              model_method="summary_col",
              results=[model1, model2],
              model_names=["(1)", "(2)"],
              stars=True,
              info_list=["nobs", "prsquared"])       # 显示观测数和伪R²
```

⚠️ **Logit/Probit 边际效应注意**：
- `DiscreteMargins` 对象（`get_margeff()` 返回值）属性是 numpy 数组，难以格式化
- **推荐**使用 `summary_col` 输出原始系数
- 如确需边际效应，可单独输出：
  ```python
  margeff = model.get_margeff(at="mean")
  ant_print_all(margeff, model_method="summary")
  ```

### 4. 过滤无效模型

```python
# 当某些模型可能拟合失败时
valid_models = [m for m in results if m is not None]
valid_names = [model_names[i] for i, m in enumerate(results) if m is not None]

ant_print_all(result_printer,
              model_method="summary_col",
              results=valid_models,
              model_names=valid_names,
              stars=True,
              info_list=["nobs", "rsquared"])
```

### 5. 配合多模型回归模板使用

> 📐 通用回归模板 → `04-patterns/code-templates.md`

```python
# 使用 code-templates.py 中的 run_regression_models 函数
results, names, keys = run_regression_models(
    y_data=y, x_data=x, control_data=controls,
    province_var=df['province'], birth_year_var=df['birth_year'],
    cluster_var=df['user_id']
)

# 用 result_printer 输出汇总表
ant_print_all(result_printer,
              model_method="summary_col",
              results=results,
              model_names=names,
              info_list=["rsquared", "nobs"],
              regressor_order=keys,
              drop_omitted=True)
```

---

## 常用 info_list 统计量

| 统量名 | 适用模型 | 说明 |
|--------|---------|------|
| `rsquared` | OLS, PanelOLS | R² |
| `rsquared_adj` | OLS | 调整R² |
| `nobs` | 所有 | 观测数 |
| `prsquared` | Logit, Probit | 伪R² (Pseudo R²) |
| `llf` | 所有 | 对数似然值 |
| `aic` | 所有 | AIC |
| `bic` | 所有 | BIC |
| `F` | OLS | F统计量 |
| `Durbin-Watson` | OLS | DW统计量 |
| `Jarque-Bera` | OLS | JB正态检验 |

自定义统计量通过 `info_dict` 传入 lambda 函数：
```python
info_dict={
    "N": lambda x: x.nobs,
    "R²": lambda x: x.rsquared,
}
```
