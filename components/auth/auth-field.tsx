"use client";

import type { ComponentProps, ReactNode } from "react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export const authInputGroupClass =
	"h-12 rounded-xl border-transparent bg-muted/80 shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-primary/30 has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20";

export const authInputClass =
	"h-12 bg-transparent text-[14px] shadow-none placeholder:text-[14px] placeholder:font-normal placeholder:leading-snug placeholder:text-muted-foreground focus-visible:ring-0";

export function AuthFieldLabel({
	htmlFor,
	children,
	className,
}: {
	htmlFor?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label
			htmlFor={htmlFor}
			className={cn(
				"mb-1.5 block text-[12px] font-medium text-muted-foreground",
				className,
			)}
		>
			{children}
		</label>
	);
}

export function AuthTextField({
	start,
	end,
	className,
	inputClassName,
	...props
}: ComponentProps<typeof InputGroupInput> & {
	start?: ReactNode;
	end?: ReactNode;
	inputClassName?: string;
}) {
	return (
		<InputGroup className={cn(authInputGroupClass, className)}>
			{start ? (
				<InputGroupAddon align="inline-start" className="pr-0.5">
					{start}
				</InputGroupAddon>
			) : null}
			<InputGroupInput
				{...props}
				className={cn(
					authInputClass,
					start && "pl-2",
					end && "pr-2",
					inputClassName,
				)}
			/>
			{end ? (
				<InputGroupAddon align="inline-end" className="pl-0.5">
					{end}
				</InputGroupAddon>
			) : null}
		</InputGroup>
	);
}

export { InputGroupButton as AuthFieldButton };
