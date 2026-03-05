import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export function Tooltip({
    children,
    content,
}: {
    children: React.ReactNode;
    content: React.ReactNode;
}) {
    return (
        <TooltipPrimitive.Provider delayDuration={200}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side="top"
                        align="center"
                        sideOffset={4}
                        className={cn(
                            "rounded-md px-3 py-2 text-sm shadow-md",
                            "bg-neutral-800 text-neutral-100",
                            "animate-in fade-in-0 zoom-in-95"
                        )}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-neutral-800" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}
