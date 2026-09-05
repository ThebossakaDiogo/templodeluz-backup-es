import { SignInCard } from "./ui/sign-in-card-2";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className="dashboard-root" style={{ minHeight: "100dvh", width: "100vw" }}>
      <SignInCard onLoginSuccess={onLoginSuccess} />
    </div>
  );
}
