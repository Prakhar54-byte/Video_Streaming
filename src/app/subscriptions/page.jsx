"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/subscriptions', {
          credentials: 'include'
        })
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Subscriptions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map((subscription) => (
          <div key={subscription._id} className="flex items-center gap-4 bg-card p-4 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={subscription.channel.avatar} alt={subscription.channel.name} />
              <AvatarFallback>{subscription.channel.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{subscription.channel.name}</h3>
              <p className="text-sm text-muted-foreground">{subscription.channel.subscribersCount} subscribers</p>
            </div>
            <Button variant="outline">Unsubscribe</Button>
          </div>
        ))}
      </div>
    </div>
  )
}