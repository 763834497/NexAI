# Agent 评审团优化流程交互图

<!--
  文件说明：Agent 评审团优化流程交互图的说明文档。
  作用：说明文件结构、打开方式和演示内容，便于前端开发或甲方演示时快速查看。
-->

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | GitHub Pages 根路径入口，自动跳转到交互流程图 |
| `interactive_flow_demo.html` | Agent 评审团优化流程交互图，点击模块查看输入输出、Agent Prompt、Skill 和 Tool 细节 |

## 使用方式

直接打开 `index.html` 或 `interactive_flow_demo.html`，也可以使用本地静态服务访问本目录。

```bash
cd /Users/wangshichao/工作/ICANX
python3 -m http.server 8765
```

访问：

```text
http://127.0.0.1:8765/WorkShop/demo/ai_review_process_demo/index.html
```

## 演示说明

本页面只保留 Agent 评审团优化流程交互图，不包含管理端、学生端或结果页演示。页面不调用真实大模型和后端接口，用于讲解优化后的 AI 评审链路。点击流程中的任一模块，可以查看该模块的案例输入、案例输出、Agent Prompt 或 Skill/Tool 细节。
