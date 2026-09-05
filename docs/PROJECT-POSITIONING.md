# Project Praxis（知行）项目定位

## 项目名称

- 中文名：**知行**
- 英文名：**Praxis**
- 英文全称：**Project Praxis**

“知行”代表从理解到行动：既理解现实世界中的事务、规则和操作路径，也理解用户本人的情况、偏好和历史，并把这些理解转化为行动和结果。

“Praxis”指将知识、理解和判断付诸实践，与“知行”的项目精神一致。

## 核心定位

> **Not just answers. Outcomes.**

中文表达：

> **不只回答问题，而是交付结果。**

面向用户的中文定位：

> **懂你所需，替你成事。**

## 中文介绍

Praxis（知行）是一个面向个人生活事务的 Personal AI Agent。它通过 Public Knowledge 理解不同生活事务需要满足的规则、材料、操作路径、异常分支和完成标准；通过 Private Knowledge 理解具体用户的身份信息、文件、账户、偏好、限制和历史。在用户授权和控制下，它能够制定计划，在网站、App、邮件、电话等渠道中执行和协调，并持续跟进异步流程，直到获得真实、可确认的结果。

Praxis（知行）解决的核心问题，是生活事务往往琐碎、繁杂、耗时：用户需要反复搜索信息、填写表单、上传材料、跨渠道沟通、等待反馈并处理异常。项目的目标不是生成更多建议，而是减少这些来回拉扯所消耗的时间和精力。

## English Introduction

Praxis is a personal AI agent for getting everyday matters done. It combines public procedural knowledge about how real-world services and processes work with private knowledge about the user's context, preferences, documents, accounts, and history. With the user's authorization and control, Praxis can plan, act across websites, apps, email, and phone-based workflows, handle exceptions, and follow through until the outcome can be verified.

Everyday tasks are rarely difficult because of a single step. They are difficult because they are fragmented, repetitive, time-consuming, and full of back-and-forth. Praxis is designed to reduce that burden by moving from understanding to execution and from execution to a confirmed outcome.

## 当前 Build 起点

截至 2026-08-04，Praxis（知行）选择从 **日本市场的 Local 场景**开始 Build。

日本 Local 是验证产品核心能力的第一个切入口，而不是 Praxis 的最终边界。第一阶段将围绕聚会、餐厅、交通和外出安排等具有代表性的事务，验证 Agent 是否能够在跨平台、跨时间的过程中保存任务状态、理解用户约束、整合本地信息、推进下一步并持续跟进。

现有 Copilot、竞品评测和用户研究数据证明了 Local 等生活需求具有足够大的相邻市场，也显示了现有 AI 在行动与持续跟进方面的不足；但这些数据不直接等同于 Praxis 的产品市场匹配。日本 Local Build 的目标，就是把这一方向从合理假设推进到真实用户验证。

无API网站的浏览与受控操作是Praxis持续建设的核心能力；有可用API时可以优先使用；无可用 API 时使用经过验证的 Browser Adapter，并在登录、验证码、银行卡或高风险条款处由用户临时接管。未知或未验证的网站降级为 Human Takeover 或 Deep Link，不以100%自动操作所有网站和 App 为前提。

## 产品承诺

1. **Understand｜理解**：理解用户真正想完成的目标，而不只是表面的指令。
2. **Plan｜规划**：结合公共流程、用户条件和现实限制形成周全计划。
3. **Act｜行动**：在用户授权范围内执行、协调或准备具体操作。
4. **Follow through｜跟进**：处理等待、补充材料、失败和异常分支。
5. **Verify｜验证**：以可以观察和确认的结果作为任务完成标准。

## 知识与行动基础

- **Public Knowledge｜知世界**：事务规则、所需材料、适用范围、操作渠道、执行路径、异常分支和完成标准。
- **Private Knowledge｜知用户**：用户主动提供或授权访问的个人资料、文件、邮件、账户、偏好和历史。
- **Agent Execution｜去行动**：根据当前任务和实时状态进行规划、操作、沟通和持续跟进。
- **Verified Outcomes｜有结果**：通过回执、状态变化、邮件、到账记录或人工确认判断事情是否真正完成。

## 标准写法

首次出现：**Project Praxis（知行）**  
后续中文：**知行**  
后续英文：**Praxis**

英文标语固定使用：**Not just answers. Outcomes.**
