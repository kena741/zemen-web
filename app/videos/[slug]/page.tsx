import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoWatchView } from "@/components/marketing/video-watch";
import { buildPageMetadata, getServiceVideo, listServiceVideos } from "@/lib/seo-services";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
	return listServiceVideos().map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const video = getServiceVideo(slug);
	if (!video) return {};
	return buildPageMetadata({
		title: `${video.title} (Video)`,
		description: video.description,
		path: `/videos/${video.slug}`,
	});
}

export default async function VideoPage({ params }: PageProps) {
	const { slug } = await params;
	const video = getServiceVideo(slug);
	if (!video) notFound();
	return <VideoWatchView video={video} />;
}
