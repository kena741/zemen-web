export function generateStaticParams() {
	return [{ peerId: "_" }];
}

export default function PeerIdLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
