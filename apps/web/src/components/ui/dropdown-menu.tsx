import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, align = "end", ...props }: DropdownPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 min-w-44 overflow-hidden rounded-xl border border-ink-100 bg-white p-1 shadow-pop", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: DropdownPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn("flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink-700 outline-none transition-colors hover:bg-ink-50 focus:bg-ink-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      {...props}
    />
  );
}

export const DropdownMenuLabel = ({ className, ...props }: DropdownPrimitive.DropdownMenuLabelProps) => (
  <DropdownPrimitive.Label className={cn("px-2.5 py-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400", className)} {...props} />
);

export const DropdownMenuSeparator = ({ className, ...props }: DropdownPrimitive.DropdownMenuSeparatorProps) => (
  <DropdownPrimitive.Separator className={cn("my-1 h-px bg-ink-100", className)} {...props} />
);
