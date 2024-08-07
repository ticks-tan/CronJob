declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production" | "test";
		NOTIFY_TOKEN: string;
		NOTIFY_URL: string;
		RSS_URLS: string;
	}
}
