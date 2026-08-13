import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AuthPage, AuthStatePage } from "./auth-page";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const clerk = vi.hoisted(() => ({ loaded: true }));
const signIn = vi.hoisted(() => ({
  resetPasswordEmailCode: {
    verifyCode: vi.fn(),
    sendCode: vi.fn(),
    submitPassword: vi.fn(),
  },
  create: vi.fn(),
  password: vi.fn(),
  sso: vi.fn(),
  finalize: vi.fn(),
}));
const signUp = vi.hoisted(() => ({
  verifications: { verifyEmailCode: vi.fn(), sendEmailCode: vi.fn() },
  sso: vi.fn(),
  finalize: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => clerk,
  useSignIn: () => ({ signIn }),
  useSignUp: () => ({ signUp }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("flow=reset"),
}));

vi.mock("@/components/brand/brand-mark", () => ({
  BrandMark: () => <span>Brand</span>,
}));

describe("AuthStatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerk.loaded = true;
    signIn.resetPasswordEmailCode.verifyCode.mockResolvedValue({ error: null });
    signIn.sso.mockResolvedValue({ error: null });
    signUp.sso.mockResolvedValue({ error: null });
  });

  it("routes a verified password reset code to the new password page", async () => {
    render(<AuthStatePage state="verify-email" />);
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    await waitFor(() => expect(signIn.resetPasswordEmailCode.verifyCode).toHaveBeenCalledWith({ code: "123456" }));
    expect(signUp.verifications.verifyEmailCode).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/set-new-password?flow=reset");
  });

  it("starts sign-in OAuth with the callback URL in the correct Clerk slots", async () => {
    render(<AuthPage mode="sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    await waitFor(() => expect(signIn.sso).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectUrl: "/practice",
      redirectCallbackUrl: "/sign-in/sso-callback",
    }));
  });

  it("shows provider progress while OAuth is starting", async () => {
    let resolveOAuth: (value: { error: null }) => void = () => undefined;
    signIn.sso.mockImplementation(() => new Promise((resolve) => {
      resolveOAuth = resolve;
    }));

    render(<AuthPage mode="sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "GitHub" }));

    expect(screen.getByRole("button", { name: /Connecting/ })).toBeDisabled();

    resolveOAuth({ error: null });
    await waitFor(() => expect(screen.getByRole("button", { name: "GitHub" })).not.toBeDisabled());
  });

  it("shows live password guidance only on sign-up", () => {
    render(<AuthPage mode="sign-up" />);

    expect(screen.getByText("Use 8+ characters with a mix of letters, numbers, or symbols.")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), { target: { value: "LongPassword123!" } });

    expect(screen.getByRole("progressbar", { name: "Password strength: Strong" })).toHaveAttribute("aria-valuenow", "5");
    expect(screen.queryByText("Forgot password?")).not.toBeInTheDocument();
  });

  it("does not apply sign-up password length validation to sign-in", async () => {
    signIn.password.mockResolvedValue({ error: null });
    render(<AuthPage mode="sign-in" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in securely" }));

    await waitFor(() => expect(signIn.password).toHaveBeenCalledWith({ identifier: "user@example.com", password: "short" }));
    expect(screen.queryByText("Your password must be at least 8 characters.")).not.toBeInTheDocument();
  });

  it("explains when Clerk is unavailable instead of making OAuth buttons inert", async () => {
    clerk.loaded = false;
    render(<AuthPage mode="sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Secure authentication is still loading");
  });
});
