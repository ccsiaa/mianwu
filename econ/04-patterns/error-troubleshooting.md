# 错误排查中心

> 按错误信息/症状快速定位原因和解决方案。
> 所有错误的根因规则 → `01-rules/`

---

## 🔍 按错误信息搜索

---

### "Warning: The row count of the dataframe after 'groupby' only return the top 20 rows"

**症状**：`describe_by_discrete` 或 `describe_by_continuous` 输出被截断，试运行产生 Warning

**原因**：分组后的行数超过 20 行限制

**解决**：
1. 减少分组变量数量
2. 将 `cal_columns` 拆分成多次调用
3. 预估行数：`行数 = 分组数 × 计算列数 × 函数数`

```python
# ❌ 危险
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别", "月份"],
              cal_columns=["是否报案", "是否理赔"],
              fun_list=["sum"])

# ✅ 正确：拆分调用
ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否报案"],
              fun_list=["sum"])

ant_print_all(df, model_method="describe_by_discrete",
              group_by_columns=["城市级别"],
              cal_columns=["是否理赔"],
              fun_list=["sum"])
```

📖 详细安全指南 → `01-rules/output-limits.md`

---

### "ValueError: No file exist" / 数据表不存在

**症状**：`ant_read_data()` 报错，提示文件不存在

**原因**：当前处于**仿真环境**，没有真实数据表

**解决**：添加环境判断

```python
from marvel.AntPrint.sandbox.global_constant import envir

if envir() == '仿真环境':
    ant_print_all(pd.DataFrame({"提示": ["仿真环境，跳过数据读取"]}))
else:
    df = ant_read_data('your_table_name')
    # ... 后续代码 ...
```

📖 环境处理详解 → `01-rules/environment.md`

---

### `print()` 被禁用 / 输出为空

**症状**：代码中使用 `print()` 无输出或报错

**原因**：平台禁用了标准 `print()` 函数

**解决**：全部替换为 `ant_print_all()`

```python
# ❌ 错误
print("Hello")
print(df.head())
print(result.summary())

# ✅ 正确
ant_print_all(pd.DataFrame({"msg": ["Hello"]}))
ant_print_all(df, model_method="describe")
ant_print_all(result, model_method='summary')
```

📖 硬性约束 → `01-rules/hard-constraints.md`

---

### matplotlib/seaborn 绑图无输出

**症状**：使用 `plt.plot()`, `sns.scatterplot()` 等绑图函数无任何输出

**原因**：平台禁用了直接调用 matplotlib/seaborn 绑图

**解决**：使用 `ant_plot` 系统

```python
# ❌ 错误
import matplotlib.pyplot as plt
plt.scatter(x, y)
plt.show()

# ✅ 正确
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=data, method="ant_plot_df", kind="scatter",
              x="col1", y="col2")
ant_plot.show()
```

📖 ant_plot 使用指南 → `02-workflow/visualization.md`

---

### groupby + value_counts 不工作

**症状**：`ant_print_all(df.groupby("x")["y"].value_counts())` 无法正常输出

**原因**：平台不支持直接输出 groupby 对象的链式操作结果

**解决**：使用 `describe_by_discrete` 替代

```python
# ❌ 错误
ant_print_all(df.groupby("x")["y"].value_counts())

# ✅ 正确
ant_print_all(df,
              model_method="describe_by_discrete",
              group_by_columns=["x"],
              cal_columns=["y"],
              fun_list=["sum"])
```

📖 描述性统计指南 → `02-workflow/descriptive-stats.md`

---

### Probit/Logit 边际效应输出异常

**症状**：`model.get_margeff()` 返回的 `DiscreteMargins` 对象无法正确格式化输出

**原因**：`margeff.margeff`, `margeff.se` 等属性是 numpy 数组，无 `.index` / `.names` 属性

**解决（推荐）**：使用 `result_printer.summary_col` 输出原始系数

```python
from marvel.AntPrint import result_printer

model1 = sm.Probit(y, X1).fit(disp=0)
model2 = sm.Probit(y, X2).fit(disp=0)

# 推荐：输出原始系数表格
ant_print_all(result_printer,
              model_method="summary_col",
              results=[model1, model2],
              model_names=["(1)", "(2)"],
              stars=True,
              info_list=["nobs", "prsquared"])

# 如确需边际效应，单独输出
margeff = model.get_margeff(at="mean")
ant_print_all(margeff, model_method="summary")
```

📖 result_printer 完整用法 → `03-reference/result_printer.md`

---

### value_counts 超过 100 行

**症状**：离散变量取值过多导致 `value_counts` 超过 100 行限制

**解决**：
- 先筛选数据减少类别数
- 或使用 `describe_by_continuous` 对连续变量分箱统计

```python
# ❌ 可能超限（如用户ID有数千个唯一值）
ant_print_all(df["匿名化用户id"], model_method="value_counts")

# ✅ 方案1：用分箱替代
ant_print_all(df,
              model_method="describe_by_continuous",
              group_by_columns=["投保人年龄"],
              cal_columns=["年化保费"],
              q=5, cut_strategy="quantile",
              fun_list=["count"])

# ✅ 方案2：先筛选
ant_print_all(df[df["城市级别"]=="一线城市"]["用户ID"], model_method="value_counts")
```

---

### PanelOLS 报错 "columns contain duplicate values"

**症状**：PanelOLS 建模时报列名重复错误

**原因**：面板数据索引设置后，X 中存在与索引同名的列，或存在常数列未被处理

**解决**：
```python
df = df.set_index(['entity_id', 'time_id'])
y = df['y']
X = df[['x1', 'x2', 'x3']]   # 确保不包含索引列

model = lm.PanelOLS(y, X, entity_effects=True,
                    time_effects=True, drop_absorbed=True)  # 自动吸收共线性
result = model.fit(...)
```

---

### PSM 匹配速度极慢

**症状**：PSM `match()` 执行时间过长

**原因**：
1. 使用了无放回匹配 (`replacement=False`) — 远慢于有放回
2. 使用协变量距离匹配 (`measure='covariates'`) 且协变量多 — 维度诅咒

**解决**：
```python
# 改为有放回匹配（速度快很多）
model.match(nmatches=2, replacement=True, measure='pscore')

# 如果必须用协变量匹配，减少协变量数量
model.match(nmatches=1, replacement=True,
            measure='covariates', scale=True,
            radius=0.3)  # 加半径约束减少计算量
```

📖 PSM 完整指南 → `02-workflow/causal-inference.md`

---

### ant_plot show() 后再绑图无输出

**症状**：第一次绑图成功，第二次绑图没有任何输出

**原因**：`show()` 后画布被重置，需要重新执行完整的 4 步流程

**解决**：

```python
# ===== 第一张图 =====
ant_plot.re_init()
ant_plot.add_subplot()
ant_plot.plot(df=data, kind="scatter", x="x1", y="y1")
ant_plot.show()

# ===== 第二张图（必须重新初始化全部）=====
ant_plot.re_init()          # 必须重新 init
ant_plot.add_subplot()      # 必须重新 add_subplot
ant_plot.plot(df=data, kind="line", x="x2", y="y2")
ant_plot.show()
```

---

## 🆘 排查步骤（通用）

如果遇到未列出的错误，按以下顺序排查：

```
1. 是否使用了 print() 或 matplotlib？           → 是 → 替换为 ant_print_all / ant_plot
2. 是否在仿真环境访问了数据表？                 → 是 → 添加 envir() 判断
3. 输出行数是否超过限制？                       → 是 → 查看 output-limits.md
4. model_attr 和 model_method 是否混淆了？     → 是 → attr 不带括号，method 带括号
5. 包是否在可用列表中？                         → 否 → 更换方案或查看 packages.md
6. 以上都不是？                                 → 检查 Python 3.8.6 语法兼容性
```
