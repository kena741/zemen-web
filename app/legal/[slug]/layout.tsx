export function generateStaticParams() {
	return [{ slug: "privacy" }, { slug: "terms" }, { slug: "about" }];
}

export default function LegalSlugLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
