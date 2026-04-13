"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{ onOpenChange: (open: boolean) => void }>({
  onOpenChange: () => {},
});

function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ onOpenChange }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </AlertDialogContext.Provider>
  );
}

function AlertDialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogContent className={cn("sm:max-w-md", className)}>
      {children}
    </DialogContent>
  );
}

function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <DialogHeader>{children}</DialogHeader>;
}

function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <DialogFooter>{children}</DialogFooter>;
}

function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <DialogTitle>{children}</DialogTitle>;
}

function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <DialogDescription>{children}</DialogDescription>;
}

function AlertDialogCancel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { onOpenChange } = React.useContext(AlertDialogContext);
  return (
    <Button variant="outline" className={className} onClick={() => onOpenChange(false)}>
      {children}
    </Button>
  );
}

function AlertDialogAction({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { onOpenChange } = React.useContext(AlertDialogContext);
  return (
    <Button
      className={className}
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
    >
      {children}
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
};
