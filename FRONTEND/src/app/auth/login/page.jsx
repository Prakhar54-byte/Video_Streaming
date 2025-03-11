export const metadata = {
  title: "Login | Login System",
  description: "Login to your account",
}

import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  )
}
