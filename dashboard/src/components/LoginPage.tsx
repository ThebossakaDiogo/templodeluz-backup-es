import { SignInCard } from "./ui/sign-in-card-2";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return <SignInCard onLoginSuccess={onLoginSuccess} />;
}
