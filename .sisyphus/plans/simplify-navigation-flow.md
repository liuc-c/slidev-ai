# Simplify Navigation Flow & Fix AI Chat

## Context

### Original Request
用户报告了多个问题：
1. AI 对话报错 `toDataStreamResponse is not a function`
2. 点击"打开项目"没反应，需要二次点击"大纲"才能进入
3. 交互流程混乱，需要简化

### Interview Summary
**Key Discussions**:
- AI 错误原因：Editor.vue 第124行调用了不存在的 `toDataStreamResponse()` 方法
- 导航失败原因：Dashboard 发射 `editor_code` 但 App.vue 只处理 `editor_ai`
- 用户决定：删除 Sidebar、Planner、StyleSelector、StyleEditor
- 用户决定：保留 prompts.ts（大纲生成需要）
- 用户决定：新建PPT时使用 Modal 进行大纲生成流程
- 实时预览 iframe 已包含幻灯片切换功能

**Research Findings**:
- Frontend UX Engineer 建议：新建项目使用 `CreateProjectModal.vue` 两步流程
- Frontend UX Engineer 建议：插入幻灯片按钮放在预览区 Header 右侧
- Metis 分析：修复顺序应为"先修复后删除"

### Metis Review
**Identified Gaps** (addressed):
- Dashboard.vue 的 `onCreateProject` 也需要修改（原本导航到 planner）
- 需要保留 prompts.ts 供新的 CreateProjectModal 使用
- 删除组件后需要验证构建成功

---

## Work Objectives

### Core Objective
简化应用导航流程，修复 AI 对话错误，将新建项目流程改为 Modal 形式。

### Concrete Deliverables
1. 修复 Editor.vue 的 AI 对话错误
2. 新建 `CreateProjectModal.vue` 组件（两步流程：输入主题 → 编辑大纲 → 生成）
3. 修改 Dashboard.vue 使用 Modal 创建项目
4. 在 Editor.vue 预览 Header 添加"插入幻灯片"按钮
5. 删除 Sidebar.vue、Planner.vue、StyleSelector.vue、StyleEditor.vue
6. 清理所有相关路由和引用

### Definition of Done
- [ ] AI 对话无报错，工具调用正常工作
- [ ] 点击"打开项目"直接进入 Editor
- [ ] 点击"新建项目"弹出 Modal，完成大纲生成后进入 Editor
- [ ] Editor 预览区有"插入幻灯片"按钮
- [ ] `npm run build` 构建成功无错误

### Must Have
- 修复 toDataStreamResponse 错误
- CreateProjectModal 两步流程
- 插入幻灯片按钮
- 删除 4 个废弃组件

### Must NOT Have (Guardrails)
- 不修改 lib/ai.ts（它是正确的）
- 不删除 lib/prompts.ts（Modal 需要用）
- 不重构 AI 对话组件（只修复那一行错误）
- 不添加额外的幻灯片列表（预览 iframe 已有切换功能）

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (无自动化测试)
- **User wants tests**: NO
- **QA approach**: Manual verification

---

## Task Flow

```
Task 1 (AI Fix) → Task 2 (Navigation Fix) → Task 3 (CreateProjectModal)
                                                    ↓
Task 7 (Build) ← Task 6 (Delete Files) ← Task 5 (Cleanup) ← Task 4 (Insert Button)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | - | Independent |
| 2 | - | Independent |
| 3 | 2 | Dashboard 需要先导入 Modal |
| 4 | 1 | Editor 先修复才能测试按钮 |
| 5 | 3, 4 | 清理需要在新组件完成后 |
| 6 | 5 | 删除文件需要在清理引用后 |
| 7 | 6 | 构建验证需要在删除后 |

---

## TODOs

- [x] 1. Fix AI Chat Error in Editor.vue
- [x] 2. Fix Dashboard Navigation Events
- [x] 3. Create CreateProjectModal Component
- [x] 4. Add Insert Slide Button to Editor Preview Header
- [x] 5. Cleanup References and Routes
- [x] 6. Delete Obsolete Files

  **What to do**:
  - 删除 `frontend/src/components/Sidebar.vue`
  - 删除 `frontend/src/views/Planner.vue`
  - 删除 `frontend/src/components/StyleSelector.vue`
  - 删除 `frontend/src/components/StyleEditor.vue`

  **Must NOT do**:
  - 不要删除 lib/prompts.ts
  - 不要删除 lib/ai.ts

  **Parallelizable**: NO (depends on Task 5)

  **References**:
  
  **文件列表**:
  - `frontend/src/components/Sidebar.vue` - DELETE
  - `frontend/src/views/Planner.vue` - DELETE
  - `frontend/src/components/StyleSelector.vue` - DELETE
  - `frontend/src/components/StyleEditor.vue` - DELETE

  **Acceptance Criteria**:
  
  **Manual Execution Verification**:
  - [ ] 4 个文件已删除
  - [ ] `git status` 显示 4 个 deleted 文件

  **Commit**: YES
  - Message: `chore: delete obsolete sidebar, planner, and style components`
  - Files: 4 deleted files

---

- [x] 7. Build Verification

  **What to do**:
  - 运行 `npm run build` 验证构建成功
  - 运行 `wails dev` 验证应用启动正常
  - 完整测试所有新功能

  **Must NOT do**:
  - 不要跳过构建验证

  **Parallelizable**: NO (final step)

  **References**:
  
  无特定文件，整体验证

  **Acceptance Criteria**:
  
  **Manual Execution Verification**:
  - [ ] `cd frontend && npm run build` 成功，无错误
  - [ ] `wails dev` 启动成功
  - [ ] Dashboard → 打开项目 → Editor 正常
  - [ ] Dashboard → 新建项目 → Modal → 生成大纲 → 生成幻灯片 → Editor 正常
  - [ ] Editor AI 对话正常，无报错
  - [ ] Editor 插入幻灯片按钮正常

  **Commit**: NO (验证步骤)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(editor): remove invalid toDataStreamResponse call` | Editor.vue | AI 对话测试 |
| 2 | `fix(dashboard): correct navigation event to editor_ai` | Dashboard.vue | 导航测试 |
| 3 | `feat(dashboard): add CreateProjectModal for new project flow` | CreateProjectModal.vue, Dashboard.vue | Modal 流程测试 |
| 4 | `feat(editor): add insert slide button to preview header` | Editor.vue | 按钮功能测试 |
| 5 | `refactor: remove planner and sidebar references` | 5 files | 无报错 |
| 6 | `chore: delete obsolete sidebar, planner, and style components` | 4 deleted | git status |
| 7 | - | - | npm run build |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npm run build  # Expected: Build successful
wails dev                      # Expected: App starts without errors
```

### Final Checklist
- [x] AI 对话无 `toDataStreamResponse` 错误
- [x] 点击"打开项目"直接进入 Editor
- [x] 新建项目 Modal 流程完整
- [x] 插入幻灯片按钮可用
- [x] 无 Sidebar 和 Planner
- [x] 构建成功
