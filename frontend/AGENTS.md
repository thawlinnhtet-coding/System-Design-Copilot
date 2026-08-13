# Frontend Agent Guide

This file applies to `frontend/`. Also follow the repository root `AGENTS.md`.

## Stack

- Next.js App Router and strict TypeScript
- npm and `package-lock.json`
- Tailwind CSS and shadcn/ui
- TanStack Query for remote server state
- Zustand for the unsaved architecture draft and ephemeral editor UI state
- React Hook Form and Zod for forms and boundary validation
- React Flow for the architecture canvas
- Vitest and Testing Library for component and behavior tests
- Playwright for critical browser journeys

## Application Boundaries

- Use Server Components by default. Add `"use client"` only at a genuine interactive boundary.
- Call the Spring Boot API through one typed API layer. Do not scatter raw `fetch` calls through components.
- Generate API types from the backend OpenAPI contract. Do not manually duplicate backend DTOs.
- Keep authentication and entitlement enforcement in the backend. UI checks only improve usability.
- Do not call OpenRouter, Stripe secret APIs, Redis, RabbitMQ, or PostgreSQL from frontend code.
- Treat imported files, URL parameters, API responses, and browser storage as untrusted input.

## State Ownership

- TanStack Query owns persisted Workspaces, Challenges, Reviews, profile, billing, and job status.
- Zustand owns controlled React Flow nodes and edges before autosave, selection, viewport tools, and temporary editor panels.
- React Hook Form owns active form values and validation state.
- Local component state owns small, local interaction state.
- Do not mirror TanStack Query data into Zustand as a second server cache.
- Reset editor draft state when changing Workspaces to prevent cross-workspace leakage.

## Canvas Rules

- Use stable server-compatible identifiers for Components and Connections.
- Keep React Flow node rendering presentational; domain updates go through editor actions.
- Preserve unknown forward-compatible properties when safely reading a supported document version.
- Debounce autosave and include the expected document version in every write.
- Surface save, conflict, offline, and review-processing states explicitly.
- A Review submission creates a checkpoint through the backend; the client must not construct an authoritative revision.
- Provide keyboard operations and non-drag alternatives for essential canvas actions.

## UI And Accessibility

- Treat the approved repository-root `ui_design` Pencil artifact as the authoritative visual and interaction design contract. Use `DESIGN.md` for its supporting rules and implementation notes; if they conflict, follow `ui_design` and update `DESIGN.md` in the same change. Do not introduce competing UI design tokens or visual grammar.
- Preserve the product's engineering-workspace identity; avoid generic dashboard styling.
- Compose shadcn/ui primitives rather than editing generated primitive internals unnecessarily.
- Meet WCAG 2.1 AA for core flows, including focus visibility, labels, contrast, and keyboard navigation.
- Ensure every main flow remains usable on mobile, even if the full canvas is optimized for larger screens.
- Use semantic status announcements for autosave, validation, and background review completion.
- Avoid hiding required actions behind hover-only controls.

## Testing

- Test user-visible behavior rather than component internals.
- Use Mock Service Worker or the project's shared API test adapter for network behavior.
- Cover empty, loading, error, forbidden, quota-exceeded, conflict, and retry states.
- Use Playwright for authentication, workspace creation, canvas autosave, review submission, and billing boundary journeys.
- Do not use production provider credentials in tests.

## Commands

```text
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
