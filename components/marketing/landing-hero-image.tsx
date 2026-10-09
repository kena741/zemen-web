import Image from "next/image";

import authHero from "@/assets/images/optimized/auth_page_hero.jpg";

/** Server-rendered LCP hero so the image is discoverable in the initial HTML. */
export function LandingHeroImage() {
	return (
		<Image
			src={authHero}
			alt="Zemen Service professionals: electrician, plumber, cleaning, painting, catering"
			fill
			preload
			fetchPriority="high"
			quality={70}
			sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
			className="object-cover object-[center_35%] md:object-center"
		/>
	);
}
