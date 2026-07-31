# AI 评审流程前端演示 Demo

<!--
  文件说明：AI 评审流程静态演示 Demo 的说明文档。
  作用：说明 demo 文件结构、打开方式和演示内容，便于前端开发或甲方演示时快速查看。
-->

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | Demo 入口页，展示整体流程和页面导航 |
| `admin_metric_demo.html` | 管理端习题库页面与生成评价指标分步弹窗演示 |
| `student_review_demo.html` | 学生端提交作业、门槛项评审、证据获取、单题评审演示 |
| `interactive_flow_demo.html` | AI 评审总流程交互图，点击模块查看输入输出、Agent Prompt、Skill 和 Tool 细节 |
| `result_demo.html` | 项目综合评审结果页演示 |
| `demo.css` | 统一页面样式 |
| `demo.js` | 静态 AI 执行流程模拟脚本 |

## 使用方式

直接打开 `index.html`，或使用本地静态服务访问本目录。

```bash
cd /Users/wangshichao/工作/ICANX
python3 -m http.server 8765
```

访问：

```text
http://127.0.0.1:8765/WorkShop/demo/ai_review_process_demo/index.html
```

## 演示说明

本 Demo 不调用真实大模型和后端接口。页面中的“AI 调用中”“Agent 执行中”“Skill/Tool 获取证据”等内容均为前端静态模拟，用于展示后续真实系统的交互逻辑和页面效果。

管理端 Demo 参考项目中的“习题库”和“生成评价指标”页面：先在题库列表点击“生成评价指标”，再进入“选择题目 -> 编辑指标 -> 全部保存”的流程。

交互总流程图用于讲解优化后的 AI 评审链路：管理端生成指标并固定 Skill 计划，学生提交作业后先执行门槛项评审，再并行调用 Skill/Tool 获取证据，最后由单题评审 Agent 和课程评审 Agent 输出结果。点击流程中的任一模块，可以查看该模块的案例输入、案例输出、Agent Prompt 或 Skill/Tool 细节。
