import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Badge } from "@/components/ui/Badge";

test("Badge renders default variant with correct styles", () => {
  render(<Badge>Default Badge</Badge>);
  const badge = screen.getByText("Default Badge");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveClass("bg-primary/10");
});

test("Badge renders success variant with correct styles", () => {
  render(<Badge variant="success">Aktif</Badge>);
  const badge = screen.getByText("Aktif");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveClass("bg-[color:var(--color-status-success)]/15");
});
