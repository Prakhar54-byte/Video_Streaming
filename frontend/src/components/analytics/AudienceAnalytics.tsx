"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tab";
import {
  Globe,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  TrendingUp,
  Activity,
  UserCheck,
  UserPlus,
} from "lucide-react";

export function AudienceAnalytics() {
  const [selectedCountry, setSelectedCountry] = useState("US");

  const geographicData = [
    {
      country: "United States",
      code: "US",
      percentage: 35.2,
      views: "1,002,847",
      subscribers: "16,841",
    },
    {
      country: "United Kingdom",
      code: "UK",
      percentage: 18.7,
      views: "532,456",
      subscribers: "8,945",
    },
    {
      country: "Canada",
      code: "CA",
      percentage: 12.3,
      views: "350,234",
      subscribers: "5,887",
    },
    {
      country: "Australia",
      code: "AU",
      percentage: 8.9,
      views: "253,421",
      subscribers: "4,256",
    },
    {
      country: "Germany",
      code: "DE",
      percentage: 7.1,
      views: "202,134",
      subscribers: "3,421",
    },
    {
      country: "France",
      code: "FR",
      percentage: 5.8,
      views: "165,089",
      subscribers: "2,789",
    },
    {
      country: "Netherlands",
      code: "NL",
      percentage: 4.2,
      views: "119,567",
      subscribers: "2,012",
    },
    {
      country: "Sweden",
      code: "SE",
      percentage: 3.1,
      views: "88,234",
      subscribers: "1,487",
    },
    {
      country: "Others",
      code: "XX",
      percentage: 4.7,
      views: "133,789",
      subscribers: "2,194",
    },
  ];

  const ageGroups = [
    { range: "13-17", percentage: 8.5, growth: "+2.1%" },
    { range: "18-24", percentage: 28.3, growth: "+5.7%" },
    { range: "25-34", percentage: 35.2, growth: "+3.4%" },
    { range: "35-44", percentage: 18.7, growth: "+1.8%" },
    { range: "45-54", percentage: 7.1, growth: "+0.9%" },
    { range: "55-64", percentage: 1.8, growth: "+0.3%" },
    { range: "65+", percentage: 0.4, growth: "+0.1%" },
  ];

  const deviceData = [
    {
      device: "Mobile",
      percentage: 68.4,
      icon: <Smartphone className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      device: "Desktop",
      percentage: 24.7,
      icon: <Monitor className="w-5 h-5" />,
      color: "bg-green-500",
    },
    {
      device: "Tablet",
      percentage: 6.9,
      icon: <Tablet className="w-5 h-5" />,
      color: "bg-purple-500",
    },
  ];

  const watchTimeByHour = [
    { hour: "00:00", views: 1200 },
    { hour: "01:00", views: 800 },
    { hour: "02:00", views: 600 },
    { hour: "03:00", views: 400 },
    { hour: "04:00", views: 300 },
    { hour: "05:00", views: 500 },
    { hour: "06:00", views: 1800 },
    { hour: "07:00", views: 3200 },
    { hour: "08:00", views: 4500 },
    { hour: "09:00", views: 5200 },
    { hour: "10:00", views: 4800 },
    { hour: "11:00", views: 4200 },
    { hour: "12:00", views: 6800 },
    { hour: "13:00", views: 7200 },
    { hour: "14:00", views: 8500 },
    { hour: "15:00", views: 9200 },
    { hour: "16:00", views: 8800 },
    { hour: "17:00", views: 7500 },
    { hour: "18:00", views: 9800 },
    { hour: "19:00", views: 11200 },
    { hour: "20:00", views: 12500 },
    { hour: "21:00", views: 10800 },
    { hour: "22:00", views: 8200 },
    { hour: "23:00", views: 5500 },
  ];

  const subscriberGrowth = [
    { period: "Jan", new: 2847, lost: 234, net: 2613 },
    { period: "Feb", new: 3156, lost: 189, net: 2967 },
    { period: "Mar", new: 3892, lost: 267, net: 3625 },
    { period: "Apr", new: 4234, lost: 198, net: 4036 },
    { period: "May", new: 3967, lost: 223, net: 3744 },
    { period: "Jun", new: 4521, lost: 201, net: 4320 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Audience Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Understand your viewers and their behavior patterns
            </p>
          </div>
        </div>

        <Tabs defaultValue="demographics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border shadow-sm">
            <TabsTrigger
              value="demographics"
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Demographics</span>
            </TabsTrigger>
            <TabsTrigger
              value="geography"
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>Geography</span>
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="flex items-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Devices</span>
            </TabsTrigger>
            <TabsTrigger
              value="behavior"
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Behavior</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Growth</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ageGroups.map((group, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {group.range} years
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200"
                            >
                              {group.growth}
                            </Badge>
                            <span className="text-sm font-bold">
                              {group.percentage}%
                            </span>
                          </div>
                        </div>
                        <Progress value={group.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          62.4%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Male</div>
                        <div className="text-xs text-green-600 mt-1">
                          +2.1% vs last month
                        </div>
                      </div>
                      <div className="text-center p-6 bg-pink-50 rounded-lg">
                        <div className="text-3xl font-bold text-pink-600">
                          37.6%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Female</div>
                        <div className="text-xs text-green-600 mt-1">
                          +1.8% vs last month
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Gender by Age Group
                      </h4>
                      {["18-24", "25-34", "35-44", "45+"].map((age, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">{age}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${65 - index * 5}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-8">
                              {65 - index * 5}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Audience Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      interest: "Technology",
                      percentage: 89.2,
                      color: "bg-blue-500",
                    },
                    {
                      interest: "Programming",
                      percentage: 76.8,
                      color: "bg-green-500",
                    },
                    {
                      interest: "Web Development",
                      percentage: 68.4,
                      color: "bg-purple-500",
                    },
                    {
                      interest: "Software Engineering",
                      percentage: 54.7,
                      color: "bg-yellow-500",
                    },
                    {
                      interest: "AI & Machine Learning",
                      percentage: 43.2,
                      color: "bg-red-500",
                    },
                    {
                      interest: "Mobile Development",
                      percentage: 38.9,
                      color: "bg-indigo-500",
                    },
                    {
                      interest: "DevOps",
                      percentage: 29.6,
                      color: "bg-pink-500",
                    },
                    {
                      interest: "Cybersecurity",
                      percentage: 21.3,
                      color: "bg-gray-500",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${item.color}`}
                        ></div>
                        <span className="text-sm font-bold">
                          {item.percentage}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.interest}
                      </p>
                      <Progress value={item.percentage} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {geographicData.map((country, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedCountry === country.code
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedCountry(country.code)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                              <span className="font-medium">
                                {country.country}
                              </span>
                            </div>
                            <span className="text-lg font-bold">
                              {country.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={country.percentage}
                            className="h-2 mb-2"
                          />
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{country.views} views</span>
                            <span>{country.subscribers} subscribers</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Cities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { city: "New York", country: "US", percentage: 12.4 },
                        { city: "London", country: "UK", percentage: 8.7 },
                        { city: "Toronto", country: "CA", percentage: 6.2 },
                        { city: "Sydney", country: "AU", percentage: 4.8 },
                        { city: "Berlin", country: "DE", percentage: 3.9 },
                      ].map((city, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {city.city}
                            </p>
                            <p className="text-sm text-gray-500">
                              {city.country}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{city.percentage}%</p>
                            <Progress
                              value={city.percentage}
                              className="w-16 h-1 mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Language Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { language: "English", percentage: 78.4 },
                        { language: "Spanish", percentage: 8.7 },
                        { language: "French", percentage: 5.2 },
                        { language: "German", percentage: 4.1 },
                        { language: "Others", percentage: 3.6 },
                      ].map((lang, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {lang.language}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={lang.percentage}
                              className="w-16 h-2"
                            />
                            <span className="text-sm font-bold w-10">
                              {lang.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {deviceData.map((device, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 ${device.color} text-white rounded-lg`}
                            >
                              {device.icon}
                            </div>
                            <span className="font-medium">{device.device}</span>
                          </div>
                          <span className="text-xl font-bold">
                            {device.percentage}%
                          </span>
                        </div>
                        <Progress value={device.percentage} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Systems</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { os: "Android", percentage: 42.3, icon: "🤖" },
                      { os: "iOS", percentage: 26.1, icon: "🍎" },
                      { os: "Windows", percentage: 18.7, icon: "🪟" },
                      { os: "macOS", percentage: 6.2, icon: "💻" },
                      { os: "Linux", percentage: 4.1, icon: "🐧" },
                      { os: "Others", percentage: 2.6, icon: "❓" },
                    ].map((os, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{os.icon}</span>
                          <span className="font-medium">{os.os}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress
                            value={os.percentage}
                            className="w-20 h-2"
                          />
                          <span className="font-bold w-12">
                            {os.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      browser: "Chrome",
                      percentage: 68.4,
                      color: "bg-yellow-500",
                    },
                    {
                      browser: "Safari",
                      percentage: 18.7,
                      color: "bg-blue-500",
                    },
                    {
                      browser: "Firefox",
                      percentage: 7.2,
                      color: "bg-orange-500",
                    },
                    { browser: "Edge", percentage: 4.1, color: "bg-blue-600" },
                    { browser: "Opera", percentage: 1.2, color: "bg-red-500" },
                    {
                      browser: "Others",
                      percentage: 0.4,
                      color: "bg-gray-500",
                    },
                  ].map((browser, index) => (
                    <div
                      key={index}
                      className="text-center p-4 bg-white border rounded-lg"
                    >
                      <div
                        className={`w-12 h-12 ${browser.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold`}
                      >
                        {browser.browser.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900">
                        {browser.browser}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {browser.percentage}%
                      </p>
                      <Progress
                        value={browser.percentage}
                        className="h-1 mt-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Viewing Patterns by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-1 h-full">
                    {watchTimeByHour.map((hour, index) => (
                      <div
                        key={index}
                        className="flex flex-col justify-end items-center"
                      >
                        <div
                          className="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600 cursor-pointer"
                          style={{ height: `${(hour.views / 12500) * 100}%` }}
                          title={`${hour.hour}: ${hour.views} views`}
                        ></div>
                        <span className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                          {hour.hour.split(":")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        duration: "0-30 seconds",
                        percentage: 15.2,
                        color: "bg-red-500",
                      },
                      {
                        duration: "30s - 2 minutes",
                        percentage: 23.8,
                        color: "bg-orange-500",
                      },
                      {
                        duration: "2-5 minutes",
                        percentage: 28.4,
                        color: "bg-yellow-500",
                      },
                      {
                        duration: "5-10 minutes",
                        percentage: 18.7,
                        color: "bg-green-500",
                      },
                      {
                        duration: "10+ minutes",
                        percentage: 13.9,
                        color: "bg-blue-500",
                      },
                    ].map((session, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {session.duration}
                          </span>
                          <span className="text-sm font-bold">
                            {session.percentage}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={session.percentage}
                            className="flex-1 h-2"
                          />
                          <div
                            className={`w-3 h-3 rounded-full ${session.color}`}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        metric: "Average View Duration",
                        value: "6:42",
                        change: "+12%",
                      },
                      { metric: "Bounce Rate", value: "23.4%", change: "-5%" },
                      {
                        metric: "Return Viewers",
                        value: "67.8%",
                        change: "+8%",
                      },
                      {
                        metric: "Subscription Rate",
                        value: "3.2%",
                        change: "+15%",
                      },
                      { metric: "Like Rate", value: "8.7%", change: "+3%" },
                      { metric: "Comment Rate", value: "2.1%", change: "+7%" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium">
                          {item.metric}
                        </span>
                        <div className="text-right">
                          <span className="font-bold">{item.value}</span>
                          <Badge
                            variant={
                              item.change.startsWith("+")
                                ? "default"
                                : "destructive"
                            }
                            className="ml-2 text-xs"
                          >
                            {item.change}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-green-600" />
                    Subscriber Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriberGrowth.map((month, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {month.period} 2024
                          </span>
                          <Badge variant="default" className="bg-green-600">
                            +{month.net.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-green-600 font-bold">
                              +{month.new.toLocaleString()}
                            </div>
                            <div className="text-gray-500">New</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 font-bold">
                              -{month.lost.toLocaleString()}
                            </div>
                            <div className="text-gray-500">Lost</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-bold">
                              +{month.net.toLocaleString()}
                            </div>
                            <div className="text-gray-500">Net</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                    Subscriber Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        source: "YouTube Search",
                        subscribers: 12847,
                        percentage: 42.3,
                      },
                      {
                        source: "Suggested Videos",
                        subscribers: 8934,
                        percentage: 29.4,
                      },
                      {
                        source: "Browse Features",
                        subscribers: 4521,
                        percentage: 14.9,
                      },
                      {
                        source: "External",
                        subscribers: 2156,
                        percentage: 7.1,
                      },
                      {
                        source: "Direct/Unknown",
                        subscribers: 1876,
                        percentage: 6.2,
                      },
                    ].map((source, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {source.source}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-bold">
                              {source.subscribers.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({source.percentage}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={source.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Growth Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      52.4K
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Projected Subscribers
                    </div>
                    <div className="text-xs text-green-600">Next Month</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      3.2M
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Projected Views
                    </div>
                    <div className="text-xs text-green-600">Next Month</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      75K
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Projected Subscribers
                    </div>
                    <div className="text-xs text-green-600">End of Year</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
