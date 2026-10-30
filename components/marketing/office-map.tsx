import { BRAND_NAME } from "@/lib/brand";
import { OFFICE } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/**
 * Embedded map of the office. The whole map is a link to the Google Business
 * Profile, so a click or tap opens Google Maps instead of panning the embed.
 */
export function OfficeMap({ className }: { className?: string }) {
	return (
		<a
			href={OFFICE.mapsUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`Open the ${BRAND_NAME} office at ${OFFICE.building}, ${OFFICE.city} in Google Maps`}
			className={cn(
				"group relative block overflow-hidden bg-[#e8f5e3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
				className,
			)}
		>
			<iframe
				src={OFFICE.embedUrl}
				title={`Map of the ${BRAND_NAME} office`}
				className="pointer-events-none absolute inset-0 size-full border-0"
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				tabIndex={-1}
				aria-hidden
			/>
		</a>
	);
}
