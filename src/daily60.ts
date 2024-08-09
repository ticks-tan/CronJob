/**
 * 每日早报
 */

import axios from "axios";
import { PushMessage } from "./utils/notify";
import dotenv from "dotenv";
dotenv.config();

const api_url = "https://api.03c3.cn/api/zb?type=jsonText";

interface Daily60WorldResp {
	code: number;
	msg: string;
	data: {
		text: string[];
	};
}

async function FetchDaily60World() {
	try {
		const resp = await axios.get(api_url, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (resp.status == 200) {
			const body: Daily60WorldResp = resp.data;
			if (body.code == 200) {
				let content = "";
				for (const txt of body.data.text) {
					content += txt + "\n\n";
				}
				if (
					await PushMessage({
						title: "每天 60s 读懂世界",
						body: content,
						format: "markdown",
					})
				) {
					console.log("Push [Daily 60s World] Message Success!");
				} else {
					console.log("Push [Daily 60s World] Message Faild!");
				}
			}
		}
	} catch (error) {
		console.log("Fetch daily60world error: ", error);
	}
}

(async () => {
	await FetchDaily60World();
})();
