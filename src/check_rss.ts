/**
 * 定时轮询 RSS 并通知
 */

import Parser from "rss-parser";
import TurndownService from "turndown";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import { ReadKV, WriteKV } from "./utils/cf";
import { PushMessage } from "./utils/notify";

type RSSResp = {
	title: string;
	items: {
		title: string;
		description: string;
		link: string;
		pubDate: number;
	}[];
};

type RSSListItem = {
	url: string;
	tag: string;
	format: "text" | "markdown" | "html";
};

type CheckRssCfg = Record<string, number>;

const rss_urls: RSSListItem[] = [
	{
		url: "https://rsshub.app/epicgames/freegames/zh-CN",
		tag: "tg_ntfy_bot",
		format: "text",
	},
	{
		url: "https://rsshub.app/dockerhub/build/deluan/navidrome",
		tag: "tg_ntfy_bot",
		format: "text",
	},
	{
		url: "https://rsshub.app/dockerhub/build/vaultwarden/server",
		tag: "tg_ntfy_bot",
		format: "text",
	},
	{
		url: "https://rsshub.app/dockerhub/build/teddysun/xray",
		tag: "tg_ntfy_bot",
		format: "text",
	},
];

const rss_parser = new Parser();
const turndownService = new TurndownService();

let check_rss_cfg: CheckRssCfg = {};

async function initCfg() {
	let fail_count = 0;
	let cfg_str = "{}";
	for (; fail_count < 3; ++fail_count) {
		try {
			const a = await ReadKV("check_rss_cfg");
			if (a != null) {
				cfg_str = typeof a === "string" ? a : JSON.stringify(a);
				break;
			}
		} catch (e) {
			console.warn(`Get check_rss_cfg error: ${e}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	try {
		console.log("cfg_str: ", cfg_str);
		check_rss_cfg = JSON.parse(cfg_str);
		return true;
	} catch (e) {
		console.warn(`parse check_rss_cfg to JSON error: ${e}`);
	}
	return false;
}

async function saveCfg() {
	let fail_count = 0;
	const cfg = JSON.stringify(check_rss_cfg);
	console.log(`save cfg to KV: ${cfg}`);
	for (; fail_count < 3; ++fail_count) {
		try {
			const resp = await WriteKV("check_rss_cfg", cfg);
			if (resp) {
				break;
			}
		} catch (e) {
			console.warn(`Save check_rss_cfg [${cfg}] error: ${e}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
}

async function fetchRss(url: string) {
	try {
		const resp = await axios.get(url);
		if (resp.status == 200) {
			const rss = await rss_parser.parseString(resp.data);
			let rss_list: RSSResp = {
				title: rss.title!,
				items: [],
			};
			for (const it of rss.items) {
				rss_list.items.push({
					title: it.title || "",
					description: turndownService.turndown(it.content || ""),
					link: it.link || "void(0);",
					pubDate: Date.parse(it.pubDate || "0"),
				});
			}
			rss_list.items.sort((a, b) => a.pubDate - b.pubDate);
			return rss_list;
		}
	} catch (e) {
		console.warn(`Fetch rss [${url}] error: ${e}`);
	}
	return null;
}

async function CheckRSSIsNew(item: RSSListItem, rss_list: RSSResp) {
	const url_encode = Buffer.from(item.url).toString("base64");
	for (const rss of rss_list.items) {
		let cacheData = check_rss_cfg[url_encode] ?? 0;
		if (cacheData < rss.pubDate) {
			check_rss_cfg[url_encode] = rss.pubDate;
			const titl = `RSS订阅更新 (${rss_list.title})`;
			if (
				await PushMessage({
					title: titl,
					body: `> ${rss.title}\n\n${rss.description}\n\n[阅读原文](${rss.link})`,
					format: item.format,
					tag: item.tag,
				})
			) {
				console.log("Push RSS Message Success!");
			} else {
				console.warn("Push RSS Message error!");
			}
		}
	}
}

(async () => {
	const status = await initCfg();
	if (!status) {
		check_rss_cfg = {};
	}
	for (const item of rss_urls) {
		try {
			const rss_list = await fetchRss(item.url);
			if (rss_list != null) {
				await CheckRSSIsNew(item, rss_list);
			}
		} catch (e) {
			console.warn("Check rss publish error!");
		}
	}
	await saveCfg();
})();
