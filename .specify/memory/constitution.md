<!--
  Sync Impact Report
  ==================
  Version change: NEW (initial constitution)
  Added sections:
    - Core Principles (5 principles)
    - Technology Standards section
    - Development Workflow section
  Removed sections: N/A (initial constitution)
  Templates requiring updates:
    - plan-template.md: ✅ Compatible (Constitution Check section exists)
    - spec-template.md: ✅ Compatible (User Scenarios, Requirements, Success Criteria sections align)
    - tasks-template.md: ✅ Compatible (Phased organization aligns with principles)
-->

# excalidraw-max Constitution

## Core Principles

### I. Security-First Architecture

All Tauri commands MUST validate all input parameters. Rust backend commands MUST use proper error handling and never expose internal error details to the frontend. The frontend MUST treat all data from the backend as untrusted and validate before rendering or acting on it.

Rationale: Desktop applications have access to filesystem and system resources. Unvalidated input from the frontend could lead to command injection, path traversal, or other security vulnerabilities. Defense in depth is essential.

### II. Type Safety Across Layers

TypeScript interfaces MUST mirror Rust data structures at the FFI boundary. New Tauri commands MUST include TypeScript type definitions. No `any` types allowed at the command interface layer.

Rationale: Both TypeScript and Rust provide strong type systems. The FFI boundary is where type safety can break down. Maintaining type correspondence prevents runtime errors and enables compile-time validation across layers.

### III. Performance-Conscious Bundling

Frontend bundles MUST be optimized for size. Large assets MUST use appropriate formats. The Tauri window SHOULD load quickly by deferring non-critical initialization.

Rationale: Tauri apps compete with native apps on performance perception. Large bundles delay startup and consume memory. Performance testing MUST occur before each release.

### IV. Platform-Appropriate UX

Desktop-specific patterns MUST be used where native: keyboard shortcuts, window management, file system interaction. The app MUST follow macOS Human Interface Guidelines for this platform.

Rationale: Users expect desktop applications to feel native. Web-based UX patterns that work in browsers often feel wrong on desktop. Platform conventions improve usability and reduce cognitive load.

### V. Testable Command Architecture

All Tauri commands MUST be unit testable in Rust. Core frontend functionality MUST have unit tests. Integration tests MUST verify command flows end-to-end.

Rationale: Desktop app bugs are harder to debug than web apps. Comprehensive tests catch regressions early and document expected behavior. Tests enable confident refactoring.

## Technology Standards

### Frontend Stack
- React 18 with TypeScript
- Vite for bundling
- CSS modules or scoped styling (no global CSS pollution)

### Backend Stack
- Tauri v2 (Rust)
- Rust edition 2024 (current stable)
- tokio for async runtime

### Quality Gates
- TypeScript compilation MUST pass with no errors
- `pnpm build` MUST succeed before any PR
- Rust code MUST pass `cargo check` and `cargo clippy`
- All tests MUST pass before merging

## Development Workflow

### Branch Strategy
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commits MUST be atomic and descriptive

### Code Review Requirements
- All PRs require review before merge
- Security-sensitive changes (file system, shell commands) require additional scrutiny
- Constitution compliance MUST be verified in review

### Release Process
- Version bumps follow Semantic Versioning
- Changelog MUST be updated for each release
- macOS bundle identity remains `com.aidvps.excalidraw-max.app`

## Governance

This constitution supersedes all other development practices in this project. Amendments require:
1. Documentation of the proposed change
2. Rationale explaining why the change is necessary
3. Review and approval from project maintainers
4. Update to all affected templates

All team members MUST verify constitution compliance during code review. Complexity that cannot be justified by constitution principles MUST be avoided or explicitly approved with documented reasoning.

**Version**: 1.0.0 | **Ratified**: 2025-12-20 | **Last Amended**: 2025-12-20
