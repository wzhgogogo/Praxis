# G1文件改动范围（当前与已审5cda89b7）

时间：2026-11-01 CET。此表不更改已接受合同或原历史材料。

## src/integrations/restaurant-facts/page-question-reader.ts

此前C接线：保留G1原始身份页、保存实际已接纳问答以复用，新增currentPages/admittedQuestion/captureBookingPages/answerBookingQuestion。显式追问结果与3次/60秒额度不变。本次：B1捕获通过同一factory传入原browserBudget/model及beforeRead；在每次模型传输前核对已减20秒的截止，未新建额度。

main→当前行段：@@ -9,0 +10,3 @@ import type { QuestionPageVisits } from "./page-question-read-budget.js";, @@ -17,0 +21 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -20,2 +24,2 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -24 +28 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -37,0 +42,44 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -49,0 +98 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -51 +100 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -70,0 +120 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -75,0 +126,3 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort

5cda89b7→当前行段：@@ -25 +25 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -28 +28 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -63,2 +63,5 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -65,0 +69,5 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -66,0 +75,2 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort, @@ -72 +82,2 @@ export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort

## src/integrations/restaurant-facts/native-source-facts.ts

此前C接线仅在inspectFacts的capturePagesOnly分支增captureLinkedTranslation：从可见/en-ja同店语言链接最多再读一页，仍经原Executor/Guard/身份提取；不新写解析器，不改HARD默认路径。本次与5cda89b7逐字相同，没有再改该文件。

main→当前行段：@@ -306,0 +307,14 @@ export class NativeSourceFactRead implements RestaurantCandidateFactPort {

5cda89b7→当前行段：无变化

## src/integrations/restaurant-facts/page-question-read-budget.ts

本次增加可选B1 beforeRead观察/执行前检查；openSession和所有session读取/动作方法执行前检查，close始终允许清理；显式G1仍只传原visits，两页计数逻辑不变。

main→当前行段：@@ -6 +6 @@ export interface QuestionPageVisits { used: number; limit: number; exhausted: bo, @@ -9,0 +10 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -15 +16,2 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -17,2 +19,3 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -22 +25 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag

5cda89b7→当前行段：@@ -6 +6 @@ export interface QuestionPageVisits { used: number; limit: number; exhausted: bo, @@ -9,0 +10 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -15 +16,2 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -17,2 +19,3 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag, @@ -22 +25 @@ export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPag

## src/integrations/restaurant-search/native-read-composition.ts

本次仅把可选beforeRead从G1原factory传到同一个runtime包装，B1继续共享原模型/BrowserExecutionBudget/Guard；其它调用不传检查，行为不变。

main→当前行段：@@ -31,2 +31,2 @@ export function composeNativeRestaurantRead(

5cda89b7→当前行段：@@ -31,2 +31,2 @@ export function composeNativeRestaurantRead(
