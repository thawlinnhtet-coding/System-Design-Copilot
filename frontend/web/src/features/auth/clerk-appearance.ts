/**
 * Keep Clerk's managed flows inside the same paper/graphite visual language as
 * the surrounding auth shell. Credential state and policy remain Clerk-owned.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0f766e",
    colorText: "#18201e",
    colorTextSecondary: "#626a66",
    colorBackground: "#f4f1e8",
    colorInputBackground: "#fbf9f3",
    colorInputText: "#18201e",
    borderRadius: "3px",
    fontFamily: "var(--font-body-family)",
  },
  elements: {
    rootBox: "w-full",
    card: "w-full bg-transparent p-0 shadow-none",
    headerTitle: "font-display font-medium tracking-tight",
    headerSubtitle: "text-text-muted",
    formFieldLabel: "text-foreground",
    formFieldInput: "auth-input",
    formButtonPrimary: "min-h-12 rounded-[3px] bg-signal font-semibold hover:bg-[#0c655e]",
    socialButtonsBlockButton: "auth-provider min-h-12 rounded-[3px]",
    footerActionLink: "font-semibold text-signal hover:underline",
    formFieldWarningText: "text-warning",
    formFieldErrorText: "text-danger",
    alert: "border-l-2 border-danger bg-[#f5e3e0] text-danger",
  },
};
