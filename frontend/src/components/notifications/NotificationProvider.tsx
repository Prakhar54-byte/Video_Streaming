"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
  Bell,
} from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 0 = persistent, otherwise milliseconds
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

// Helper hooks for common notification patterns
export function useUploadNotification() {
  const { addNotification, updateNotification, removeNotification } = useNotifications();

  const startUpload = useCallback((fileName: string) => {
    return addNotification({
      type: "loading",
      title: "Uploading...",
      message: `Uploading ${fileName}`,
      duration: 0, // persistent
      dismissible: false,
    });
  }, [addNotification]);

  const updateProgress = useCallback((id: string, progress: number) => {
    updateNotification(id, {
      message: `Upload progress: ${progress}%`,
    });
  }, [updateNotification]);

  const uploadComplete = useCallback((id: string) => {
    updateNotification(id, {
      type: "success",
      title: "Upload Complete!",
      message: "Your video is now processing...",
      duration: 5000,
      dismissible: true,
    });
  }, [updateNotification]);

  const uploadError = useCallback((id: string, error: string) => {
    updateNotification(id, {
      type: "error",
      title: "Upload Failed",
      message: error,
      duration: 0,
      dismissible: true,
    });
  }, [updateNotification]);

  return { startUpload, updateProgress, uploadComplete, uploadError, removeNotification };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      id,
      duration: 5000,
      dismissible: true,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, ...updates };
          
          // If duration is set and > 0, start auto-remove timer
          if (updates.duration && updates.duration > 0) {
            setTimeout(() => {
              setNotifications((p) => p.filter((notif) => notif.id !== id));
            }, updates.duration);
          }
          
          return updated;
        }
        return n;
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, updateNotification, clearAll }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
}

// Notification display component
function NotificationContainer({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const iconConfig = {
    success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
    loading: { icon: Loader2, color: "text-primary", bg: "bg-primary/10" },
  };

  const config = iconConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto rounded-lg border bg-card p-4 shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        notification.type === "error" && "border-red-500/20",
        notification.type === "success" && "border-green-500/20"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("shrink-0 p-1 rounded-full", config.bg)}>
          <Icon
            className={cn(
              "w-5 h-5",
              config.color,
              notification.type === "loading" && "animate-spin"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          {notification.message && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {notification.message}
            </p>
          )}

          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm text-primary hover:underline mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {notification.dismissible && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationProvider;
