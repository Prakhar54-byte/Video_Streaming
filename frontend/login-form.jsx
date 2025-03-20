"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Mail, Lock, User, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [alertMessage, setAlertMessage] = useState("")
  const router = useRouter()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setAlertMessage("") // Clear alert when user types
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Simple validation
    if (!formData.email && !formData.password) {
      setAlertMessage("Please enter your email and password to login")
      return
    } else if (!formData.email) {
      setAlertMessage("Please enter your email address")
      return
    } else if (!formData.password) {
      setAlertMessage("Please enter your password")
      return
    }

    // Handle login logic here
    console.log(formData)
    // Redirect to dashboard after login
    router.push("/auth/dashboard")
  }

  return (
    <div className="flex w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg">
      {/* Left side - Illustration */}
      <div className="hidden md:block w-1/2 bg-primary/10 relative p-8">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <div className="w-4/5 h-4/5 relative">
              <Image
                src="/placeholder.svg?height=500&width=430"
                width={430}
                height={500}
                alt="Login illustration"
                className="object-contain"
              />
              <div className="absolute bottom-10 left-0 right-0 text-center bg-white/90 py-4 px-6 rounded-lg shadow-md">
                <p className="text-primary font-semibold">
                  Start for free and get attractive offers from the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Login to your Account</h1>
            <p className="text-muted-foreground">See what is going on with your business</p>
          </div>

          {alertMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <Button variant="outline" className="w-full flex items-center gap-2 h-12">
            <User className="h-5 w-5" />
            <span className="font-medium">Continue with Google</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <span className="relative bg-white px-3 text-sm text-muted-foreground">or Sign in with Email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={formData.rememberMe} onCheckedChange={handleCheckboxChange} />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember Me
                </Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12">
              Login
            </Button>
          </form>

          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

