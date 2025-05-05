// app/dashboard/page.jsx (or any file you choose for the dashboard page)

import { redirect } from "next/navigation";
import DashboardPage from "@/components/dashboard/DashboardPage";

// A simple authentication check function (you can replace this with your actual logic)
function checkAuth() {
  // Here we're checking if there's a JWT token in localStorage, but you could check cookies or session
  const token = localStorage.getItem('token');
  return token ? true : false;
}

export default function Dashboard() {
  // Check if the user is authenticated
  const isAuthenticated = checkAuth();

  // If the user is not authenticated, redirect them to the login page
  if (!isAuthenticated) {
    redirect('/login');  // Change to wherever your login page is
  }

  return <DashboardPage />;
}
