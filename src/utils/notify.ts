import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const notify_url = process.env.NOTIFY_URL!;

export type NotifyBody = {
	title?: string;
	body: string;
	type?: "info" | "success" | "warning" | "failure";
	tag?: string;
	format?: "text" | "markdown" | "html";
};

export async function PushMessage(opt: NotifyBody) {
	if (opt.tag == null) {
		opt.tag = "all";
	}
	try {
		const resp = await axios.post(notify_url, opt, {
			headers: {
				"Content-Type": "application/json",
			},
			auth: {
				username: process.env.NOTIFY_AUTH_USER!,
				password: process.env.NOTIFY_AUTH_PWD!,
			},
		});
		if (resp.status == 200) {
			if (resp.data.error === null) {
				return true;
			}
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.log(
				`PushMessage error: AxiosError: ${error.response?.status} - ${error.response?.statusText}`
			);
			console.log(
				`Response data: ${JSON.stringify(error.response?.data)}`
			);
		} else {
			console.log(`PushMessage error: ${error}`);
		}
	}
	return false;
}
