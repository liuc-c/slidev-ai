# Learnings: Simplify Navigation Flow

## AI Chat Fix
- Vercel AI SDK `streamText` on the client side returns a stream that can be consumed via `textStream`.
- `toDataStreamResponse` is a helper for server-side API routes to return a standard Response object. Calling it on the client side results in a `TypeError`.
- Always await `result.steps` to ensure tool calls are completed before trying to read side effects (like updated files).

## Navigation & Architecture
- Unified navigation around `AppView` enum prevents bugs caused by hardcoded strings like `editor_code` vs `editor_ai`.
- Moving complex multi-page wizards (like the Planner) into Modals (like `CreateProjectModal.vue`) keeps the main application state focused and reduces navigation depth.
- Desktop apps (Wails) benefit from "In-place" editing experiences rather than deep routing hierarchies.

## Interaction Design
- For tools like Slidev where the preview is an iframe, placing structural controls (like "Insert Slide") directly above the preview header provides better context than a distant sidebar.
- Removing the side slide list is acceptable if the preview tool (Slidev) already provides internal navigation (which it does).
