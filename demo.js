/*
  文件说明：AI 评审流程静态演示 Demo 的交互脚本。
  作用：模拟评价指标生成、门槛项评审、Skill/Tool 证据获取和单题评审执行过程，不调用真实后端或大模型。
*/

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setProgress(value) {
  const bar = document.querySelector("[data-progress]");
  const label = document.querySelector("[data-progress-label]");
  if (bar) bar.style.width = `${value}%`;
  if (label) label.textContent = `${value}%`;
}

function resetLogs() {
  document.querySelectorAll("[data-log]").forEach((item) => {
    item.classList.remove("running", "done", "blocked");
    const text = item.querySelector(".log-text");
    if (text) text.textContent = item.dataset.pending || "等待执行";
    const io = item.querySelector(".log-io");
    if (io) io.remove();
  });
  setProgress(0);
}

async function runLogSequence(sequence, options = {}) {
  resetLogs();
  const finishProgress = options.finishProgress || 100;
  for (let i = 0; i < sequence.length; i += 1) {
    const step = sequence[i];
    const item = document.querySelector(`[data-log="${step.key}"]`);
    if (!item) continue;
    if (step.ioHtml) setLogIo(step.key, step.ioHtml);
    item.classList.add("running");
    const text = item.querySelector(".log-text");
    if (text) text.textContent = step.running;
    setProgress(Math.round((i / sequence.length) * finishProgress));
    await sleep(step.delay || 720);
    item.classList.remove("running");
    item.classList.add(step.blocked ? "blocked" : "done");
    item.querySelectorAll(".io-output").forEach((block) => {
      block.hidden = false;
    });
    item.querySelectorAll(".io-process").forEach((block) => {
      block.classList.add("done");
    });
    if (text) text.textContent = step.done;
    setProgress(Math.round(((i + 1) / sequence.length) * finishProgress));
  }
}

function reveal(selector) {
  const el = document.querySelector(selector);
  if (el) el.hidden = false;
}

function showDemoToast(message, type = "success", duration = 1500) {
  let toast = document.querySelector(".demo-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "demo-toast";
    document.body.appendChild(toast);
  }
  toast.className = `demo-toast ${type === "warn" ? "warn" : type === "error" ? "error" : ""}`.trim();
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("show"));
  window.clearTimeout(showDemoToast.timer);
  showDemoToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

const demoQuestionBanks = {
  "AI 基础概念题库": [
    {
      id: "q_ai_basic_001",
      type: "单选题",
      title: "人工智能的基础能力包括哪些？",
      desc: "考查学生对 AI 感知、理解、生成、推理等基础能力的认知。",
      content: "从给定选项中选择人工智能常见基础能力，要求能够区分感知、理解、生成、推理与普通信息检索的差异。",
      submitRequirements: "单选答案"
    },
    {
      id: "q_ai_basic_002",
      type: "简答题",
      title: "请结合案例说明如何判断答案是否达标。",
      desc: "要求学生用具体案例说明判断标准、证据和结论之间的关系。",
      content: "请结合一个具体学习任务案例，说明如何根据评价标准判断学生答案是否达标，并写出判断依据。",
      submitRequirements: "文本答案，建议 200 字以内"
    },
    {
      id: "q_ai_basic_003",
      type: "Markdown 内容题",
      title: "AI 基础概念题库综合应用题",
      desc: "阅读题目材料，完成分析说明，并给出清晰的判断依据。",
      content: "阅读 AI 基础能力案例材料，完成一份 Markdown 分析说明，内容需包含能力识别、应用场景和判断依据。",
      submitRequirements: "Markdown 文档"
    }
  ],
  "AI Coding 实战题库": [
    {
      id: "q_coding_web_001",
      type: "系统实现题",
      title: "AI Coding 单文件 Web 系统实现",
      desc: "提交可访问 URL、README 文档和项目代码压缩包，验证核心功能流程。",
      content: "使用 AI Coding 工具完成一个可运行的 Web 系统，核心功能流程能够完整走通，并提交系统访问 URL、README 文档和项目代码压缩包。",
      submitRequirements: "系统访问 URL、README 文档、项目代码压缩包"
    },
    {
      id: "q_coding_proto_002",
      type: "系统原型设计题",
      title: "课程学习系统 HTML 原型设计",
      desc: "提交 HTML 原型，重点考查页面结构、信息架构和主要交互流程表达。",
      content: "围绕课程学习场景设计一个 HTML 交互原型，需覆盖课程介绍、任务列表、学习页面、测验入口和结果反馈等主要页面。",
      submitRequirements: "HTML 文件或可访问原型 URL"
    },
    {
      id: "q_coding_api_003",
      type: "代码项目题",
      title: "大模型接口调用流程实现",
      desc: "提交项目代码和运行说明，考查接口调用、异常处理和工程交付规范。",
      content: "实现一个调用大模型接口的最小可运行项目，包含请求参数组装、接口调用、异常处理和结果展示。",
      submitRequirements: "项目代码压缩包、README 运行说明、接口调用截图"
    }
  ],
  "提示词工程练习题库": [
    {
      id: "q_prompt_001",
      type: "简答题",
      title: "提示词工程的核心目标是什么？",
      desc: "考查学生是否理解任务描述、约束条件和输出格式对模型结果的影响。",
      content: "请说明提示词工程的核心目标，并解释任务描述、约束条件、示例和输出格式对模型结果的影响。",
      submitRequirements: "文本答案，建议 300 字以内"
    },
    {
      id: "q_prompt_002",
      type: "应用题",
      title: "根据业务场景设计一组结构化提示词",
      desc: "要求学生围绕指定场景设计提示词，并说明每个模块的作用。",
      content: "针对客服质检场景设计一组结构化提示词，需包含角色、任务、输入字段、输出格式和质量约束。",
      submitRequirements: "Markdown 文档或文本答案"
    },
    {
      id: "q_prompt_003",
      type: "Markdown 内容题",
      title: "提示词优化前后效果分析",
      desc: "提交提示词迭代记录，说明问题、修改策略和结果变化。",
      content: "提交一份提示词优化前后对比分析，说明原始提示词问题、优化策略、输出变化和最终结论。",
      submitRequirements: "Markdown 文档，包含优化前后提示词和结果对比"
    }
  ]
};

let demoCurrentBank = "";
let demoCurrentQuestions = [];
let demoSelectedIndexes = [];
let demoCreatedBankCount = 0;

function createDemoQuestionBank() {
  demoCreatedBankCount += 1;
  const name = `演示新增题库 ${demoCreatedBankCount}`;
  demoQuestionBanks[name] = [
    {
      id: `q_demo_${demoCreatedBankCount}_001`,
      type: "简答题",
      title: "请说明本题的核心作答思路。",
      desc: "演示新增题库中的示例题目，用于测试生成评价指标流程。",
      content: "请围绕题目要求说明核心作答思路、判断依据和结果表达。",
      submitRequirements: "文本答案，建议 200 字以内"
    }
  ];
  const tbody = document.querySelector(".demo-table tbody");
  const rowIndex = tbody ? tbody.querySelectorAll("tr").length + 1 : demoCreatedBankCount;
  if (tbody) {
    tbody.insertAdjacentHTML("beforeend", `
      <tr data-bank="${escapeHtml(name)}">
        <td>${rowIndex}</td>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>1</td>
        <td>演示</td>
        <td>2026-07-31</td>
        <td>
          <div class="demo-actions">
            <button class="mini-btn" onclick="editDemoQuestionBank(this)">编辑</button>
            <button class="mini-btn" onclick="viewDemoQuestionBank('${escapeHtml(name)}')">查看</button>
            <button class="mini-btn primary" onclick="openDemoScoringWizard('${escapeHtml(name)}')">生成评价指标</button>
            <button class="mini-btn danger" onclick="deleteDemoQuestionBank(this)">删除</button>
          </div>
        </td>
      </tr>
    `);
  }
  showDemoToast(`已创建题库：${name}`);
}

function getBankNameFromRowButton(btn) {
  const row = btn?.closest("tr");
  return row?.dataset.bank || row?.querySelector("td:nth-child(2)")?.textContent.trim() || "";
}

function editDemoQuestionBank(btn) {
  const row = btn.closest("tr");
  const oldName = getBankNameFromRowButton(btn);
  const newName = `${oldName.replace(/（已编辑）$/, "")}（已编辑）`;
  if (row) {
    row.dataset.bank = newName;
    const nameCell = row.querySelector("td:nth-child(2) strong");
    if (nameCell) nameCell.textContent = newName;
    demoQuestionBanks[newName] = demoQuestionBanks[oldName] || demoQuestionBanks[newName] || [];
    delete demoQuestionBanks[oldName];
    row.querySelectorAll("button").forEach((button) => {
      const text = button.textContent.trim();
      if (text === "查看") button.setAttribute("onclick", `viewDemoQuestionBank('${newName}')`);
      if (text === "生成评价指标") button.setAttribute("onclick", `openDemoScoringWizard('${newName}')`);
    });
  }
  showDemoToast(`已更新题库名称：${newName}`);
}

function viewDemoQuestionBank(bankName) {
  showDemoToast(`正在打开 ${bankName} 的题目列表`);
  openDemoScoringWizard(bankName);
}

function deleteDemoQuestionBank(btn) {
  const row = btn.closest("tr");
  const bankName = getBankNameFromRowButton(btn);
  if (!row) return;
  row.remove();
  showDemoToast(`已删除题库：${bankName}`, "warn");
}

function openDemoScoringWizard(bankName) {
  demoCurrentBank = bankName;
  demoCurrentQuestions = demoQuestionBanks[bankName] || [];
  demoSelectedIndexes = [];
  const title = document.getElementById("demoScoringTitle");
  const overlay = document.getElementById("demoScoringOverlay");
  if (title) title.textContent = `生成评价指标 — ${bankName}`;
  renderDemoQuestions();
  switchDemoScoringStep("select");
  resetLogs();
  if (overlay) overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDemoScoringWizard() {
  const overlay = document.getElementById("demoScoringOverlay");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function renderDemoQuestions() {
  const list = document.getElementById("demoQuestionList");
  const count = document.getElementById("demoQuestionCount");
  if (count) count.textContent = `(${demoCurrentQuestions.length})`;
  if (!list) return;
  list.innerHTML = demoCurrentQuestions.map((q, index) => `
    <div class="question-card" data-qindex="${index}" onclick="toggleDemoQuestion(${index})">
      <div class="question-check"></div>
      <div>
        <h4>${index + 1}. ${q.title}</h4>
        <p>${q.desc}</p>
        <div class="question-meta">
          <span class="pill">${q.type}</span>
          <span class="pill green">可生成评价指标</span>
        </div>
      </div>
    </div>
  `).join("");
  updateDemoSelectedCount();
}

function toggleDemoQuestion(index) {
  const pos = demoSelectedIndexes.indexOf(index);
  if (pos >= 0) demoSelectedIndexes.splice(pos, 1);
  else demoSelectedIndexes.push(index);
  document.querySelectorAll(".question-card").forEach((card) => {
    const qIndex = Number(card.dataset.qindex);
    card.classList.toggle("selected", demoSelectedIndexes.includes(qIndex));
  });
  updateDemoSelectedCount();
}

function toggleDemoSelectAll() {
  if (demoSelectedIndexes.length === demoCurrentQuestions.length) {
    demoSelectedIndexes = [];
  } else {
    demoSelectedIndexes = demoCurrentQuestions.map((_, index) => index);
  }
  document.querySelectorAll(".question-card").forEach((card) => {
    const qIndex = Number(card.dataset.qindex);
    card.classList.toggle("selected", demoSelectedIndexes.includes(qIndex));
  });
  updateDemoSelectedCount();
}

function updateDemoSelectedCount() {
  const count = document.getElementById("demoSelectedCount");
  const btn = document.getElementById("demoGenerateBtn");
  if (count) count.textContent = demoSelectedIndexes.length;
  if (btn) btn.disabled = demoSelectedIndexes.length === 0;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getSelectedQuestions() {
  return demoSelectedIndexes
    .map((idx) => ({ ...demoCurrentQuestions[idx], index: idx }))
    .filter((q) => q && q.title);
}

function getRubricOutput(question) {
  const base = {
    questionId: question.id,
    questionTitle: question.title,
    questionContent: question.content,
    submitRequirements: question.submitRequirements
  };

  if (question.type === "系统实现题") {
    return {
      ...base,
      questionType: "系统实现题",
      studentIndicator: "完成可访问系统、核心流程、README和代码交付，功能可验证且材料清晰。",
      dimensions: [
        {
          id: "D1",
          name: "功能完整性",
          description: "评估系统是否可访问、核心功能是否完整、主要用户流程是否能被验证。",
          score: 50,
          isGate: true,
          criteria: [
            {
              id: "D1-C1",
              name: "系统可访问性",
              score: 15,
              qualified: "提交的系统 URL 可正常访问，首页或核心入口能够打开。",
              excellent: "系统访问稳定，入口清晰，页面加载正常，无阻断性报错。",
              unqualified: "未提交系统 URL、URL 无法访问，或核心入口无法打开。",
              evidence: "URL 状态码、首页截图、错误信息截图。"
            },
            {
              id: "D1-C2",
              name: "核心流程完整性",
              score: 25,
              qualified: "至少一个主要功能流程能够从入口走到结果页或完成状态。",
              excellent: "主要流程完整顺畅，关键状态反馈清楚，用户能够连续完成任务。",
              unqualified: "核心流程缺失、流程中断，或无法判断功能是否完成。",
              evidence: "核心路径点击记录、关键页面截图、流程结果截图。"
            },
            {
              id: "D1-C3",
              name: "基础异常反馈",
              score: 10,
              qualified: "对加载失败、空数据或基础错误有基本提示。",
              excellent: "异常、空状态、提交反馈等状态设计完整，提示清楚。",
              unqualified: "关键异常无反馈，导致用户无法判断当前状态。",
              evidence: "异常状态截图、页面提示文本、代码中的状态处理片段。"
            }
          ]
        },
        {
          id: "D2",
          name: "工程交付规范",
          description: "评估 README、代码结构、项目文件和提交材料是否支撑复现与验收。",
          score: 50,
          isGate: false,
          criteria: [
            {
              id: "D2-C1",
              name: "README 完整性",
              score: 20,
              qualified: "README 能说明项目目标、运行方式和主要功能。",
              excellent: "README 结构清楚，包含启动命令、访问地址、功能说明和注意事项。",
              unqualified: "README 缺失，或无法说明项目如何运行和验证。",
              evidence: "README 正文摘要、启动说明、功能说明段落。"
            },
            {
              id: "D2-C2",
              name: "代码结构可读性",
              score: 20,
              qualified: "代码目录和入口文件能够识别，核心实现位置清楚。",
              excellent: "目录结构清晰，命名规范，核心模块职责明确，便于后续维护。",
              unqualified: "代码包无法解压、入口文件缺失，或代码结构无法识别。",
              evidence: "代码目录树、入口文件、核心代码摘要。"
            },
            {
              id: "D2-C3",
              name: "交付材料一致性",
              score: 10,
              qualified: "URL、README 和代码包内容基本对应同一作品。",
              excellent: "线上效果、文档说明和代码实现互相印证，交付材料一致。",
              unqualified: "提交材料互不对应，无法确认是否为同一作品。",
              evidence: "URL 页面信息、README 项目名、代码文件命名对照。"
            }
          ]
        }
      ],
      gates: [
        { id: "G1", name: "必需材料完整", rule: "必须提交系统访问 URL、README 文档和项目代码压缩包。", failResult: "不合格" },
        { id: "G2", name: "核心入口可验证", rule: "系统 URL 可访问，或代码包可解压并能识别核心入口文件。", failResult: "不合格" }
      ],
      disqualifyRules: [
        "未提交任何有效作业材料。",
        "提交内容与题目要求明显无关。",
        "核心文件无法读取且无可替代验证证据。"
      ],
      suggestedAgentTypes: ["门槛项评审与证据获取 Agent", "单题评审 Agent"],
      suggestedSkillTypes: ["网页访问 Skill", "文档读取 Skill", "代码/压缩包 Skill"],
      reviewPoints: ["系统能否真实访问", "核心流程是否完整可验证", "README 与代码是否能支撑复现", "提交材料是否一致"]
    };
  }
  if (question.type === "系统原型设计题") {
    return {
      ...base,
      questionType: "系统原型设计题",
      studentIndicator: "原型需覆盖主要页面和核心流程，信息架构清楚，交互表达与视觉风格一致。",
      dimensions: [
        {
          id: "D1",
          name: "原型完整性",
          description: "评估原型是否覆盖题目要求的核心页面、内容结构和业务场景。",
          score: 40,
          isGate: true,
          criteria: [
            {
              id: "D1-C1",
              name: "页面覆盖完整",
              score: 20,
              qualified: "覆盖题目要求的主要页面，能看出完整业务范围。",
              excellent: "页面覆盖完整，并能体现页面之间的层级关系和重点信息。",
              unqualified: "缺少核心页面，或页面内容不足以表达题目要求。",
              evidence: "页面列表、页面截图、导航结构。"
            },
            {
              id: "D1-C2",
              name: "信息架构清晰",
              score: 20,
              qualified: "页面信息分区清楚，主要内容可理解。",
              excellent: "信息层级合理，重点突出，用户能够快速理解页面目的。",
              unqualified: "信息堆叠混乱，无法判断页面功能或使用路径。",
              evidence: "页面结构截图、模块标题、内容层级分析。"
            }
          ]
        },
        {
          id: "D2",
          name: "交互表达",
          description: "评估原型是否体现核心操作路径、状态反馈和页面跳转关系。",
          score: 35,
          isGate: false,
          criteria: [
            {
              id: "D2-C1",
              name: "核心路径可走通",
              score: 20,
              qualified: "能从入口进入至少一个核心流程，并看到流程结果。",
              excellent: "核心路径完整，跳转自然，关键操作均有明确反馈。",
              unqualified: "核心流程无法点击或无法判断流程结果。",
              evidence: "点击路径、跳转截图、按钮状态。"
            },
            {
              id: "D2-C2",
              name: "状态表达充分",
              score: 15,
              qualified: "包含基本的成功、失败或空状态提示。",
              excellent: "关键状态完整，提示语清楚，能支撑真实产品评审。",
              unqualified: "缺少关键状态，无法判断交互边界。",
              evidence: "状态页截图、提示文本、交互组件状态。"
            }
          ]
        },
        {
          id: "D3",
          name: "视觉一致性",
          description: "评估页面布局、组件样式和视觉层级是否统一。",
          score: 25,
          isGate: false,
          criteria: [
            {
              id: "D3-C1",
              name: "界面风格一致",
              score: 25,
              qualified: "页面之间的布局、按钮、字体和色彩基本统一。",
              excellent: "视觉规范稳定，组件复用清晰，整体呈现接近真实产品原型。",
              unqualified: "页面风格明显割裂，影响理解和评审。",
              evidence: "多页面截图、组件样式对照。"
            }
          ]
        }
      ],
      gates: [
        { id: "G1", name: "原型入口可打开", rule: "必须提交 HTML 文件或可访问原型 URL，且至少能打开一个核心页面。", failResult: "不合格" }
      ],
      disqualifyRules: ["原型文件无法打开。", "提交内容不是本题要求的系统原型。"],
      suggestedAgentTypes: ["门槛项评审与证据获取 Agent", "单题评审 Agent"],
      suggestedSkillTypes: ["网页访问 Skill", "页面结构分析 Skill", "图片/截图理解 Skill"],
      reviewPoints: ["页面覆盖是否完整", "核心流程是否清楚", "页面结构是否易理解", "视觉和组件是否一致"]
    };
  }
  if (question.type === "代码项目题") {
    return {
      ...base,
      questionType: "代码项目题",
      studentIndicator: "项目需体现核心调用流程、异常处理和可复现运行说明，代码结构清楚。",
      dimensions: [
        {
          id: "D1",
          name: "核心实现流程",
          description: "评估代码是否完成题目要求的主要功能链路。",
          score: 45,
          isGate: true,
          criteria: [
            {
              id: "D1-C1",
              name: "主流程完整",
              score: 30,
              qualified: "代码中能够识别输入、处理、输出的主流程。",
              excellent: "主流程完整清晰，关键参数、调用步骤和结果处理逻辑明确。",
              unqualified: "无法识别核心主流程，或代码与题目要求无关。",
              evidence: "入口文件、核心函数、调用链摘要。"
            },
            {
              id: "D1-C2",
              name: "结果展示或输出",
              score: 15,
              qualified: "具备基本结果输出或展示方式。",
              excellent: "输出结构清晰，便于验证和复用。",
              unqualified: "没有可识别的结果输出。",
              evidence: "输出代码片段、运行截图、README 示例。"
            }
          ]
        },
        {
          id: "D2",
          name: "异常处理与工程说明",
          description: "评估异常处理、运行说明和交付可复现性。",
          score: 55,
          isGate: false,
          criteria: [
            {
              id: "D2-C1",
              name: "异常处理",
              score: 25,
              qualified: "对接口失败、参数缺失或运行错误有基本处理。",
              excellent: "异常分支清楚，错误提示可理解，并能避免程序直接崩溃。",
              unqualified: "完全没有异常处理，或错误会直接阻断主流程。",
              evidence: "try/catch、错误判断、异常提示代码。"
            },
            {
              id: "D2-C2",
              name: "运行说明",
              score: 30,
              qualified: "README 能说明依赖安装、启动命令和关键配置。",
              excellent: "运行步骤可复现，包含环境变量、示例输入和常见问题说明。",
              unqualified: "缺少 README 或无法根据说明运行项目。",
              evidence: "README 运行段落、依赖文件、配置示例。"
            }
          ]
        }
      ],
      gates: [
        { id: "G1", name: "代码材料可读取", rule: "必须提交代码压缩包或代码仓库地址，并能识别入口文件。", failResult: "不合格" },
        { id: "G2", name: "运行说明存在", rule: "必须提交 README 或等价运行说明。", failResult: "不合格" }
      ],
      disqualifyRules: ["代码无法解压或无法读取。", "缺少核心入口文件。", "提交项目与题目要求无关。"],
      suggestedAgentTypes: ["门槛项评审与证据获取 Agent", "单题评审 Agent"],
      suggestedSkillTypes: ["代码/压缩包 Skill", "文档读取 Skill", "图片/截图理解 Skill"],
      reviewPoints: ["核心调用链是否完整", "异常处理是否明确", "运行说明是否可复现", "代码结构是否清楚"]
    };
  }
  if (question.type === "单选题") {
    return {
      ...base,
      questionType: "单选题",
      studentIndicator: "答案需选择正确选项，并体现对核心概念边界的准确理解。",
      dimensions: [
        {
          id: "D1",
          name: "答案准确性",
          description: "评估选项是否正确、是否符合题目核心概念。",
          score: 70,
          isGate: true,
          criteria: [
            {
              id: "D1-C1",
              name: "选项正确",
              score: 70,
              qualified: "选择正确答案。",
              excellent: "选择正确答案，且与核心概念完全匹配。",
              unqualified: "未作答、选择无效选项或答案错误。",
              evidence: "学生选项、标准答案、选项文本。"
            }
          ]
        },
        {
          id: "D2",
          name: "概念理解",
          description: "评估学生是否理解选项背后的概念差异。",
          score: 30,
          isGate: false,
          criteria: [
            {
              id: "D2-C1",
              name: "概念边界",
              score: 30,
              qualified: "能说明正确选项对应的基础概念。",
              excellent: "能够区分相近概念，并说明为什么其他选项不合适。",
              unqualified: "无法说明选择依据。",
              evidence: "作答解释、概念关键词。"
            }
          ]
        }
      ],
      gates: [
        { id: "G1", name: "有效作答", rule: "必须提交一个有效选项。", failResult: "不合格" }
      ],
      disqualifyRules: ["未作答。", "提交无效选项。"],
      suggestedAgentTypes: ["单题评审 Agent"],
      suggestedSkillTypes: ["文本评审 Skill"],
      reviewPoints: ["选项是否正确", "是否理解核心概念", "是否能说明判断依据"]
    };
  }
  if (question.type === "简答题" || question.type === "应用题") {
    return {
      ...base,
      questionType: question.type,
      studentIndicator: "答案需回应题目核心要求，观点明确，表达清楚，并给出必要依据。",
      dimensions: [
        {
          id: "D1",
          name: "内容覆盖",
          description: "评估答案是否覆盖题目要求的核心考点和必要内容。",
          score: 40,
          isGate: true,
          criteria: [
            {
              id: "D1-C1",
              name: "核心考点覆盖",
              score: 40,
              qualified: "覆盖题目要求的主要考点。",
              excellent: "核心考点覆盖完整，并能结合题目语境展开说明。",
              unqualified: "答案为空、明显偏题，或缺少核心考点。",
              evidence: "答案正文、核心关键词、题目要求对照。"
            }
          ]
        },
        {
          id: "D2",
          name: "逻辑表达与依据",
          description: "评估答案结构、表达清晰度和依据充分性。",
          score: 60,
          isGate: false,
          criteria: [
            {
              id: "D2-C1",
              name: "表达清晰",
              score: 30,
              qualified: "观点基本明确，语句通顺。",
              excellent: "结构清晰，观点、理由和结论衔接自然。",
              unqualified: "表达混乱，难以判断观点。",
              evidence: "答案结构、关键句、结论表达。"
            },
            {
              id: "D2-C2",
              name: "依据充分",
              score: 30,
              qualified: "能给出基本依据或案例。",
              excellent: "依据具体，能支撑观点，并能结合实际场景分析。",
              unqualified: "只有结论，没有依据或说明。",
              evidence: "案例描述、判断依据、解释段落。"
            }
          ]
        }
      ],
      gates: [
        { id: "G1", name: "有效文本作答", rule: "必须提交与题目相关的有效文本答案。", failResult: "不合格" }
      ],
      disqualifyRules: ["答案为空。", "答案与题目明显无关。", "内容无法体现核心考点。"],
      suggestedAgentTypes: ["门槛项评审与证据获取 Agent", "单题评审 Agent"],
      suggestedSkillTypes: ["文本评审 Skill"],
      reviewPoints: ["是否回应题目", "观点是否清楚", "依据是否充分", "表达是否连贯"]
    };
  }
  return {
    ...base,
    questionType: question.type || "内容分析题",
    studentIndicator: "提交内容需完整回应题目要求，结构清楚，并给出分析过程和判断依据。",
    dimensions: [
      {
        id: "D1",
        name: "内容完整性",
        description: "评估提交内容是否覆盖题目要求。",
        score: 40,
        isGate: true,
        criteria: [
          {
            id: "D1-C1",
            name: "任务要求覆盖",
            score: 40,
            qualified: "基本覆盖题目要求。",
            excellent: "覆盖完整，并能体现清晰的分析过程。",
            unqualified: "未提交有效内容或明显偏题。",
            evidence: "文档结构、标题、正文内容。"
          }
        ]
      },
      {
        id: "D2",
        name: "结构表达与依据",
        description: "评估内容结构、表达和判断依据。",
        score: 60,
        isGate: false,
        criteria: [
          {
            id: "D2-C1",
            name: "结构表达",
            score: 30,
            qualified: "结构基本清楚，表达可理解。",
            excellent: "结构清晰，层次明确，阅读体验好。",
            unqualified: "结构混乱，难以理解。",
            evidence: "标题层级、段落组织、表达质量。"
          },
          {
            id: "D2-C2",
            name: "分析依据",
            score: 30,
            qualified: "能给出基本分析依据。",
            excellent: "依据充分，结论与材料之间关系清楚。",
            unqualified: "缺少分析依据。",
            evidence: "引用材料、推理过程、结论说明。"
          }
        ]
      }
    ],
    gates: [
      { id: "G1", name: "有效内容提交", rule: "必须提交与题目相关的有效内容。", failResult: "不合格" }
    ],
    disqualifyRules: ["未提交有效内容。", "内容与题目明显不匹配。"],
    suggestedAgentTypes: ["门槛项评审与证据获取 Agent", "单题评审 Agent"],
    suggestedSkillTypes: ["文档读取 Skill", "文本评审 Skill"],
    reviewPoints: ["任务要求是否覆盖", "结构是否清楚", "依据是否充分", "结论是否明确"]
  };
}

function getSkillPlanOutput(question) {
  const rubric = getRubricOutput(question);
  const commonReviewOutput = [
    { name: "证据包编号", description: "本 Skill 生成的证据包唯一编号", format: "字符串" },
    { name: "证据摘要", description: "对可用于评分的核心证据进行摘要", format: "文本" },
    { name: "证据明细", description: "可追溯的截图、文本片段、文件路径、URL 或代码片段", format: "数组" },
    { name: "缺失证据", description: "无法获取但评分需要关注的证据项", format: "数组" }
  ];
  const textSkill = {
    skillKey: "text_review_skill",
    skillName: "文本评审 Skill",
    skillType: "文本内容理解",
    parallelGroup: "evidence_group_text",
    dimensions: rubric.dimensions.map((d) => d.name),
    criteria: rubric.dimensions.flatMap((d) => d.criteria.map((c) => c.name)),
    inputFields: [
      { name: "题目内容", description: "管理员创建的题目正文", format: "文本", required: true },
      { name: "提交文本", description: "学生提交的答案正文或 Markdown 内容", format: "文本/Markdown", required: true },
      { name: "评审指标", description: "本题已确认的 Agent 评审指标", format: "结构化对象", required: true }
    ],
    outputFields: commonReviewOutput,
    tools: ["文本读取 Tool", "Markdown 解析 Tool", "关键词提取 Tool"],
    evidenceRequirements: ["作答正文", "核心观点", "题目要求覆盖情况", "缺失内容"]
  };

  if (question.type === "系统实现题") {
    return [
      {
        skillKey: "web_access_skill",
        skillName: "网页访问 Skill",
        skillType: "可访问系统验证",
        parallelGroup: "evidence_group_1",
        dimensions: ["功能完整性"],
        criteria: ["系统可访问性", "核心流程完整性", "基础异常反馈"],
        inputFields: [
          { name: "系统访问 URL", description: "学生提交的线上系统地址", format: "URL", required: true },
          { name: "核心流程要求", description: "题目中要求验证的主要页面和操作路径", format: "文本数组", required: true },
          { name: "截图要求", description: "需要截取的关键页面或状态", format: "文本数组", required: false }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "URL 可访问状态", description: "HTTP 状态、加载状态和错误信息", format: "对象" },
          { name: "页面截图", description: "首页、核心流程页和结果页截图地址", format: "URL 数组" },
          { name: "交互路径", description: "可验证的点击路径和流程结果", format: "数组" }
        ]),
        tools: ["URL 校验 Tool", "浏览器截图 Tool", "页面交互 Tool"],
        evidenceRequirements: ["URL 状态码", "关键页面截图", "核心流程点击路径", "页面错误信息"]
      },
      {
        skillKey: "document_reader_skill",
        skillName: "文档读取 Skill",
        skillType: "交付说明解析",
        parallelGroup: "evidence_group_1",
        dimensions: ["工程交付规范"],
        criteria: ["README 完整性", "交付材料一致性"],
        inputFields: [
          { name: "README 地址", description: "学生提交的 README 文件地址或正文", format: "URL/Markdown 文本", required: true },
          { name: "题目要求", description: "题目内容和提交文件要求", format: "文本", required: true }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "项目说明摘要", description: "README 中关于项目目标、功能和运行方式的摘要", format: "对象" },
          { name: "运行说明", description: "安装依赖、启动命令、访问方式", format: "对象" }
        ]),
        tools: ["Markdown 解析 Tool", "文档文本提取 Tool"],
        evidenceRequirements: ["项目简介", "启动命令", "功能说明", "缺失说明项"]
      },
      {
        skillKey: "code_archive_skill",
        skillName: "代码/压缩包 Skill",
        skillType: "项目结构与代码读取",
        parallelGroup: "evidence_group_1",
        dimensions: ["工程交付规范"],
        criteria: ["代码结构可读性", "交付材料一致性"],
        inputFields: [
          { name: "项目代码压缩包", description: "学生上传的 zip/rar/tar 代码包或仓库导出包", format: "文件 URL", required: true },
          { name: "入口识别规则", description: "需要优先识别的入口文件类型", format: "数组", required: false }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "项目目录树", description: "解压后的目录结构", format: "树形数组" },
          { name: "入口文件", description: "识别出的主要入口文件", format: "文件路径" },
          { name: "核心代码摘要", description: "与题目要求相关的关键代码片段摘要", format: "数组" }
        ]),
        tools: ["压缩包解压 Tool", "文件树读取 Tool", "代码文本读取 Tool"],
        evidenceRequirements: ["解压结果", "目录结构", "入口文件", "核心模块"]
      }
    ];
  }
  if (question.type === "系统原型设计题") {
    return [
      {
        skillKey: "prototype_access_skill",
        skillName: "网页访问 Skill",
        skillType: "原型访问与截图",
        parallelGroup: "evidence_group_1",
        dimensions: ["原型完整性", "交互表达", "视觉一致性"],
        criteria: ["页面覆盖完整", "核心路径可走通", "界面风格一致"],
        inputFields: [
          { name: "原型 URL 或 HTML 文件", description: "学生提交的原型访问地址或 HTML 文件地址", format: "URL/文件 URL", required: true },
          { name: "目标页面清单", description: "题目要求覆盖的页面", format: "数组", required: true }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "页面截图", description: "核心页面截图地址", format: "URL 数组" },
          { name: "可点击路径", description: "可验证的跳转路径和交互状态", format: "数组" }
        ]),
        tools: ["HTML 打开 Tool", "浏览器截图 Tool", "页面交互 Tool"],
        evidenceRequirements: ["页面列表", "页面截图", "点击路径", "状态反馈"]
      },
      {
        skillKey: "page_structure_skill",
        skillName: "页面结构分析 Skill",
        skillType: "信息架构与组件分析",
        parallelGroup: "evidence_group_1",
        dimensions: ["原型完整性", "交互表达", "视觉一致性"],
        criteria: ["信息架构清晰", "状态表达充分", "界面风格一致"],
        inputFields: [
          { name: "页面截图", description: "网页访问 Skill 输出的页面截图", format: "URL 数组", required: true },
          { name: "页面 DOM 摘要", description: "HTML 结构和主要组件信息", format: "对象", required: false }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "页面层级分析", description: "页面信息结构和模块层级", format: "对象" },
          { name: "组件一致性分析", description: "按钮、表单、导航等组件的一致性证据", format: "对象" }
        ]),
        tools: ["DOM 结构读取 Tool", "截图视觉分析 Tool"],
        evidenceRequirements: ["模块层级", "导航关系", "组件状态", "视觉一致性"]
      }
    ];
  }
  if (question.type === "代码项目题") {
    return [
      {
        skillKey: "code_archive_skill",
        skillName: "代码/压缩包 Skill",
        skillType: "代码项目读取",
        parallelGroup: "evidence_group_1",
        dimensions: ["核心实现流程", "异常处理与工程说明"],
        criteria: ["主流程完整", "结果展示或输出", "异常处理"],
        inputFields: [
          { name: "项目代码压缩包", description: "学生提交的代码包", format: "文件 URL", required: true },
          { name: "题目要求", description: "题目内容和核心实现要求", format: "文本", required: true }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "代码目录树", description: "项目结构", format: "树形数组" },
          { name: "调用链摘要", description: "输入、处理、调用、输出的代码链路", format: "对象" },
          { name: "异常处理摘要", description: "错误处理和提示逻辑", format: "数组" }
        ]),
        tools: ["压缩包解压 Tool", "代码文本读取 Tool", "入口识别 Tool"],
        evidenceRequirements: ["入口文件", "核心函数", "异常分支", "输出逻辑"]
      },
      {
        skillKey: "document_reader_skill",
        skillName: "文档读取 Skill",
        skillType: "运行说明解析",
        parallelGroup: "evidence_group_1",
        dimensions: ["异常处理与工程说明"],
        criteria: ["运行说明"],
        inputFields: [
          { name: "README 地址", description: "README 文件地址或正文", format: "URL/Markdown 文本", required: true }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "运行步骤", description: "依赖安装、启动命令、配置项", format: "对象" }
        ]),
        tools: ["Markdown 解析 Tool", "文档文本提取 Tool"],
        evidenceRequirements: ["安装命令", "启动命令", "环境变量说明", "示例输入输出"]
      },
      {
        skillKey: "image_evidence_skill",
        skillName: "图片/截图理解 Skill",
        skillType: "运行截图验证",
        parallelGroup: "evidence_group_1",
        dimensions: ["核心实现流程"],
        criteria: ["结果展示或输出"],
        inputFields: [
          { name: "接口调用截图", description: "学生提交的运行截图或接口返回截图", format: "图片 URL 数组", required: false }
        ],
        outputFields: commonReviewOutput.concat([
          { name: "截图识别结果", description: "截图中的关键输出、错误信息和运行状态", format: "对象" }
        ]),
        tools: ["OCR Tool", "图片理解 Tool"],
        evidenceRequirements: ["运行结果截图", "接口返回截图", "错误信息截图"]
      }
    ];
  }
  if (question.type === "Markdown 内容题") {
    return [
      {
        ...textSkill,
        skillKey: "markdown_reader_skill",
        skillName: "文档读取 Skill",
        skillType: "Markdown 结构解析",
        tools: ["Markdown 解析 Tool", "标题结构提取 Tool", "文本摘要 Tool"],
        evidenceRequirements: ["标题层级", "核心段落", "结论", "缺失章节"]
      }
    ];
  }
  return [textSkill];
}

function getDimensionItems(rubric) {
  return rubric.dimensions.map((dimension) => {
    const criteria = dimension.criteria
      .map((criterion) => `${criterion.name}${criterion.score}分：合格=${criterion.qualified}；优秀=${criterion.excellent}；不合格=${criterion.unqualified}；证据=${criterion.evidence}`)
      .join(" / ");
    return `${dimension.name}${dimension.score}分（${dimension.isGate ? "含门槛项" : "非门槛项"}）：${dimension.description}；指标：${criteria}`;
  });
}

function getRubricOutputItems(rubric) {
  return [
    `题目编号：${rubric.questionId}`,
    `题目类型：${rubric.questionType}`,
    `学生展示指标：${rubric.studentIndicator}（${rubric.studentIndicator.length}字，不超过100字）`,
    ...getDimensionItems(rubric),
    `门槛项：${rubric.gates.map((gate) => `${gate.name}：${gate.rule}；不满足则${gate.failResult}`).join(" / ")}`,
    `不合格判定规则：${rubric.disqualifyRules.join("；")}`,
    `建议使用的评审 Agent 类型：${rubric.suggestedAgentTypes.join("、")}`,
    `建议使用的 Skill 类型：${rubric.suggestedSkillTypes.join("、")}`,
    `评审关注点：${rubric.reviewPoints.join("；")}`
  ];
}

function getSkillPlanOutputItems(skillPlan) {
  return skillPlan.map((skill, index) => {
    const inputs = skill.inputFields
      .map((field) => `${field.name}（${field.description}，格式：${field.format}，${field.required ? "必填" : "可选"}）`)
      .join("；");
    const outputs = skill.outputFields
      .map((field) => `${field.name}（${field.description}，格式：${field.format}）`)
      .join("；");
    return `${index + 1}. ${skill.skillName}：类型=${skill.skillType}；执行组=${skill.parallelGroup}；对应维度=${skill.dimensions.join("、")}；对应指标=${skill.criteria.join("、")}；输入字段=${inputs}；输出证据字段=${outputs}；可调用 Tool=${skill.tools.join("、")}；证据包要求=${skill.evidenceRequirements.join("、")}`;
  });
}

function getSkillPlanSummary(skillPlan) {
  return skillPlan.map((skill) => `${skill.skillName}（${skill.skillType}）`).join("；");
}

function getCriterionCount(rubric) {
  return rubric.dimensions.reduce((total, dimension) => total + dimension.criteria.length, 0);
}

function getProcessItems(mode) {
  if (mode === "skill") {
    return [
      "读取题目类型、评审指标和提交文件要求",
      "匹配可用 Skill 清单",
      "为每个评审维度分配证据获取方式",
      "生成固定 Skill 计划和证据包要求"
    ];
  }
  if (mode === "save") {
    return [
      "校验管理员确认后的指标内容",
      "保存评价指标版本",
      "保存固定 Skill 计划版本",
      "生成后续学生评审可调用的配置"
    ];
  }
  if (mode === "schema") {
    return [
      "拆分评审维度",
      "生成每个维度下的评价指标",
      "补充优秀、达标、未达标标准",
      "整理门槛项和不合格判定规则"
    ];
  }
  return [
    "读取题目内容和提交文件要求",
    "识别题目类型",
    "生成学生展示指标",
    "生成 Agent 评审指标草案"
  ];
}

function renderQuestionIoGroup(question, mode) {
  const rubric = getRubricOutput(question);
  const skillPlan = getSkillPlanOutput(question);
  const inputItems = mode === "skill"
    ? [
        `题目编号：${rubric.questionId}`,
        `题目类型：${rubric.questionType}`,
        `题目内容：${question.content}`,
        `提交文件要求：${question.submitRequirements}`,
        `学生展示指标：${rubric.studentIndicator}`,
        ...getDimensionItems(rubric),
        `门槛项：${rubric.gates.map((gate) => `${gate.name}：${gate.rule}`).join("；")}`,
        "可用 Skill 清单：文本评审、文档读取、图片理解、视频理解、代码/压缩包、网页访问"
      ]
    : mode === "save"
      ? [
          `题目编号：${question.id}`,
          `确认后的学生展示指标：${rubric.studentIndicator}`,
          `确认后的 Agent 评审指标：${rubric.dimensions.length} 个维度、${getCriterionCount(rubric)} 条指标、${rubric.gates.length} 条门槛项`,
          `确认后的不合格判定规则：${rubric.disqualifyRules.join("；")}`,
          `固定 Skill 计划：${getSkillPlanSummary(skillPlan)}`
        ]
      : [
          `题目编号：${question.id}`,
          `题目内容：${question.content}`,
          `提交文件要求：${question.submitRequirements}`
        ];

  const outputItems = mode === "skill"
    ? [
        ...getSkillPlanOutputItems(skillPlan),
        `证据包归档规则：按评审维度“${rubric.dimensions.map((dimension) => dimension.name).join("、")}”归档，保留证据来源、证据摘要和缺失证据`,
        "执行方式：同一题目的 Skill 计划发布后固定，学生提交后按该计划并行取证"
      ]
    : mode === "save"
      ? [
          `评价指标版本：metric_${question.id}_v1`,
          `Skill 计划版本：skill_plan_${question.id}_v1`,
          `保存内容：题目类型=${rubric.questionType}；学生展示指标；Agent 评审指标；门槛项；不合格判定规则；固定 Skill 计划`,
          "后续调用：学生提交该题作业后，直接读取此版本配置进入门槛项评审与证据获取"
        ]
      : [
          ...getRubricOutputItems(rubric)
        ];

  return `
    <div class="log-io-group">
      <div class="io-question-title">${question.index + 1}. ${escapeHtml(question.title)}</div>
      <div class="io-block io-input">
        <h4>输入</h4>
        <ul>${inputItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="io-block io-process">
        <h4>处理中</h4>
        <ul>${getProcessItems(mode).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="io-block io-output" hidden>
        <h4>输出</h4>
        <ul>${outputItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

function setLogIo(logKey, html) {
  const item = document.querySelector(`[data-log="${logKey}"]`);
  if (!item) return;
  let io = item.querySelector(".log-io");
  if (!io) {
    io = document.createElement("div");
    io.className = "log-io";
    item.appendChild(io);
  }
  io.innerHTML = html;
}

function clearLogIo(logKey) {
  const item = document.querySelector(`[data-log="${logKey}"]`);
  const io = item?.querySelector(".log-io");
  if (io) io.remove();
}

function getAdminAgentIoHtml(logKey) {
  const selectedQuestions = getSelectedQuestions();
  if (!selectedQuestions.length) return "";
  if (logKey === "rubric-agent") {
    return selectedQuestions.map((q) => renderQuestionIoGroup(q, "rubric")).join("");
  }
  if (logKey === "skill-agent") {
    return selectedQuestions.map((q) => renderQuestionIoGroup(q, "skill")).join("");
  }
  if (logKey === "save-config") {
    return selectedQuestions.map((q) => renderQuestionIoGroup(q, "save")).join("");
  }
  if (logKey !== "rubric-schema") return "";
  return selectedQuestions.map((q) => {
    const rubric = getRubricOutput(q);
    return `
      <div class="log-io-group">
        <div class="io-question-title">${q.index + 1}. ${escapeHtml(q.title)}</div>
        <div class="io-block io-input">
          <h4>输入</h4>
          <ul>
            <li>${escapeHtml(`题目类型：${q.type}`)}</li>
            <li>${escapeHtml(`学生展示指标：${rubric.studentIndicator}`)}</li>
            <li>${escapeHtml(`初始评价维度：${rubric.dimensions.map((dimension) => `${dimension.name}${dimension.score}分`).join("；")}`)}</li>
            <li>${escapeHtml(`指标数量：${getCriterionCount(rubric)} 条`)}</li>
          </ul>
        </div>
        <div class="io-block io-process">
          <h4>处理中</h4>
          <ul>
            ${getProcessItems("schema").map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        <div class="io-block io-output" hidden>
          <h4>输出</h4>
          <ul>
            ${getRubricOutputItems(rubric).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }).join("");
}

function createIoGroup(title, inputItems, outputItems, processItems = ["接收输入数据", "执行规则判断", "整理结构化结果"]) {
  return `
    <div class="log-io-group">
      <div class="io-question-title">${escapeHtml(title)}</div>
      <div class="io-block io-input">
        <h4>输入</h4>
        <ul>${inputItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="io-block io-process">
        <h4>处理中</h4>
        <ul>${processItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="io-block io-output" hidden>
        <h4>输出</h4>
        <ul>${outputItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

function switchDemoScoringStep(step) {
  document.querySelectorAll("[data-scoring-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.scoringPanel === step);
  });
  document.querySelectorAll("[data-step-label]").forEach((label) => {
    const isSelect = label.dataset.stepLabel === "select";
    label.classList.toggle("active", label.dataset.stepLabel === step);
    label.classList.toggle("done", step === "edit" && isSelect);
  });
}

function createDemoCriteria(question, index) {
  const rubric = getRubricOutput(question);
  const skillPlan = getSkillPlanOutput(question);

  return `
    <article class="criteria-card" data-qindex="${index}">
      <div class="criteria-head">
        <strong>${index + 1}. ${question.title}</strong>
        <div class="criteria-head-tags">
          <span class="pill">${rubric.questionType}</span>
          <span class="pill green">${rubric.dimensions.length} 个维度 / ${getCriterionCount(rubric)} 条指标</span>
        </div>
      </div>
      <div class="criteria-body">
        <label class="summary-label">学生展示指标（100字以内，来自 Agent 评审指标的简要总结）</label>
        <div class="criterion-name" contenteditable="true">${escapeHtml(rubric.studentIndicator)}</div>
        <div class="rubric-dimension-list">
          ${rubric.dimensions.map((dimension) => `
            <section class="rubric-dimension">
              <div class="rubric-dimension-head">
                <strong>${escapeHtml(dimension.name)} · ${dimension.score}分</strong>
                <span class="pill ${dimension.isGate ? "amber" : ""}">${dimension.isGate ? "含门槛项" : "评分维度"}</span>
              </div>
              <p>${escapeHtml(dimension.description)}</p>
              <div class="rubric-criteria-list">
                ${dimension.criteria.map((criterion) => `
                  <div class="rubric-criterion-detail">
                    <div class="criterion-row-title">
                      <strong>${escapeHtml(criterion.id)} ${escapeHtml(criterion.name)} · ${criterion.score}分</strong>
                      <span>${escapeHtml(criterion.evidence)}</span>
                    </div>
                    <div class="standard-grid">
                      <div class="standard-card excellent">
                        <h4>优秀要求</h4>
                        <div class="standard-box" contenteditable="true">${escapeHtml(criterion.excellent)}</div>
                      </div>
                      <div class="standard-card qualified">
                        <h4>合格要求</h4>
                        <div class="standard-box" contenteditable="true">${escapeHtml(criterion.qualified)}</div>
                      </div>
                      <div class="standard-card unqualified">
                        <h4>不合格判定</h4>
                        <div class="standard-box" contenteditable="true">${escapeHtml(criterion.unqualified)}</div>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
        <div class="rubric-meta-grid">
          <div>
            <h4>门槛项</h4>
            <ul>${rubric.gates.map((gate) => `<li>${escapeHtml(`${gate.name}：${gate.rule}`)}</li>`).join("")}</ul>
          </div>
          <div>
            <h4>不合格判定规则</h4>
            <ul>${rubric.disqualifyRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>
          </div>
          <div>
            <h4>建议 Skill</h4>
            <ul>${skillPlan.map((skill) => `<li>${escapeHtml(`${skill.skillName}：${skill.dimensions.join("、")}`)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
      <div class="criteria-actions">
        <button class="mini-btn" onclick="regenerateDemoOneRubric(${index})">重新生成</button>
        <button class="mini-btn primary" onclick="confirmDemoCriterion(this)">确认修改</button>
      </div>
    </article>
  `;
}

function confirmDemoCriterion(btn) {
  const card = btn.closest(".criteria-card");
  const title = card?.querySelector(".criteria-head strong")?.textContent.trim() || "当前题目";
  showDemoToast(`${title} 的评价指标已确认`);
}

async function generateDemoSelectedRubrics() {
  if (!demoSelectedIndexes.length) return;
  switchDemoScoringStep("edit");
  await simulateRubricGeneration();
  renderDemoCriteria(demoSelectedIndexes);
  const desc = document.getElementById("demoScoringDesc");
  if (desc) desc.textContent = `已为 ${demoSelectedIndexes.length} 个题目生成评价指标，可直接修改，也可以单题重新生成。`;
}

function renderDemoCriteria(indexes) {
  const list = document.getElementById("demoCriteriaList");
  if (!list) return;
  list.innerHTML = indexes
    .map((idx) => createDemoCriteria(demoCurrentQuestions[idx], idx))
    .join("");
}

function backDemoScoringSelection() {
  switchDemoScoringStep("select");
}

async function regenerateDemoAllRubrics() {
  if (!demoSelectedIndexes.length) return;
  await simulateRubricGeneration();
  renderDemoCriteria(demoSelectedIndexes);
}

async function regenerateDemoOneRubric(index) {
  const previousIndexes = demoSelectedIndexes.slice();
  demoSelectedIndexes = [index];
  await simulateRubricGeneration();
  demoSelectedIndexes = previousIndexes;
  const existing = document.querySelector(`.criteria-card[data-qindex="${index}"]`);
  if (existing) existing.outerHTML = createDemoCriteria(demoCurrentQuestions[index], index);
}

async function saveDemoAllRubrics() {
  await runLogSequence([
    {
      key: "save-config",
      ioHtml: getAdminAgentIoHtml("save-config"),
      running: "正在模拟保存评价指标，并触发评审 Skill 确定 Agent 生成固定 Skill 计划。",
      done: "已保存评价指标和固定 Skill 计划。后续学生提交作业时将直接使用该评审配置。"
    }
  ]);
  showDemoToast("保存成功，评价指标与固定 Skill 计划已写入配置，即将关闭页面。", "success", 1200);
  await sleep(900);
  closeDemoScoringWizard();
}

async function simulateRubricGeneration() {
  const btn = document.querySelector("[data-action='generate-rubric']");
  if (btn) btn.disabled = true;
  const selectedQuestions = getSelectedQuestions();
  const dimensionCount = selectedQuestions.reduce((total, question) => total + getRubricOutput(question).dimensions.length, 0);
  const criterionCount = selectedQuestions.reduce((total, question) => total + getCriterionCount(getRubricOutput(question)), 0);
  const gateCount = selectedQuestions.reduce((total, question) => total + getRubricOutput(question).gates.length, 0);
  await runLogSequence([
    {
      key: "rubric-agent",
      ioHtml: getAdminAgentIoHtml("rubric-agent"),
      running: "正在读取题目编号、题目内容、提交文件要求，识别题目类型。",
      done: "已完成所选题目的题目类型识别、学生展示指标和 Agent 评审指标草案。"
    },
    {
      key: "rubric-schema",
      ioHtml: getAdminAgentIoHtml("rubric-schema"),
      running: "正在生成评审维度、指标分值、合格标准、优秀标准和门槛项。",
      done: `已生成 ${dimensionCount} 个评审维度、${criterionCount} 条评审指标、${gateCount} 条门槛项。`
    },
    {
      key: "skill-agent",
      ioHtml: getAdminAgentIoHtml("skill-agent"),
      running: "正在根据题目类型、提交文件要求和评审指标确定固定 Skill 计划。",
      done: "已固定网页访问 Skill、文档读取 Skill、代码/压缩包 Skill。"
    },
    {
      key: "save-config",
      ioHtml: getAdminAgentIoHtml("save-config"),
      running: "正在模拟保存题目配置、评价指标和 Skill 计划。",
      done: "已生成发布前配置，可由管理员继续修改后保存。"
    }
  ]);
  reveal("[data-rubric-result]");
  reveal("[data-skill-result]");
  if (btn) btn.disabled = false;
}

function getStudentSubmission(mode) {
  const url = mode === "fail" ? "" : "https://demo.example.com/ai-web-app";
  const question = {
    id: "q_coding_web_001",
    type: "系统实现题",
    title: "AI Coding 单文件 Web 系统实现",
    content: "使用 AI Coding 工具完成一个可运行的 Web 系统，核心功能流程能够完整走通，并提交系统访问 URL、README 文档和项目代码压缩包。",
    submitRequirements: "系统访问 URL、README 文档、项目代码压缩包"
  };
  const rubric = getRubricOutput(question);
  const skillPlan = getSkillPlanOutput(question);
  return {
    studentId: "stu_001",
    courseId: "course_ai_001",
    questionId: question.id,
    questionType: rubric.questionType,
    questionTitle: question.title,
    questionContent: question.content,
    submitRequirements: question.submitRequirements,
    rubric,
    skillPlan,
    files: {
      url,
      readme: "https://oss.example.com/readme.md",
      zip: "https://oss.example.com/project.zip",
      text: "本作品实现了首页、任务列表、任务详情和结果展示页面，支持基础流程跳转，并在 README 中说明了运行方式和主要功能。"
    }
  };
}

function getStudentProcessItems(key) {
  const map = {
    "read-config": ["读取课程编号和题目编号", "查询评价指标版本", "查询固定 Skill 计划版本", "返回本题评审配置"],
    "gate-agent": ["检查必需提交材料", "比对门槛项和不合格规则", "判断是否进入后续证据获取", "生成门槛项结果"],
    "skill-web": ["校验系统 URL", "打开核心页面", "截取关键页面", "模拟执行核心交互路径"],
    "skill-doc": ["读取 README 文档", "提取项目简介", "提取运行方式", "识别说明缺失项"],
    "skill-code": ["解压项目代码包", "识别项目目录结构", "读取入口文件", "提取核心代码摘要"],
    "evidence-merge": ["接收各 Skill 证据包", "按评审维度归档证据", "标记缺失证据", "生成结构化单题证据包"],
    "review-agent": ["读取结构化证据包", "按合格标准评分", "按优秀标准复核", "生成教师式评语和修改建议"],
    "fail-result": ["读取门槛失败原因", "生成不合格等级", "整理优点和问题", "生成修改建议"]
  };
  return map[key] || ["接收输入", "处理数据", "生成结果"];
}

function getStudentIoHtml(mode, key) {
  const data = getStudentSubmission(mode);
  const rubricItems = getRubricOutputItems(data.rubric);
  const skillPlanItems = getSkillPlanOutputItems(data.skillPlan);
  const skillPlanSummary = getSkillPlanSummary(data.skillPlan);
  const gateRules = data.rubric.gates.map((gate) => `${gate.name}：${gate.rule}`).join("；");
  const blocks = {
    "read-config": createIoGroup("后端读取评审配置", [
    `课程编号：${data.courseId}`,
    `题目编号：${data.questionId}`,
    "指标版本号：metric_q_coding_web_001_v1",
    "Skill 计划版本号：skill_plan_q_coding_web_001_v1"
  ], [
    `题目类型：${data.questionType}`,
    `提交文件要求：${data.submitRequirements}`,
    ...rubricItems,
    ...skillPlanItems
  ], getStudentProcessItems("read-config")),

    "gate-agent": createIoGroup("门槛项评审与证据获取 Agent", [
    `题目类型：${data.questionType}`,
    `题目内容：${data.questionContent}`,
    `提交文件要求：${data.submitRequirements}`,
    `作业列表：URL=${data.files.url || "未提交"}；README=${data.files.readme}；代码包=${data.files.zip}`,
    `门槛项：${gateRules}`,
    `不合格判定规则：${data.rubric.disqualifyRules.join("；")}`,
    `固定 Skill 计划：${skillPlanSummary}`
  ], mode === "fail" ? [
    "门槛项结果：不满足",
    "失败原因：未提交可访问系统 URL，无法验证核心页面和主要功能流程",
    "评语：当前作品已经提交了 README 和代码包，能看出基本项目方向；但系统访问入口缺失，无法完成核心功能验证，因此本次判定为不合格。",
    "优点：README 和代码包已提交，具备继续完善的基础。",
    "问题：缺少可访问系统 URL，无法验证首页、核心流程和结果页面。",
    "修改建议：补充可访问 URL，并在 README 中写清楚首页入口、主要操作路径和结果页面位置。",
    "后续动作：直接生成不合格结果，不进入 Skill/Tool 证据获取和单题正式评分"
  ] : [
    "门槛项结果：满足",
    "提交材料完整性：系统 URL、README、代码压缩包均已提交",
    `后续动作：按固定 Skill 计划创建 ${data.skillPlan.map((skill) => skill.skillName).join("、")} 证据获取任务`,
    `每个 Skill 输出：${data.skillPlan[0].outputFields.map((field) => field.name).join("、")}`
  ], getStudentProcessItems("gate-agent")),

    "fail-result": createIoGroup("门槛项不通过结果生成", [
      "门槛项结果：不满足",
      "失败原因：未提交可访问系统 URL",
      "题目要求：系统访问 URL、README 文档、项目代码压缩包"
    ], [
      "题目等级：不合格",
      "评语：当前缺少可访问系统地址，无法验证核心页面和主要功能流程",
      "优点：已提交 README 和代码包，能够看出基本作品方向",
      "问题：缺少核心访问入口",
      "修改建议：补充可访问 URL，并在 README 中说明操作路径"
    ], getStudentProcessItems("fail-result")),

    "skill-web": createIoGroup("网页访问 Skill / Tool", [
    `系统 URL：${data.files.url || "未提交"}`,
    "交互要求：打开首页，检查任务列表、任务详情和结果展示页面",
    `对应评审维度：${data.skillPlan[0].dimensions.join("、")}`,
    `对应评审指标：${data.skillPlan[0].criteria.join("、")}`,
    `Skill 输入字段：${data.skillPlan[0].inputFields.map((field) => `${field.name}/${field.format}`).join("；")}`,
    "证据包要求：可访问状态、页面截图、核心流程路径、错误信息"
  ], [
    "URL 校验结果：HTTP 200，可访问",
    "页面截图：已获取首页、任务详情页、结果展示页截图",
    "交互路径：点击任务列表进入详情页，返回结果页，流程可验证",
    "异常信息：未发现阻断性页面错误",
    `Skill 输出字段：${data.skillPlan[0].outputFields.map((field) => `${field.name}/${field.format}`).join("；")}`
  ], getStudentProcessItems("skill-web")),

    "skill-doc": createIoGroup("文档读取 Skill / Tool", [
    `README 地址：${data.files.readme}`,
    `对应评审维度：${data.skillPlan[1].dimensions.join("、")}`,
    `对应评审指标：${data.skillPlan[1].criteria.join("、")}`,
    `Skill 输入字段：${data.skillPlan[1].inputFields.map((field) => `${field.name}/${field.format}`).join("；")}`,
    "读取要求：项目简介、运行方式、主要功能、部署说明",
    "证据包要求：README 正文摘要、关键运行说明、缺失项"
  ], [
    "README 可读取：是",
    "项目简介：已说明系统目标和核心页面",
    "运行方式：包含本地启动与访问说明",
    "缺失项：异常状态和测试说明较少",
    `Skill 输出字段：${data.skillPlan[1].outputFields.map((field) => `${field.name}/${field.format}`).join("；")}`
  ], getStudentProcessItems("skill-doc")),

    "skill-code": createIoGroup("代码/压缩包 Skill / Tool", [
    `代码压缩包：${data.files.zip}`,
    `对应评审维度：${data.skillPlan[2].dimensions.join("、")}`,
    `对应评审指标：${data.skillPlan[2].criteria.join("、")}`,
    `Skill 输入字段：${data.skillPlan[2].inputFields.map((field) => `${field.name}/${field.format}`).join("；")}`,
    "读取要求：解压项目、识别目录结构、读取入口文件和关键模块",
    "证据包要求：文件树、入口文件、核心代码摘要、解压异常"
  ], [
    "解压结果：成功",
    "项目结构：index.html、assets、scripts、README.md",
    "入口文件：index.html",
    "核心代码摘要：包含任务列表渲染、页面切换和结果展示逻辑",
    `Skill 输出字段：${data.skillPlan[2].outputFields.map((field) => `${field.name}/${field.format}`).join("；")}`
  ], getStudentProcessItems("skill-code")),

    "evidence-merge": createIoGroup("证据包汇总", [
    "网页访问证据包：可访问状态、截图、交互路径",
    "文档读取证据包：README 摘要、运行说明",
    "代码/压缩包证据包：项目结构、入口文件、核心代码摘要",
    `评审维度：${data.rubric.dimensions.map((dimension) => `${dimension.name}${dimension.score}分`).join("；")}`,
    `评审指标：${data.rubric.dimensions.flatMap((dimension) => dimension.criteria.map((criterion) => `${criterion.name}${criterion.score}分`)).join("；")}`
  ], [
    "结构化单题证据包：已按功能完整性、工程交付规范归档",
    "缺失证据：异常状态说明不足，测试说明不足",
    "可验证引用：URL 检查结果、README 摘要、代码文件树",
    "输出格式：{题目编号, 证据包编号, 维度证据列表, 缺失证据列表, 可追溯引用列表}"
  ], getStudentProcessItems("evidence-merge")),

    "review-agent": createIoGroup("单题评审 Agent", [
    "结构化单题证据包：功能完整性证据、工程交付规范证据",
    `题目类型：${data.questionType}`,
    ...getDimensionItems(data.rubric),
    `不合格判定规则：${data.rubric.disqualifyRules.join("；")}`
  ], [
    "题目总分：88 分",
    "题目等级：优秀",
    "评语：系统可访问，核心流程能够验证，README 和代码材料较完整",
    "优点：核心流程完整；提交材料完整；页面跳转关系清楚",
    "缺点：异常状态和空数据状态说明还不够充分",
    "修改建议：补充异常状态和空数据状态说明",
    "评价依据：URL 可访问结果、关键页面截图、README 摘要、代码目录树与入口文件",
    "输出格式：{题目编号, 题目总分, 题目等级, 评语, 优点, 缺点, 修改建议, 评价依据, 指标得分明细}"
  ], getStudentProcessItems("review-agent"))
  };
  return blocks[key] || "";
}

async function simulateStudentReview(mode = "pass") {
  const btn = document.querySelector("[data-action='submit-review']");
  if (btn) btn.disabled = true;
  const passResult = document.querySelector("[data-review-result]");
  const failResult = document.querySelector("[data-gate-fail-result]");
  if (passResult) passResult.hidden = true;
  if (failResult) failResult.hidden = true;
  const base = [
    {
      key: "read-config",
      ioHtml: getStudentIoHtml(mode, "read-config"),
      running: "正在读取题目类型、评价指标、门槛项、不合格规则和固定 Skill 计划。",
      done: "已读取本题评审配置，准备进入门槛项评审。"
    },
    {
      key: "gate-agent",
      ioHtml: getStudentIoHtml(mode, "gate-agent"),
      running: "门槛项评审与证据获取 Agent 正在检查提交材料是否满足核心交付要求。",
      done: mode === "fail"
        ? "门槛项未通过：缺少可访问 URL，无法验证核心流程。"
        : "门槛项通过：提交材料完整，系统地址可访问，进入证据获取。"
    }
  ];

  if (mode === "fail") {
    await runLogSequence([
      ...base,
      {
        key: "fail-result",
        ioHtml: getStudentIoHtml(mode, "fail-result"),
        running: "正在生成不合格评审结果、评语、优点、问题和修改建议。",
        done: "已直接生成不合格结果，未进入后续 Skill 证据获取和正式评分。",
        blocked: true
      }
    ]);
    reveal("[data-gate-fail-result]");
    if (btn) btn.disabled = false;
    return;
  }

  await runLogSequence([
    ...base,
    {
      key: "skill-web",
      ioHtml: getStudentIoHtml(mode, "skill-web"),
      running: "网页访问 Skill 正在调用 URL 校验、截图和页面交互 Tool。",
      done: "已获取页面可访问状态、关键截图和核心交互路径证据。"
    },
    {
      key: "skill-doc",
      ioHtml: getStudentIoHtml(mode, "skill-doc"),
      running: "文档读取 Skill 正在解析 README 和作业说明。",
      done: "已提取项目说明、运行方式、主要功能和交付说明。"
    },
    {
      key: "skill-code",
      ioHtml: getStudentIoHtml(mode, "skill-code"),
      running: "代码/压缩包 Skill 正在解压项目并读取代码结构。",
      done: "已识别入口文件、目录结构和关键实现模块。"
    },
    {
      key: "evidence-merge",
      ioHtml: getStudentIoHtml(mode, "evidence-merge"),
      running: "正在按评审维度和指标汇总结构化单题证据包。",
      done: "证据包已汇总完成，单题评审 Agent 可直接评分。"
    },
    {
      key: "review-agent",
      ioHtml: getStudentIoHtml(mode, "review-agent"),
      running: "单题评审 Agent 正在基于证据包进行两阶段评分并生成教师式评语。",
      done: "已生成题目总分、等级、评语、优点、问题、修改建议和评价依据。"
    }
  ]);
  reveal("[data-review-result]");
  if (btn) btn.disabled = false;
}
