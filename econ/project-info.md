# 项目特定信息

> ⚠️ **本文档包含项目专属信息，换项目时需要修改 A/B/C 区域。D 区为通用模板通常不需要改。**

---

<!-- ============================================================ -->
<!-- === A. 研究背景（换项目时修改此区）=== -->
<!-- ============================================================ -->

## 研究背景

### 论文信息
- **标题**：AI-Driven Coverage Caps and Moral Hazard Reduction: Evidence from a BigTech Insurance Platform
- **研究问题**：AI驱动的个性化保额上限如何影响保险市场中的逆向选择和道德风险

### 研究场景
- **平台**：支付宝（Alipay）意外险产品
- **样本量**：259,552份保单（2023年全年）
- **政策实施时间**：2023年5月开始实施AI个性化保额上限
- **核心机制**：AI算法根据用户数字足迹生成个性化最高保额上限，用户可选择任意保额但不能超过上限，保费保持精算公平

### 理论框架
模型包含两个核心要素：
1. **异质性基准风险（Adverse Selection）**：用户类型 $k$ 代表努力成本，高风险用户努力成本更高
2. **努力选择（Moral Hazard）**：用户选择预防努力 $e$，影响事故概率 $p(e)=p_0-\beta e$

**核心预测**：
- 保额上限会选择性地约束高风险用户
- 被约束用户有更强的预防激励（"skin in the game"效应）
- 总体事故率下降

### 核心假设

**假设1：总体安全增益（Aggregate Safety Gain）**
$$\bar{\pi}_{\text{cap}} < \bar{\pi}_{\text{no}}$$
实施保额上限后，平台整体事故率下降。

**假设2：个体层面的对立机制**

*选择效应（Selection Effect）*：被限制用户本身是高风险类型
$$\Pr(\text{Accident} \mid \alpha = \overline{\alpha}(s)) > \Pr(\text{Accident} \mid \alpha < \overline{\alpha}(s))$$

*行为效应（Behavioral Effect）*：被限制用户因保障不足而增加预防努力
$$\Pr(\text{Accident} \mid \alpha = \overline{\alpha}(s)) < \Pr(\text{Accident} \mid \alpha < \overline{\alpha}(s))$$

两个效应方向相反，净效应需实证检验。

### 实证结果摘要

#### 1. 总体事故率变化
| 指标 | 实施前 | 实施后 | 变化 |
|------|--------|--------|------|
| 总体事故率 | 2.61% | 2.35% | **-11.29%** |
| 100万保额 | 2.53% | 2.14% | -18.44% |
| 50万保额 | 3.29% | 2.71% | -21.69% |
| 10万保额 | 2.15% | 2.16% | +0.75% |

#### 2. 被限制 vs 未被限制用户对比（实施后）
| 保额 | 未被限制 | 被限制 | 差异 |
|------|----------|--------|------|
| 50万 | 2.86% | 2.52% | **-13.51%** |
| 10万 | 1.94% | 3.39% | **+42.64%** |

**结论**：行为效应在高保额群体中占主导，选择效应在低保额群体中更明显。

#### 3. 保额分布变化
**实施前**（仅实际保额）：100万: 5,177人 | 50万: 6,072人 | 10万: 7,690人

**实施后**（实际保额 vs 预测保额）：
| 实际\预测 | 10万 | 50万 | 100万 | 合计 |
|-----------|------|------|-------|------|
| 10万 | 13,114 | 41,268 | 31,702 | 86,084 |
| 50万 | - | 30,240 | 35,301 | 65,541 |
| 100万 | - | - | 30,845 | 30,845 |

### 关键变量定义

| 变量 | 定义 | 说明 |
|------|------|------|
| `post` | 是否有预测保额 | =1表示实施后（有AI预测保额） |
| `y_predcov` | 预测保额 | AI算法生成的保额上限 |
| `y_actcov` | 实际保额 | 用户实际购买的保额 |
| `restrict` | 是否被限制 | =1表示实际保额=预测保额（触及上限） |
| `是否报案`/`是否理赔` | Y变量 | 结果变量 |

---

<!-- ============================================================ -->
<!-- === B. 数据字典（换项目时修改此区）=== -->
<!-- ============================================================ -->

## 数据表概览

| 表名变量 | 表内容 | 表名 |
|----------|--------|------|
| T_POLICY | 表单及用户基本信息 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_risk_qt_vplc_twy_sp_202507ext_ds_1 |
| T_PORTRAIT | 用户画像 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_portrait_1 |
| T_INV1 | 基金交易行为1 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_investment_1 |
| T_INV2 | 基金交易行为2 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_investment_2 |
| T_CONS1 | 消费 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_consumption_1 |
| T_GREEN | 蚂蚁森林 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_green_csr_1 |
| T_VISIT | 访问次数 | frlab_sample_adm_res_app_dnest_project_202411180042519911010004_visit_1 |

### 表1：T_POLICY — 表单及用户基本信息

#### 主键与用户标识
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户唯一标识 |
| 加密后保单信息_表的唯一主键 | 保单唯一主键 |

#### 保单基本信息
| 字段名 | 说明 |
|--------|------|
| 赔案保单产品ID | 产品ID |
| 产品名称 | 产品名称 |
| 出单时间 | 出单时间 |
| 保单起期/止期 | 生效/终止日期 |
| 保单状态 | 保单状态 |
| 年化保费 | 年化保费 |
| 缴费频率 | 缴费频率 |

#### 投保人/被保人信息
| 字段名 | 说明 |
|--------|------|
| 投保人性别 | F/M |
| 投保人年龄 | 年龄 |
| 被保人与投保人关系 | 本人/配偶/父母/子女等 |
| 被保人常驻地城市级别分层 | 城市级别 |

#### 保额与理赔信息
| 字段名 | 说明 |
|--------|------|
| 最大可展示保额_单位元 | 预测保额（y_predcov） |
| 保单身故保额_单位元 | 实际保额（y_actcov） |
| 历史至今报案案件数 | 累计报案次数 |
| 历史至今理赔数 | 累计理赔次数 |
| 最早/最晚出险日期 | 出险日期范围 |

### 表2：T_VISIT — 访问次数
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 最近一个月登录支付宝客户端次数/天数 | 登录数据 |
| 支付宝主页/蚂蚁森林/蚂蚁庄园/财富tab页访问次数 | 各模块访问 |
| 日期 | 2023.01-2023.12 月度 |

### 表3：T_GREEN — 蚂蚁森林
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 历史至今种树棵树 | 累计种树数 |
| 当月捐赠笔数 | 当月捐赠 |
| 日期 | 日期 |

### 表4：T_PORTRAIT — 用户画像
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 年龄/性别/风险等级/职业信息 | 基本信息 |
| 常驻省/市名称/区划代码 | 地域信息 |
| 证件省份/城市名称 | 证件信息 |
| 日期 | 日期 |

### 表5：T_INV1 — 基金交易行为
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 当月月底持有基金数量 | 持仓 |
| 当月定投/主动购买申购(笔数/金额/基金数) | 申购 |
| 当月赎回(笔数/金额/基金数) | 赎回 |
| 日期 | 日期 |

### 表6：T_CONS1 — 消费
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 消费金额/线下支付/电子现金/货币基金/借记卡/信用卡/互联网消费信贷支付金额_元 | 各渠道消费 |
| 日期 | 日期 |

### 表7：T_INV2 — 资产存量
| 字段名 | 说明 |
|--------|------|
| 匿名化用户id | 用户ID |
| 当月月底理财总资产/宝类/混合/偏债/指数/偏股/非宝类货币基金资产 | 各类资产 |
| 日期 | 日期 |

---

<!-- ============================================================ -->
<!-- === C. 数据处理代码（换项目时修改此区）=== -->
<!-- ============================================================ -->

## 数据处理代码

### 完整初始化代码

```python
# ===== 依赖 =====
import pandas as pd
import numpy as np
import statsmodels.api as sm
from marvel.AntPrint import ant_print_all, ant_read_data

# ===== 表名 =====
T_POLICY   = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_risk_qt_vplc_twy_sp_202507ext_ds_1"
T_PORTRAIT = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_portrait_1"
T_INV1     = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_investment_1"
T_INV2     = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_investment_2"
T_CONS1    = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_consumption_1"
T_GREEN    = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_green_csr_1"
T_VISIT    = "frlab_sample_adm_res_app_dnest_project_202411180042519911010004_visit_1"

# ===== 基础字段处理 =====
df = ant_read_data(T_POLICY)
USER_COL = "匿名化用户id"

# 是否本人投保（本人=1）
df["是否本人投保"] = (
    df["被保人与投保人关系_本人_配偶_父母_配偶父母_子女_其他_雇员"] == "本人"
).astype(int)

# 出单时间
df["出单时间"] = pd.to_datetime(df["出单时间"])

# 性别（F=1, M=0）
df["投保人性别"] = (df["投保人性别"] == "F").astype(int)

# 年龄
df["投保人年龄"] = df["投保人年龄"].astype(int)

# post（是否有预测保额）
df["post"] = df["最大可展示保额_单位元"].notna().astype(int)

# 预测保额
df["y_predcov"] = df["最大可展示保额_单位元"].astype(float)

# 实际保额
df["y_actcov"] = df["保单身故保额_单位元"].astype(float)

# 是否被限制（实际=预测）
df["restrict"] = (df["y_actcov"] == df["y_predcov"]).astype(int)

# y变量
df["是否报案"] = (df["历史至今报案案件数"] > 0).astype(int)
df["累计报案次数"] = df["历史至今报案案件数"].astype(int)
df["是否理赔"] = (df["历史至今理赔数"] > 0).astype(int)
df["累计理赔次数"] = df["历史至今理赔数"].astype(int)

# ===== 样本筛选 =====
cond_self = df["是否本人投保"] == 1           # 只保留本人投保
cond_amount = df["y_actcov"] <= 1_000_000      # 剔除异常大额（>100万）
cond_post_valid = (df["post"] == 0) | (df["y_actcov"] <= df["y_predcov"])  # post样本中剔除异常

df = df[cond_self & cond_amount & cond_post_valid].copy()
```

### 样本筛选规则总结
1. **只保留被保人=本人**
2. **剔除异常大额**：实际保额 > 100万元
3. **剔除post样本中的异常**：实际保额 > 预测保额

---

<!-- ============================================================ -->
<!-- === D. 通用回归模板（通常不需要修改）=== -->
<!-- ============================================================ -->

## 通用多模型回归函数

> 📐 此模板为通用框架，**变量名仅为示例，使用时需替换为项目实际变量**。
> 详细说明 → `04-patterns/code-templates.md`

```python
def run_regression_models(y_data, x_data, control_data,
                          province_var, birth_year_var, cluster_var,
                          model_name_suffix=""):
    """
    运行6个回归模型并返回结果

    参数:
        y_data: 因变量
        x_data: 自变量
        control_data: 控制变量DataFrame
        province_var: 省份变量（用于省份固定效应）
        birth_year_var: 出生年份变量（用于出生队列固定效应）
        cluster_var: 聚类变量
        model_name_suffix: 模型名称后缀
    """
    # 准备固定效应
    province_dummies = pd.get_dummies(province_var, prefix='prov', drop_first=True)
    birth_cohort = (birth_year_var // 10) * 10
    cohort_dummies = pd.get_dummies(birth_cohort, prefix='cohort', drop_first=True)

    # 模型1：不加任何控制变量
    x_basic = sm.add_constant(x_data)
    model1 = sm.OLS(y_data, x_basic).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型2：添加控制变量
    x_controls = sm.add_constant(pd.concat([x_data, control_data], axis=1))
    model2 = sm.OLS(y_data, x_controls).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型3：不加控制变量，只加两个固定效应
    x_fe_only = sm.add_constant(pd.concat([x_data, province_dummies, cohort_dummies], axis=1))
    model3 = sm.OLS(y_data, x_fe_only).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型4：添加控制变量和省份固定效应
    x_prov = sm.add_constant(pd.concat([x_data, control_data, province_dummies], axis=1))
    model4 = sm.OLS(y_data, x_prov).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型5：添加控制变量和出生队列固定效应
    x_cohort = sm.add_constant(pd.concat([x_data, control_data, cohort_dummies], axis=1))
    model5 = sm.OLS(y_data, x_cohort).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 模型6：全添加
    x_full = sm.add_constant(pd.concat([x_data, control_data, province_dummies, cohort_dummies], axis=1))
    model6 = sm.OLS(y_data, x_full).fit(cov_type='cluster', cov_kwds={'groups': cluster_var})

    # 准备关键变量列表（决定表格输出哪些行）
    key_variables = [x_data.name] + control_data.columns.tolist() + ['const']

    return [model1, model2, model3, model4, model5, model6], [
        f"basic{model_name_suffix}", f"controls{model_name_suffix}",
        f"FE{model_name_suffix}", f"controls+provFE{model_name_suffix}",
        f"controls+cohortFE{model_name_suffix}", f"all{model_name_suffix}"
    ], key_variables
```

### 使用示例

```python
y_variables = ['因变量1', '因变量2', '因变量3']  # ← 替换为实际的Y变量

for i, y_var in enumerate(y_variables):
    y = regdata[y_var]
    x = regdata['自变量']
    control = regdata[['控制变量1', '控制变量2']]

    results, names, keys = run_regression_models(
        y, x, control,
        regdata['省份变量'], regdata['出生年份变量'],
        regdata['聚类变量'],
        model_name_suffix=f"_{i+1}"
    )

    ant_print_all(result_printer, model_method="summary_col",
                  results=results, model_names=names,
                  info_list=["rsquared", "nobs"],
                  regressor_order=keys, drop_omitted=True)
```
