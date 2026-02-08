"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = "success" | "error" | "info" | "warning"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  duration?: number
}

interface NotificationProps {
  notification: Notification
  onDismiss: (id: string) => void
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: {
    bg: "bg-success/10 border-success/30",
    text: "text-success",
    icon: "text-success",
  },
  error: {
    bg: "bg-destructive/10 border-destructive/30",
    text: "text-destructive",
    icon: "text-destructive",
  },
  info: {
    bg: "bg-primary/10 border-primary/30",
    text: "text-primary",
    icon: "text-primary",
  },
  warning: {
    bg: "bg-warning/10 border-warning/30",
    text: "text-warning",
    icon: "text-warning",
  },
}

function NotificationItem({ notification, onDismiss }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = icons[notification.type]
  const style = styles[notification.type]

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Auto-dismiss
    const duration = notification.duration ?? 5000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(notification.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [notification.id, notification.duration, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ease-out",
        style.bg,
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      )}
      style={{ minWidth: "320px", maxWidth: "420px" }}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.icon)} />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-semibold", style.text)}>
          {notification.title}
        </div>
        {notification.description && (
          <div className="mt-1 text-xs text-muted-foreground">
            {notification.description}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onDismiss(notification.id), 300)
        }}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}

// Notification store
let notifications: Notification[] = []
let listeners: Array<(notifications: Notification[]) => void> = []

function notify(notification: Omit<Notification, "id">) {
  const id = Math.random().toString(36).substring(2, 9)
  const newNotification: Notification = { ...notification, id }
  notifications = [...notifications, newNotification]
  listeners.forEach((listener) => listener(notifications))
  return id
}

function dismiss(id: string) {
  notifications = notifications.filter((n) => n.id !== id)
  listeners.forEach((listener) => listener(notifications))
}

function useNotifications() {
  const [state, setState] = useState<Notification[]>(notifications)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  }, [])

  return state
}

export function NotificationContainer() {
  const notifications = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onDismiss={dismiss}
          />
        </div>
      ))}
    </div>
  )
}

// Export notification functions
export const notification = {
  success: (title: string, description?: string, duration?: number) =>
    notify({ type: "success", title, description, duration }),
  error: (title: string, description?: string, duration?: number) =>
    notify({ type: "error", title, description, duration }),
  info: (title: string, description?: string, duration?: number) =>
    notify({ type: "info", title, description, duration }),
  warning: (title: string, description?: string, duration?: number) =>
    notify({ type: "warning", title, description, duration }),
}
