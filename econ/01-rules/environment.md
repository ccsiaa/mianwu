# 环境判断与兼容处理

> 平台有**仿真环境**和**真实环境**两种模式，数据表和部分功能在仿真环境中不可用。

---

## 环境类型

| 环境 | 特点 | 数据表 | 用途 |
|------|------|--------|------|
| **仿真环境** | 无真实数据，用于代码调试 | ❌ 大多不存在 | 测试代码逻辑 |
| **真实环境** | 有完整项目数据 | ✅ 可用 | 正式运行分析 |

---

## 如何判断当前环境

```python
from marvel.AntPrint.sandbox.global_constant import envir, print_envir

# 获取当前环境名称
current_env = envir()  # 返回: '仿真环境' 或 '真实环境'

# 打印当前环境（调试用）
print_envir()
```

---

## 兼容写法模板

### 模式1：整体跳过（推荐）

```python
from marvel.AntPrint.sandbox.global_constant import envir
from marvel.AntPrint import ant_print_all, ant_read_data

if envir() == '仿真环境':
    ant_print_all(pd.DataFrame({"提示": ["仿真环境，跳过数据读取"]}))
else:
    # ===== 真实环境的代码 =====
    df = ant_read_data('your_table_name')
    # ... 后续分析代码 ...
```

### 模式2：提供模拟数据（需要调试时）

```python
from marvel.AntPrint.sandbox.global_constant import envir
import pandas as pd
import numpy as np

if envir() == '仿真环境':
    # 构造模拟数据用于调试代码逻辑
    df = pd.DataFrame({
        'id': range(100),
        'x': np.random.randn(100),
        'y': np.random.randn(100),
        'group': np.random.choice(['A', 'B', 'C'], 100)
    })
else:
    df = ant_read_data('your_table_name')

# 后续代码无需修改，df 在两种环境下都可用
```

### 模式3：函数级包装（适合复杂项目）

```python
def safe_read_table(table_name, cols=None):
    """安全读取数据表，仿真环境返回 None"""
    from marvel.AntPrint.sandbox.global_constant import envir
    if envir() == '仿真环境':
        return None
    if cols:
        return ant_read_data(table_name, cols=cols)
    return ant_read_data(table_name)

# 使用
df = safe_read_table('my_table')
if df is not None:
    ant_print_all(df, model_method="describe")
```

---

## 常见环境相关问题

### Q: 仿真环境 `ant_read_data` 报错 "No file exist"
**A**: 这是正常的。使用模式1或模式2包裹数据读取代码。

### Q: 仿真环境和真实环境结果不一致？
**A**: 可能原因：
1. 仿真环境使用了模拟/随机数据
2. 真实环境数据量更大，触发了不同的输出限制
3. 建议在两种环境中分别运行并对比

### Q: 需要在仿真环境测试绑图？
**A**: 可以。`ant_plot` 绑图系统在仿真环境中可用，只需传入有效的 DataFrame 即可。
