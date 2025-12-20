# Data Model: Excalidraw Canvas

**Feature**: Auto-create Excalidraw on App Open

## Overview

This feature has no persistent data model. All canvas data is transient and discarded when the application closes.

## Entities

### Canvas (Transient)

**Purpose**: In-memory drawing surface during application session

**Attributes**:
- `elements`: Array of drawing elements (shapes, lines, text)
- `appState`: Canvas state (zoom, scroll position, selected tool)
- `files`: Image files embedded in canvas

**Lifecycle**:
- Created: When Excalidraw component mounts
- Updated: User draws/edits elements
- Destroyed: Application closes (data discarded)

## No Persistence Model

Per clarification decision:
- Canvas data is NOT saved to localStorage
- Canvas data is NOT saved to IndexedDB
- Canvas data is NOT saved to filesystem
- Each app launch creates a fresh blank canvas

## Validation Rules

- Canvas container must have defined height before rendering Excalidraw
- Excalidraw component must be fully mounted before user interaction
- Error boundary must catch any initialization failures
