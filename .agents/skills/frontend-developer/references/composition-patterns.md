# React Composition Patterns

> Source: Vercel Engineering — composition-patterns skill

Patterns for building flexible, maintainable React components at scale.

## Core Principle
**Composition over boolean proliferation.** If you're adding a boolean prop, stop — compose instead.

## Architecture (HIGH Priority)

### Avoid Boolean Props
❌ `<Modal isFullscreen isDismissible hasOverlay />`
✅ Compose: `<Modal.Fullscreen> <Modal.Dismissible> <Modal.Overlay>`

### Compound Components
Pattern: Share state via Context, expose sub-components.

```jsx
<Select>
  <Select.Trigger />
  <Select.Options>
    <Select.Option value="a">Option A</Select.Option>
  </Select.Options>
</Select>
```

## State Management (MEDIUM)

### Decouple Implementation
Provider is the ONLY place that knows how state is managed:
```jsx
// Good: Context provides generic interface
const CartContext = { items, addItem, removeItem, total }
// Bad: Components import zustand/redux directly
```

### Context Interface Pattern
Define generic interface with `state`, `actions`, `meta`:
```jsx
{ state: {}, actions: {}, meta: { isLoading, error } }
```

### Lift State
Move state into Provider for sibling component access.

## Implementation Patterns (MEDIUM)

### Explicit Variants
❌ `<Button isPrimary />` `<Button isDanger />`
✅ `<PrimaryButton />` `<DangerButton />`

### Children Over Render Props
❌ `renderHeader={(...) => <Header />}`
✅ `<Card><Card.Header>...</Card.Header></Card>`

## React 19 (⚠️ React 19+ only)

- Drop `forwardRef` — ref is now a regular prop
- Use `use()` instead of `useContext()`
