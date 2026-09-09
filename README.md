# Project Praxis（知行）

> Not just answers. Outcomes.

Praxis面向个人生活事务：理解目标、建立有状态任务，在获得授权后执行并验证结果。无API网站的浏览与受控操作是核心建设方向；API是可用渠道之一。当前实现和未验证项以[STATUS](docs/STATUS.md)为准，尚未进入生产Pilot。

## 开发入口

修改前从[文档索引](docs/INDEX.md)与[AGENTS](AGENTS.md)开始。产品定位见[Project Positioning](docs/PROJECT-POSITIONING.md)，阶段目标见[Roadmap](docs/roadmap.md)，历史讨论见[研究记录](docs/brainstorming/2026-08-04-日本Local市场切入与Build决策.md)。

要求Node.js 24及以上。

```bash
npm ci
npm run typecheck
npm run arch:check
npm test
npm run build
```

这些命令不加载`.env`，不调用付费模型或真实预约网站。`build`目前是全仓源码编译验证，包含开发Runner/Harness，不是精简生产部署包。`arch:check`检查部分静态import规则，不等于完整依赖分析。

## 本地Web Fixture

先启动一个仅供本机开发的 PostgreSQL 实例，并创建分离的开发库；以下 Homebrew 示例不包含用户名、密码或任何凭据。其他 PostgreSQL 安装方式只需提供等价的本机连接串。

```bash
brew services start postgresql@17
createdb praxis_web
```

```bash
cp -n .env.example .env
# 在.env填写：DATABASE_URL=postgresql://127.0.0.1:5432/praxis_web
npm run dev
```

启动会应用数据库Migration。打开`http://127.0.0.1:3000`，本地Fixture Token为`praxis-fixture-a`；可通过服务端`PRAXIS_PILOT_ACCESS_JSON`覆盖。页面是Fixture模式，不能据此宣称Live搜索或预约成功。Secret只在服务端使用，个人`.env`不提交。

真实 PostgreSQL smoke 必须使用另一专用库，避免与开发Workspace混用：`createdb praxis_smoke`，再临时设置`PRAXIS_TEST_DATABASE_URL=postgresql://127.0.0.1:5432/praxis_smoke`和`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`后运行`npm run test:postgres:live`。该脚本会迁移该测试库并清理自身临时记录；它不能用于生产、staging、Pilot或任何真实进行中Task数据库。

### 本地 Web Live Read-only

仅在本机、有明确授权的演示中，将`.env`中的`PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`、`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1`和`PRAXIS_ALLOW_BROWSER_RUN=1`与DeepSeek、Google及所选浏览器运行时的服务端配置一起设置后再运行`npm run dev`。缺少任一配置会直接启动失败；不会回退到Fixture或混入假候选。Live模式只执行搜索和页面读取，页面会显示经过证据验证的结果、来源链接或准确失败原因；不提供授权、预约、登录、支付、取消或个人资料提交。远程验证码接管和公网部署不在此范围。

## 验证与诊断

完整范围与命令以[Test Skill](docs/skills/test/SKILL.md)、[Eval Skill](docs/skills/eval/SKILL.md)为准。

- `npm run test:browser:fixture`：真实本地Chromium运行拦截响应的动态Fixture，不访问真实来源；需已安装兼容的Playwright Chromium。
- `npm run test:probes`：冻结架构探针，独立于当前产品验收。
- `npm run probe:restaurant:browser:read -- --url <public-url>`：有界单页Live只读诊断，配置与证明范围见[操作说明](docs/harness/BROWSER-READ-DIAGNOSTICS.md)。
- `npm run eval:restaurant:agent-loop:hybrid-live-read`：涉及真实模型、Google和浏览器，需明确实验授权；不作为默认检查。
- `npm run eval:restaurant:semantic:deepseek`：付费语义评测，仅证明语义边界。已暴露数据不能作Clean Baseline；本地私有Holdout不是普通贡献者默认验证前置条件。

哪些命令加载`.env`以`package.json`中的`--env-file-if-exists=.env`为准；包括Web、Live诊断、真实模型Eval与显式数据库维护。开关不替代用户授权。

真实PostgreSQL Smoke只可对专用可写测试库设置`PRAXIS_TEST_DATABASE_URL`和`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`后运行`npm run test:postgres:live`。开发旧State重置入口为`npm run reset:dev:restaurant-state`，仅接受localhost与显式重置开关；使用前按[配置示例](.env.example)确认删除范围并保留需要的调试信息。
