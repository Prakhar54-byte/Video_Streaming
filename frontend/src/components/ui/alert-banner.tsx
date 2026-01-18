"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AlertVariant = "success" | "error" | "warning" | "info" | "loading";

interface AlertBannerProps {
  variant: AlertVariant;
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    bgClass: "bg-green-500/10 border-green-500/20",
    iconClass: "text-green-500",
    titleClass: "text-green-700 dark:text-green-400",
  },
  error: {
    icon: XCircle,
    bgClass: "bg-red-500/10 border-red-500/20",
    iconClass: "text-red-500",
    titleClass: "text-red-700 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-yellow-500/10 border-yellow-500/20",
    iconClass: "text-yellow-500",
    titleClass: "text-yellow-700 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-500/10 border-blue-500/20",
    iconClass: "text-blue-500",
    titleClass: "text-blue-700 dark:text-blue-400",
  },
  loading: {
    icon: Loader2,
    bgClass: "bg-primary/10 border-primary/20",
    iconClass: "text-primary animate-spin",
    titleClass: "text-primary",
  },
};

export function AlertBanner({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        config.bgClass,
        className
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconClass)} />

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", config.titleClass)}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <Button
            variant="link"
            size="sm"
            onClick={action.onClick}
            className={cn("p-0 h-auto mt-2", config.titleClass)}
          >
            {action.label}
          </Button>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Inline alert for form fields
interface InlineAlertProps {
  variant: "error" | "warning" | "info";
  message: string;
  className?: string;
}

export function InlineAlert({ variant, message, className }: InlineAlertProps) {
  const config = {
    error: { icon: XCircle, className: "text-red-500" },
    warning: { icon: AlertTriangle, className: "text-yellow-500" },
    info: { icon: Info, className: "text-blue-500" },
  };

  const { icon: Icon, className: colorClass } = config[variant];

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", colorClass, className)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default AlertBanner;
