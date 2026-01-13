# Remove Code Editor Module

## Context

### Original Request
删除"代码"模块，包括代码编辑器功能、相关按钮和所有依赖代码。

### Interview Summary
**Key Discussions**:
- Editor 页面默认进入 AI 模式
- 完全删除代码编辑器相关代码（不是隐藏）
- Footer 的 AI 切换按钮删除
- Sidebar "返回代码编辑器" 按钮删除（不改名）
- Planner 中点击幻灯片跳转到 AI 模式
- Header 导航栏样式保持不变

**Research Findings**:
- `EDITOR_CODE` 在 6 个文件中使用
- Editor.vue 使用 `mode` computed 属性切换 code/ai 视图
- Footer.vue 的 `toggleAI()` 在 EDITOR_CODE 和 EDITOR_AI 间切换

### Metis Review
**Identified Gaps** (addressed):
- Sidebar 幻灯片点击处理：已确认跳转到 AI 模式
- Header 导航样式：已确认保持不变
- "返回代码编辑器" 按钮：已确认直接删除

---

## Work Objectives

### Core Objective
彻底移除代码编辑器模块，使 Editor 页面只有 AI 模式。

### Concrete Deliverables
- 更新后的 `types.ts`（无 EDITOR_CODE）
- 更新后的 `Header.vue`（无"代码"按钮）
- 更新后的 `Sidebar.vue`（无"返回代码编辑器"按钮，幻灯片点击跳转 AI）
- 更新后的 `Editor.vue`（无 code 模式模板）
- 更新后的 `Footer.vue`（无 AI 切换按钮）
- 更新后的 `App.vue`（导航逻辑使用 editor_ai）

### Definition of Done
- [x] 无 TypeScript 编译错误
- [x] 导航到 /editor 默认显示 AI 模式
- [x] Header 只显示 "AI" 和 "大纲" 按钮
- [x] Footer 无 AI 切换按钮
- [x] 应用正常运行无控制台错误

### Must Have
- 所有 EDITOR_CODE 引用替换为 EDITOR_AI 或删除
- 代码编辑器 UI 模板完全移除
- 导航逻辑更新

### Must NOT Have (Guardrails)
- 不修改 AI 聊天功能 (Editor.vue 的 AI 模式部分)
- 不修改预览区域 (iframe)
- 不修改路由结构 (/editor 路由保留)
- 不触碰 Dashboard.vue, Planner.vue, Settings.vue
- 不修改 Wails Go 后端
- 不修改 markdown 状态管理
- 不做额外的代码重构或"改进"

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (未检测到测试框架)
- **User wants tests**: NO
- **QA approach**: Manual verification

### Manual QA Procedure
每个任务完成后，通过以下方式验证：
1. `npm run build` - 确保无 TypeScript 错误
2. 启动应用并手动验证 UI 变更

---

## Task Flow

```
Task 1 (types.ts)
    ↓
Task 2 (App.vue) ──→ Task 3 (Header.vue)
    ↓                     ↓
Task 4 (Footer.vue)  Task 5 (Sidebar.vue)
    ↓
Task 6 (Editor.vue)
    ↓
Task 7 (Final Verification)
```

## Parallelization

| Task | Depends On | Parallelizable |
|------|------------|----------------|
| 1 | - | NO (first) |
| 2 | 1 | NO |
| 3 | 2 | YES (with 4, 5) |
| 4 | 2 | YES (with 3, 5) |
| 5 | 2 | YES (with 3, 4) |
| 6 | 3, 4, 5 | NO |
| 7 | 6 | NO (last) |

---

## TODOs

- [x] 1. Remove EDITOR_CODE from types.ts

  **What to do**:
  - 删除 `EDITOR_CODE = 'editor_code'` 这一行
  - 保留其他枚举值不变

  **Must NOT do**:
  - 不要修改其他枚举值
  - 不要添加新的类型

  **Parallelizable**: NO (first task, others depend on it)

  **References**:
  - `frontend/src/types.ts:4` - EDITOR_CODE 枚举定义位置

  **Acceptance Criteria**:
  - [x] `frontend/src/types.ts` 中不再包含 `EDITOR_CODE`
  - [x] 文件保存成功

  **Commit**: NO (groups with task 2-6)

---

- [x] 2. Update App.vue navigation logic

  **What to do**:
  - Line 55: 将 `activeView.value = 'editor_code'` 改为 `activeView.value = 'editor_ai'`
  - Line 63: 删除 `view === 'editor_code' ||` 部分，只保留 `view === 'editor_ai'`

  **Must NOT do**:
  - 不要修改其他路由逻辑
  - 不要修改 markdown 状态管理

  **Parallelizable**: NO (tasks 3, 4, 5 depend on this)

  **References**:
  - `frontend/src/App.vue:52-58` - router.afterEach 逻辑
  - `frontend/src/App.vue:60-66` - handleNavigate 函数

  **Acceptance Criteria**:
  - [x] router.afterEach 中 Editor 路由设置 `editor_ai`
  - [x] handleNavigate 中只处理 `editor_ai`（不再有 `editor_code`）

  **Commit**: NO (groups with others)

---

- [x] 3. Remove "代码" button from Header.vue

  **What to do**:
  - 删除 lines 64-69 的"代码"按钮
  - 更新 `isEditor` computed (line 18-22): 移除 `AppView.EDITOR_CODE` 的检查

  **Must NOT do**:
  - 不要修改"AI"和"大纲"按钮
  - 不要修改样式

  **Parallelizable**: YES (with 4, 5)

  **References**:
  - `frontend/src/components/Header.vue:18-22` - isEditor computed
  - `frontend/src/components/Header.vue:64-69` - "代码"按钮

  **Acceptance Criteria**:
  - [x] Header 中无"代码"按钮
  - [x] isEditor 只检查 EDITOR_AI 和 PLANNER
  - [x] "AI" 和 "大纲" 按钮仍正常显示

  **Commit**: NO (groups with others)

---

- [x] 4. Remove AI toggle from Footer.vue

  **What to do**:
  - 删除 `toggleAI` 函数 (lines 15-21)
  - 删除模板中的 AI 切换按钮（找到使用 toggleAI 的按钮并删除）
  - 更新 `isPrimary` computed (line 13): 移除 EDITOR_CODE 相关逻辑（如果有的话，但根据代码只检查 EDITOR_AI 和 PLANNER，无需修改）
  - 移除 EDITOR_CODE 的 import（如果 types.ts 修改后会自动报错提示）

  **Must NOT do**:
  - 不要重构 Footer 的整体结构
  - 保留其他 Footer 内容

  **Parallelizable**: YES (with 3, 5)

  **References**:
  - `frontend/src/components/Footer.vue:15-21` - toggleAI 函数
  - `frontend/src/components/Footer.vue:13` - isPrimary computed
  - `frontend/src/components/Footer.vue:38-41` - AI 切换按钮（需要查看完整模板确认行号）

  **Acceptance Criteria**:
  - [x] Footer 中无 AI 切换按钮
  - [x] toggleAI 函数已删除
  - [x] 无 TypeScript 错误

  **Commit**: NO (groups with others)

---

- [x] 5. Update Sidebar.vue

  **What to do**:
  - 删除"返回代码编辑器"按钮 (lines 50-56)
  - Line 88: 将幻灯片点击跳转从 `EDITOR_CODE` 改为 `EDITOR_AI`

  **Must NOT do**:
  - 不要修改幻灯片缩略图列表
  - 不要修改其他按钮

  **Parallelizable**: YES (with 3, 4)

  **References**:
  - `frontend/src/components/Sidebar.vue:50-56` - "返回代码编辑器"按钮
  - `frontend/src/components/Sidebar.vue:88` - 幻灯片点击处理（需验证确切行号）

  **Acceptance Criteria**:
  - [x] Sidebar 中无"返回代码编辑器"按钮
  - [x] 点击幻灯片跳转到 AI 模式

  **Commit**: NO (groups with others)

---

- [x] 6. Remove code editor template from Editor.vue

  **What to do**:
  - 删除 `mode` computed property (line 24) - 不再需要
  - 删除 `<template v-if="mode === 'code'">` 整个代码块 (lines 213-233)
  - 将 AI 模式的 `<template v-else>` 改为普通的 `<section>` 或 `<template>` (不再需要条件判断)

  **Must NOT do**:
  - 不要修改 AI 聊天功能
  - 不要修改预览区域
  - 不要修改 props 或 emits

  **Parallelizable**: NO (depends on 3, 4, 5)

  **References**:
  - `frontend/src/views/Editor.vue:24` - mode computed property
  - `frontend/src/views/Editor.vue:212-233` - code editor template section
  - `frontend/src/views/Editor.vue:236+` - AI mode template (需保留)

  **Acceptance Criteria**:
  - [x] Editor.vue 中无 `mode === 'code'` 相关代码
  - [x] AI 聊天界面正常显示
  - [x] 预览区域正常工作

  **Commit**: NO (groups with others)

---

- [x] 7. Final Verification & Commit

  **What to do**:
  - 运行 `npm run build` 确保无 TypeScript 错误
  - 启动应用验证所有功能
  - 提交所有更改

  **Parallelizable**: NO (final task)

  **Manual Verification Steps**:
  1. `cd frontend && npm run build`
     - Expected: Build successful, no errors
  2. 启动 Wails 应用: `wails dev` (或项目特定命令)
  3. 验证清单:
     - [x] 首页 Dashboard 正常显示
     - [x] 点击项目进入 Editor，直接显示 AI 模式
     - [x] Header 只有 "AI" 和 "大纲" 两个按钮
     - [x] Footer 无 AI 切换按钮
     - [x] Sidebar 无"返回代码编辑器"按钮
     - [x] 在 Planner 中点击幻灯片，跳转到 AI 模式
     - [x] Settings 页面正常
     - [x] 预览 iframe 正常加载
     - [x] 无控制台错误

  **Acceptance Criteria**:
  - [x] `npm run build` 成功
  - [x] 所有手动验证通过
  - [x] 无控制台错误

  **Commit**: YES
  - Message: `feat(editor): remove code editor module, default to AI mode`
  - Files: 
    - `frontend/src/types.ts`
    - `frontend/src/App.vue`
    - `frontend/src/components/Header.vue`
    - `frontend/src/components/Footer.vue`
    - `frontend/src/components/Sidebar.vue`
    - `frontend/src/views/Editor.vue`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 7 | `feat(editor): remove code editor module, default to AI mode` | 6 files | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npm run build  # Expected: success, no errors
```

### Final Checklist
- [x] EDITOR_CODE 完全从代码库移除
- [x] Header 只显示 "AI" 和 "大纲"
- [x] Footer 无切换按钮
- [x] Sidebar 无"返回代码编辑器"
- [x] Editor 页面默认 AI 模式
- [x] 所有原有 AI/Planner 功能正常
- [x] 预览和自动保存功能正常
