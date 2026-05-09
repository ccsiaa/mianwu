# 面悟后端

AI驱动的智能面试教练后端服务

## 技术栈

- Python 3.10+
- FastAPI
- PostgreSQL + pgvector
- 讯飞MaaS (astron-code-latest)
- 通义听悟 (语音服务)

## 快速开始

### 1. 创建虚拟环境

```bash
cd mianwu-backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

### 4. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d \
  --name mianwu-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mianwu \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 5. 启动服务

```bash
python run.py
```

服务将在 http://localhost:8000 启动

API文档: http://localhost:8000/docs

## 项目结构

```
mianwu-backend/
├── app/
│   ├── api/          # API路由
│   ├── core/         # 核心配置
│   ├── models/       # 数据库模型
│   ├── schemas/      # Pydantic模型
│   ├── services/     # 业务逻辑
│   └── utils/        # 工具函数
├── tests/            # 测试
├── main.py           # 应用入口
├── run.py            # 启动脚本
└── requirements.txt  # 依赖
```

## API模块

- `/auth` - 用户认证
- `/experiences` - 经历管理
- `/resume` - 简历生成
- `/interview` - 面试准备
- `/review` - 面试复盘
