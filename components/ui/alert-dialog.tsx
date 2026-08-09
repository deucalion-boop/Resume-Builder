"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#031127]/55 backdrop-blur-sm data-[state=open]:animate-[overlay-in_.18s_ease-out]" /><AlertDialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-2xl outline-none data-[state=open]:animate-[dialog-in_.22s_cubic-bezier(.2,.8,.2,1)]", className)} {...props} /></AlertDialogPrimitive.Portal>;
}
export const AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => <AlertDialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
export const AlertDialogDescription = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => <AlertDialogPrimitive.Description className={cn("mt-2 text-sm leading-6 text-muted-foreground", className)} {...props} />;
