/**
 * Static-export shell for dynamic [id] routes.
 * Real IDs are resolved client-side via useParams(); this prerenders a
 * placeholder HTML shell required by `output: "export"`.
 */
export function generateStaticParams() {
	return [{ id: "_" }];
}

export default function DynamicIdLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
