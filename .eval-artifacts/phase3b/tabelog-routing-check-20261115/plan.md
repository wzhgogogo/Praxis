当前规则主站tabelog.com和CDN tblg.k-img.com都direct。仅通过冻结浏览器/Guard加载一次公开首页，观察主文档及commons.js，20秒上限，不重试、不调用模型、不跑Live；响应只存状态与正文哈希，不保存正文或请求头。
