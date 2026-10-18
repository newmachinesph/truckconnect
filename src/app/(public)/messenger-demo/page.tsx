"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"

type Message = {
  id: number
  sender: "bot" | "user"
  text: string
  options?: string[]
}

const welcomeMessages: Message[] = [
  {
    id: 1,
    sender: "bot",
    text: "Kumusta! Welcome to TruckConnect PH. I'm your virtual assistant. How can I help you today?",
    options: ["Track my delivery", "Get a quote", "Find available trucks", "Contact support"],
  },
]

const trackingFlow: Message[] = [
  { id: 100, sender: "user", text: "Track my delivery" },
  {
    id: 101,
    sender: "bot",
    text: "Sure! Please provide your waybill number or booking reference.",
  },
  { id: 102, sender: "user", text: "WB-2024-ABC123" },
  {
    id: 103,
    sender: "bot",
    text: "Found it! Here's your delivery status:\n\nBooking: WB-2024-ABC123\nStatus: In Transit\nOrigin: Manila, NCR\nDestination: Cebu City\nETA: Mar 15, 2026 at 2:00 PM\n\nYour truck is currently near Batangas Port.",
    options: ["Get live location", "Contact driver", "Back to menu"],
  },
]

const quoteFlow: Message[] = [
  { id: 200, sender: "user", text: "Get a quote" },
  {
    id: 201,
    sender: "bot",
    text: "I'd be happy to help you get a quick estimate! Where are you shipping from?",
  },
  { id: 202, sender: "user", text: "Manila" },
  { id: 203, sender: "bot", text: "And where is the destination?" },
  { id: 204, sender: "user", text: "Davao City" },
  {
    id: 205,
    sender: "bot",
    text: "What type of truck do you need?",
    options: ["6-Wheeler Closed", "10-Wheeler", "Wing Van", "Trailer"],
  },
  { id: 206, sender: "user", text: "10-Wheeler" },
  {
    id: 207,
    sender: "bot",
    text: "Here's your estimated rate:\n\nRoute: Manila to Davao City\nDistance: ~1,500 km\nTruck: 10-Wheeler\nEstimated Rate: P45,000 - P55,000\n\nThis includes fuel surcharge and platform fees. Want to post this as a load?",
    options: ["Post load now", "Get another quote", "Back to menu"],
  },
]

export default function MessengerDemoPage() {
  const [messages, setMessages] = useState<Message[]>(welcomeMessages)
  const [inputText, setInputText] = useState("")

  function handleOption(option: string) {
    if (option === "Track my delivery") {
      setMessages([...welcomeMessages, ...trackingFlow])
    } else if (option === "Get a quote") {
      setMessages([...welcomeMessages, ...quoteFlow])
    } else if (option === "Back to menu") {
      setMessages(welcomeMessages)
    } else {
      // Generic response for other options
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "user", text: option },
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "This feature is coming soon! Our team is working hard to bring this to Messenger. In the meantime, visit truckconnect.ph for full access.",
          options: ["Back to menu"],
        },
      ])
    }
  }

  function handleSend() {
    if (!inputText.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: inputText },
      {
        id: Date.now() + 1,
        sender: "bot",
        text: "Thanks for your message! Our Messenger bot integration is under development. For now, please visit truckconnect.ph or use the quick actions below.",
        options: ["Track my delivery", "Get a quote", "Back to menu"],
      },
    ])
    setInputText("")
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Coming Soon Badge */}
        <div className="text-center mb-4">
          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-semibold">
            Coming Soon
          </Badge>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Messenger Bot Demo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Preview of our upcoming Facebook Messenger integration
          </p>
        </div>

        {/* Phone Frame */}
        <div className="relative mx-auto">
          {/* Phone bezel */}
          <div className="rounded-[2rem] border-4 border-slate-800 bg-slate-800 shadow-2xl overflow-hidden">
            {/* Notch */}
            <div className="flex justify-center py-1.5 bg-slate-800">
              <div className="w-20 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">TruckConnect PH</p>
                <p className="text-xs text-indigo-600">Active now</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-gray-50 h-[420px] overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                  {/* Quick Reply Options */}
                  {msg.options && msg.sender === "bot" && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                      {msg.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOption(option)}
                          className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-500 hover:bg-indigo-50 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 text-sm bg-gray-100 rounded-full px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                onClick={handleSend}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom bar */}
            <div className="flex justify-center py-1.5 bg-slate-800">
              <div className="w-24 h-1 rounded-full bg-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
