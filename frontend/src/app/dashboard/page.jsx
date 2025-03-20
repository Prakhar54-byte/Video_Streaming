import { redirect } from "next/navigation"
import DashboardPage from "@/components/dashboard/DashboardPage"

export default function Dashboard() {
  // In a real app, you would check authentication here
  // const isAuthenticated = checkAuth()
  // if (!isAuthenticated) redirect('/login')
  
  return <DashboardPage />
}
