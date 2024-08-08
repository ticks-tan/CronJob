declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production" | "test";
		NOTIFY_TOKEN: string;
		NOTIFY_URL: string;

		RSS_URLS: string;
		CF_ACCOUNT_ID: string;
		CF_KV_ID: string;
		CF_KV_API_KEY: string;
	}
}
