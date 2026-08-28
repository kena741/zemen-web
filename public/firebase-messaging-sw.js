importScripts(
	"https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
	"https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
	apiKey: self.__FIREBASE_CONFIG__?.apiKey,
	projectId: self.__FIREBASE_CONFIG__?.projectId,
	messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId,
	appId: self.__FIREBASE_CONFIG__?.appId,
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(() => {});
