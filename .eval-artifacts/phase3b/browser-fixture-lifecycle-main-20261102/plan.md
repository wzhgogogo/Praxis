# 浏览器 fixture 生命周期修复独立合入

2026-11-02，Vienna CET。用户已批准：从最新main单独提取49e37c55的browser-read-test-fixtures.ts与browser-read-tabelog.test.ts晚调度回归，完整五门禁与严格G2全绿后直接合main推送，ls-remote核对，通知B/C；随后G6分支同步main。只改两份harness源文件及本次文档/证据，不带入G6 Runner、评分器、Prompt/Schema/State或产品代码。共享budget.json保持main原字节；无新增真实调用，不读取/加载.env。

改善：旧会话导航超时并已关闭、源请求尚未进入route时，fixture.finished也随真实context.close完成；已进入route但仍等release时，close释放等待。只认真实生命周期，不加长30ms导航、180秒G2或600秒套件限制，原断言全部保留。

先从49e37c55逐字导入晚调度回归，helper保持main旧字节，8秒外层诊断捕获“旧会话已退休、等待fixture.finished”后无法完成的红灯；然后逐字导入已复核helper，原用例同断言转绿。已有2核自然30次未复现、受控红灯与90/90修后证据在49e37c55 Git blob保留；复核者本次在C ec93c249自然482秒挂住属用户提供证据，不冒充本机复现。

验收：原目标LOCAL/CLOUDFLARE和晚调度同文件绿；净树五门禁/严格G2全绿，冻结输入SHA；非harness源/脚本/package/budget相对base零差异；正常fast-forward发布main，不强推、不改B/C工作树，通知其同步。停止条件沿用：产品文件需要改动、门禁修两次仍红或需真实调用则停报告。
