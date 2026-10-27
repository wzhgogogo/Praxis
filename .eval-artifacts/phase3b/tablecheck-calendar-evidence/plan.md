# G2 TableCheck阳性日历证据切片

Evidence status：offline evidence search, not a website replay or availability conclusion。只读取main/daba2ef0固定Git blob中的保存HTML、HTML.gz和录制归档；不读私有Holdout路径，不读.env，不联网。3408个输入逐项冻结Git对象与SHA，检索脚本也先冻结提交。

验收目标：已有原页上的店身份、具体日期、人数及可用时段可以绑定；通过现有真实Chromium观察/完成判定后加入固定G2集。原页没有可绑定库存的UNKNOWN、时间选项或营业时间不算阳性；本地构造的查位fixture不能冒充网站捕获。

检索不仅找Venue Timeslot Btn，还列出TableCheck页中带HH:mm文字的链接/按钮作人工复查；因此不能仅因某个testid不存在就断言无空位。候选均须回查原文及请求绑定。若没有合格保存页，按用户第3节明确停止条件停止报告，说明缺什么，不构造页面、不增加真实调用。Runner第4节未启动，用户已授权的B固定提交/单适配集成安排保留待后续。
