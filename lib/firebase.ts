interface FirebaseCompatConfig {
	apiKey: string;
	projectId: string;
	messagingSenderId: string;
	appId: string;
	storageBucket?: string;
}

function readConfig(): FirebaseCompatConfig | null {
	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
	const messagingSenderId =
		process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
	const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
	if (!apiKey || !projectId || !messagingSenderId || !appId) return null;
	return {
		apiKey,
		projectId,
		messagingSenderId,
		appId,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
	};
}

export function isFirebaseConfigured(): boolean {
	return readConfig() != null;
}

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = src;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load ${src}`));
		document.head.appendChild(script);
	});
}

export async function getWebFcmToken(): Promise<string | null> {
	if (typeof window === "undefined") return null;
	const config = readConfig();
	const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
	if (!config || !vapidKey) return null;

	try {
		await loadScript(
			"https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
		);
		await loadScript(
			"https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
		);

		const firebase = (
			window as Window & {
				firebase?: {
					apps?: unknown[];
					initializeApp: (cfg: FirebaseCompatConfig) => void;
					messaging: () => {
						getToken: (opts: { vapidKey: string }) => Promise<string>;
					};
				};
			}
		).firebase;

		if (!firebase) return null;
		if (!firebase.apps?.length) firebase.initializeApp(config);
		if ("serviceWorker" in navigator) {
			await navigator.serviceWorker.register("/firebase-messaging-sw.js");
		}
		const token = await firebase.messaging().getToken({ vapidKey });
		return token || null;
	} catch {
		return null;
	}
}
