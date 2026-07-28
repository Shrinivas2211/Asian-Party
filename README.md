# Asian-Party

这个仓库有两样东西：

- **小票图片数据集** —— `receipt-image-dataset-1` ~ `-4`，188 张真实小票照片
- **记账 App** —— `web/` + `api/` + `supabase/`，拍小票 → GPT-4o 识别 → 确认后入账

数据集是仓库原本的内容，App 是后来加的。App 的识别准确率就是拿这个数据集验的。

---

# 一、小票数据集

188 张 JPEG，分在四个目录里，按 `<编号>-receipt.jpg` 命名：

| 目录 | 张数 | 编号区间 |
| --- | --- | --- |
| `receipt-image-dataset-1` | 34 | 1000–1032 |
| `receipt-image-dataset-2` | 51 | 1033–1093 |
| `receipt-image-dataset-3` | 53 | 1094–1145 |
| `receipt-image-dataset-4` | 54 | 1146–1199 |

编号跨目录连续，全局 1000–1199，其中 12 个号被删掉了（见 git 历史里那批 `Delete
xxxx-receipt.jpg` 提交），所以是 188 张而不是 200 张。没有重号。

每个目录下还有一个 1 字节的 `temp` 占位文件 —— 空目录进不了 git，删掉图片后靠它撑住目录。

图片是真实世界的小票照片和扫描件，尺寸和方向都不统一（抽样见到 338×450 到 1000×903
不等），有拍歪的、有反光的、有折痕的。这正是拿它测识别的价值所在。

> 数据来源和授权条款仓库里没有记录。要商用或再分发的话，先跟仓库所有者确认。

## 拿它测识别

后端起好之后，直接把图片打给识别接口：

```bash
curl -s -X POST http://localhost:8000/api/recognize \
  -F "file=@receipt-image-dataset-1/1012-receipt.jpg" | python3 -m json.tool
```

目前的 prompt 是拿其中 5 张（1012 / 1040 / 1093 / 1112 / 1178）调出来的，核心字段
（日期、总额、币种、分类、支付方式、明细条数）对人工核对的答案全中。**只有 5 张，且
恰好都是美国餐饮小票**（USD + food），英国超市、加油站、外币这些场景没被真正考验过 ——
想扩样本，剩下 183 张都在这儿。

---

# 二、记账 App

拍小票 → GPT-4o 识别 → 确认后入账。也支持手动记一笔。

- `web/` — Vite + React + TypeScript + Tailwind，前端直连 Supabase 做 CRUD
- `api/` — FastAPI，只负责调 OpenAI 识别小票
- `supabase/` — 数据库 schema

## 首次配置

### 1. 数据库

在 Supabase 控制台 → SQL Editor 粘贴 `supabase/schema.sql` 全文并 Run。
这个文件是幂等的，改了之后重跑一次就行。

### 2. 前端环境变量

```bash
cp web/.env.example web/.env.local
```

填入 Supabase 控制台 → Project Settings → API 里的 Project URL 和 anon public key。

### 3. 后端环境变量

```bash
cp api/.env.example api/.env
```

填入 [OpenAI](https://platform.openai.com/api-keys) 的 API key。识别要读图，
模型必须支持视觉输入 —— 默认 `gpt-4o`。
不填也能跑，只是 `/scan` 会返回 503 —— 手动记账不受影响。

> `.env` / `.env.local` 都在 `.gitignore` 里。anon key 可以进前端（RLS 是真正的防线），
> 但 `OPENAI_API_KEY` 和 `service_role` key 只能待在 `api/.env`。

## 启动

两个终端：

```bash
# 后端 → http://localhost:8000
cd api && .venv/bin/uvicorn app.main:app --reload --port 8000

# 前端 → http://localhost:5173
cd web && npm run dev
```

首页顶部的「连接状态」两个点全绿就说明配好了。

首次 clone 后需要先装依赖：

```bash
cd web && npm install
cd ../api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

## 手机真机调试

前端已配 `host: true`，`npm run dev` 会打印 Network 地址（形如 `http://192.168.x.x:5173`）。
手机连同一 WiFi 打开该地址即可。还需要两处改动：

1. `api/.env` 的 `CORS_ORIGINS` 追加 `http://192.168.x.x:5173`
2. `web/.env.local` 的 `VITE_API_BASE_URL` 改成 `http://192.168.x.x:8000`

后端也要用 `--host 0.0.0.0` 启动才能被手机访问。

## 设计约定

**分类以 slug 入库**（`food` / `transport` / ...），显示名、图标、颜色只存在于
`web/src/constants/categories.ts`。UI 从中文改成英文时，历史数据一行没动 —— 这条约定
就是为这种情况准备的。

**`image_path` 存的是 Storage 对象路径，不是 URL。** bucket 是私有的，签名 URL 会过期，
所以展示时才用 `createSignedUrl()` 现算。

**识别结果一律要人过目才写库。** 模型认错金额的代价是账本变脏，多看一眼几乎没成本。
`/scan` 的流程是：浏览器压图 → `POST /api/recognize` → 用户核对 → 上传原图到 Storage
→ 写 `receipts`。后端全程不碰数据库。

**给模型的 `response_format` 全是必填的非空字段**，用 `""` / `0` / `"unknown"` 表达
「没识别出来」，而不是 `Optional` —— 这既是 OpenAI strict 模式的硬性要求（所有 property 都得在
`required` 里），也避开了 nullable 带来的 `anyOf`。真正的 null 在 `api/app/schemas.py` 的 `normalize()` 里还原。

> 注意 `ExtractedReceipt` 的 docstring 和每个 `Field(description=...)` 都会被 SDK 塞进
> 发给模型的 `response_format` 里 —— **它们是 prompt，不是注释**。实现层面的说明写成 `#` 注释。

**RLS 已开启，但 MVP 阶段用的是允许 anon 全量读写的临时策略。**
接 Supabase Auth 时替换成按 `user_id` 隔离的策略 —— `supabase/schema.sql` 第 4 节
有写好的替换语句，表结构不用动。
