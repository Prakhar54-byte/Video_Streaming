"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Alert, AlertDescription } from "@/components/ui/Alert"
import { useToast } from "@/hooks/useToast"

export default function ChangePasswordForm({ onSuccess, onCancel }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    color: "gray"
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }))
    }

    // Check password strength for new password
    if (id === "newPassword") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let score = 0
    let feedback = ""
    let color = "gray"

    if (password.length === 0) {
      setPasswordStrength({ score: 0, feedback: "", color: "gray" })
      return
    }

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    // Set feedback based on score
    if (score < 3) {
      feedback = "Weak password"
      color = "red"
    } else if (score < 5) {
      feedback = "Medium strength"
      color = "yellow"
    } else {
      feedback = "Strong password"
      color = "green"
    }

    setPasswordStrength({ score, feedback, color })
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Current password is required"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
      
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to change your password",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.message?.includes("Old password is incorrect")) {
          setErrors({ oldPassword: "Current password is incorrect" })
          toast({
            title: "Error",
            description: "Current password is incorrect",
            variant: "destructive",
          })
        } else {
          throw new Error(data.message || "Failed to change password")
        }
        return
      }

      toast({
        title: "Success",
        description: "Password changed successfully",
      })

      // Clear form
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error("Change password error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Change Password</CardTitle>
        <CardDescription>
          Enter your current password and choose a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="oldPassword"
                type={showPasswords.oldPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={formData.oldPassword}
                onChange={handleChange}
                className={`pl-10 pr-10 ${errors.oldPassword ? "border-red-500" : ""}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => togglePasswordVisibility("oldPassword")}
              >
                {showPasswords.oldPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.oldPassword && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.oldPassword}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPasswords.newPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                className={`pl-10 pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => togglePasswordVisibility("newPassword")}
              >
                {showPasswords.newPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        passwordStrength.color === 'green' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.color === 'red' ? 'text-red-500' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-500' :
                    passwordStrength.color === 'green' ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
              </div>
            )}
            
            {errors.newPassword && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.newPassword}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Password should be at least 8 characters with mixed case, numbers, and symbols
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPasswords.confirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => togglePasswordVisibility("confirmPassword")}
              >
                {showPasswords.confirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Passwords match</span>
              </div>
            )}
            {errors.confirmPassword && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.confirmPassword}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className={onCancel ? "flex-1" : "w-full"}
              disabled={isLoading}
            >
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}