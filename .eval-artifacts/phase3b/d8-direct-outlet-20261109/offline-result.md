# 查位直达修复 — 离线结论

Status: draft / not integrated；用户已批准全绿后合main。源码fc62b663：Router只投影HIGH且唯一的来源绑定，TableCheck当前同店页不导航、其他页只读确切绑定URL，重新核对HIGH/URL/实体后由模型选日期人数；内嵌组件不因SPA查询串再次开canonical。身份/Guard/预算/时限不变。

红：真实店页当前页，旧代码首个模型阶段是DISCOVERY；今天原决策#27–31又检索，#33（provider40.968秒）才选日期。绿：真实20份清洗DOM解析、实际Chromium当前页零导航/异页仅绑定URL、模型首步日期选择，非HIGH/歧义/冲突实体均拒直达。缺店铺JSON，仅组件回归，不冒充完整Replay。首轮门禁8个旧Mock失败因首次空白页会抛错，修成真实Chromium空白页，原断言全部保留，54回归绿。

同SHA净树全绿：默认1512，Chromium260+完整G6 78，严格G2全12页，type/arch/build。扫描新增1条既有TableCheck origin安全范围，无新增店名/词表/选择器。无新模型/GET/Live。下一步按本次授权发布main、认证1GET、冻结一次D8；18Live108GET预留不动。
