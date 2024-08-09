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
};

const rss_urls: RSSListItem[] = [
	{
		url: "https://rsshub.app/qqorw/mrzb",
		tag: "wecom_bot",
	},
	{
		url: "https://rsshub.app/huanqiu/news/world",
		tag: "wecom_bot",
	},
	{
		url: "https://rsshub.app/dockerhub/build/deluan/navidrome",
		tag: "wecom_bot",
	},
	{
		url: "https://rsshub.app/dockerhub/build/vaultwarden/server",
		tag: "wecom_bot",
	},
	{
		url: "https://rsshub.app/dockerhub/build/teddysun/xray",
		tag: "wecom_bot",
	},
];

const rss_parser = new Parser();
const turndownService = new TurndownService();

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
		let cacheData = 0;
		const cacheDataStr = await ReadKV(url_encode);
		if (cacheDataStr != null) {
			cacheData = Date.parse(cacheDataStr);
		}
		if (cacheData < rss.pubDate) {
			cacheData = rss.pubDate;
			const titl = `RSS订阅更新 (${rss_list.title})`;
			if (
				await PushMessage({
					title: titl,
					body: `> ${rss.title}\n\n${rss.description}\n\n[阅读原文](${rss.link})`,
					format: "markdown",
					tag: item.tag,
				})
			) {
				console.log("Push RSS Message Success!");
				await WriteKV(url_encode, cacheData.toString());
			} else {
				console.warn("Push RSS Message error!");
			}
		}
	}
}

(async () => {
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
})();
