"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react'

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Alert, AlertDescription } from "@/components/ui/Alert"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlertMessage("")
    
    if (!email) {
      setAlertMessage("Please enter your email address")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/change-password",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email})

      })
      const data = await response.json()

      
      if(!response.ok){
        let errorText = "Failed to send reset link. Plaes try again";
        try{
          const data = await response.json()
          if(data?.error) errorText = data.error
        }catch{}
        throw new Error(errorText)
        
      }
    } catch (error) {
      setAlertMessage("Failed to send reset link. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/login" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
        </div>
        
        {!isSuccess ? (
          <>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {alertMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{alertMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password. If you don't receive an email within a few minutes, please check your spam folder.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button asChild variant="outline" className="mt-4">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
