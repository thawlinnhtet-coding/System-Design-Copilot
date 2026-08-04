import { render, screen } from "@testing-library/react";
import { HealthStatus } from "./health-status";

describe("HealthStatus", () => {
  it("reports an available backend", () => {
    render(
      <HealthStatus
        health={{
          status: "UP",
          service: "system-design-copilot",
          version: "0.1.0",
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Backend available",
    );
    expect(screen.getByText("system-design-copilot v0.1.0")).toBeVisible();
  });
});
