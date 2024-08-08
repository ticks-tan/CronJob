import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const notify_url = process.env.NOTIFY_URL!;

export type NotifyBody = {
	title?: string;
	desc?: string;
	content?: string;
	url?: string;
	to?: string;
	async?: boolean;
	channel?: string;
};

export async function PushMessage(body: NotifyBody) {
	try {
		const resp = await axios.post(notify_url, body, {
			headers: {
				Authorization: process.env.NOTIFY_TOKEN!,
				"Content-Type": "application/json",
			},
		});
		if (
			resp.status == 200 &&
			resp.data.success &&
			resp.data.success === true
		) {
			return true;
		}
	} catch (error) {
		console.log(`PushMessage error: ${error}`);
	}
	return false;
}
