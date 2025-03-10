"use client";
import  React from 'react'
import {useState} from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { CheckBox } from '../ui/CheckBox'

function LoginForm(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handelSubmit = (e) => {
    e.preventDefault()
    console.log({email, password, rememberMe})
  }
  return (
    // <div className="flex flex-col items-center justify-center w-full h-full">
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center w-96 h-96 bg-white rounded-md shadow-md">
        <div className="flex items-center justify-center w-full h-20 bg-gray-100 rounded-t-md">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
        </div>
        <form onSubmit={handelSubmit} className="flex flex-col items-center justify-center w-full h-full p-4">
          <Label htmlFor="email" text="Email" />
          <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label htmlFor="password" text="Password" />
          <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <CheckBox id="rememberMe" text="Remember me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <Button text="Login" />
          <Link href="/auth/register">
            <a className="text-blue-500">Create an account</a>
          </Link>
        </form>
      </div>    <div className="flex w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg">
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
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Login to your Account</h1>
            <p className="text-muted-foreground">See what is going on with your business</p>
          </div>

          <Button variant="outline" className="w-full flex items-center gap-2 h-12">
            <Image
              src="/placeholder.svg?height=25&width=25"
              width={25}
              height={25}
              alt="Google logo"
              className="h-5 w-5"
            />
            <span className="font-bold">Continue with Google</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <span className="relative bg-white px-3 text-sm text-muted-foreground">or Sign in with Email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked )}
                />
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
    </div>
  )
}



export default LoginForm