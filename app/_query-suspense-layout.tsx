import { Suspense } from "react";

/** useSearchParams / useQueryId require a Suspense boundary under App Router. */
export default function QueryParamSuspenseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <Suspense fallback={null}>{children}</Suspense>;
}
