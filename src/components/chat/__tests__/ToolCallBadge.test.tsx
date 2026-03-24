import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel ---

test("str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Viewing App.jsx");
});

test("str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit on App.jsx");
});

test("file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming old.jsx → new.jsx");
});

test("file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/App.jsx" })).toBe("Deleting App.jsx");
});

test("nested path returns only filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/Card.tsx" })).toBe("Creating Card.tsx");
});

test("unknown tool returns raw tool name", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// --- ToolCallBadge component ---

test("ToolCallBadge done state shows label and no spinner", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  // green dot is a plain div, not a spinner svg
  const container = screen.getByText("Creating App.jsx").parentElement;
  expect(container?.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge loading state shows label and spinner", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  const container = screen.getByText("Creating App.jsx").parentElement;
  expect(container?.querySelector(".animate-spin")).toBeDefined();
  expect(container?.querySelector(".bg-emerald-500")).toBeNull();
});
