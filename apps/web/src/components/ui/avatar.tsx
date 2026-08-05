import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

const sizes = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-[12px]", lg: "h-14 w-14 text-[15px]", xl: "h-20 w-20 text-[20px]" } as const;

export function UserAvatar({ src, name, size = "md", className }: { src?: string | null; name?: string | null; size?: keyof typeof sizes; className?: string }) {
  return (
    <AvatarPrimitive.Root className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-ink-700 text-white", sizes[size], className)}>
      {src ? <AvatarPrimitive.Image src={src} alt={name ?? "Avatar"} className="h-full w-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center font-semibold" delayMs={src ? 350 : 0}>
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
