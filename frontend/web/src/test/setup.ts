import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

function TestQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestQueryProvider });
}
