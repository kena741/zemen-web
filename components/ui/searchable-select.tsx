"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchableOption = {
	id: string;
	label: string;
};

export function SearchableSelect({
	options,
	value,
	onChange,
	placeholder,
	disabled,
	emptyLabel = "No matches",
	className,
	triggerClassName,
}: {
	options: SearchableOption[];
	value: string;
	onChange: (id: string) => void;
	placeholder: string;
	disabled?: boolean;
	emptyLabel?: string;
	className?: string;
	triggerClassName?: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);
	const selected = useMemo(
		() => options.find((o) => o.id === value) ?? null,
		[options, value],
	);
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter((o) => o.label.toLowerCase().includes(q));
	}, [options, query]);

	useEffect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	return (
		<div ref={rootRef} className={cn("relative", className)}>
			<button
				type="button"
				disabled={disabled}
				aria-expanded={open}
				onClick={() => {
					if (disabled) return;
					setOpen((v) => !v);
					setQuery("");
				}}
				className={cn(
					"flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#cfd8c9] bg-white px-4 text-left text-[15px] outline-none transition-[box-shadow,border-color]",
					"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
					disabled && "opacity-60",
					triggerClassName,
				)}
			>
				<span
					className={cn(
						"min-w-0 truncate",
						selected ? "text-foreground" : "text-muted-foreground/70",
					)}
				>
					{selected?.label ?? placeholder}
				</span>
				<ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
			</button>
			{open ? (
				<div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-white shadow-md">
					<div className="relative border-b border-border/70 p-2">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={placeholder}
							className="h-9 w-full rounded-lg bg-muted/50 pr-3 pl-9 text-sm outline-none focus:bg-muted"
						/>
					</div>
					<ul className="max-h-56 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<li className="px-3 py-2.5 text-sm text-muted-foreground">
								{emptyLabel}
							</li>
						) : (
							filtered.map((o) => (
								<li key={o.id}>
									<button
										type="button"
										className={cn(
											"w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60",
											o.id === value && "bg-primary/8 font-medium text-primary",
										)}
										onClick={() => {
											onChange(o.id);
											setOpen(false);
											setQuery("");
										}}
									>
										{o.label}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			) : null}
		</div>
	);
}
