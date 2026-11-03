# 名称匹配合入main

Status: draft / not integrated; offline verification.

用户已复核通过 ca18d02b5b2b443027fb0759b63b6aeefa44c376；最新main d4d8ea33a4cf32b01601474f02ad89c538bf3f69 已是其祖先，源码合入不引入其他变化。新鲜五门禁、严格G2和独立核验在净树上运行，之后只推远端main、ls-remote核对并通知A。本机main被其他工作树占用，本分支从origin/main起合入，不改变别人的检出。

保留A 5912dd11ff3a105031516877f37cfe38242bd849账本原件，并集合并67条新记录；同ID差异则停止。A快照上限390单列，不推断为C的新增授权；main290不变，累计270仍在其中。本次调用0，不读.env。D6的S0另开分支处理，不在本次源码中修。
