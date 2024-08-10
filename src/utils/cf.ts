/**
 * Cloudflare 相关操作
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const account_id = process.env.CF_ACCOUNT_ID!;
const namespace_id = process.env.CF_KV_ID!;
const api_key = `Bearer ${process.env.CF_KV_API_KEY!}`;

export async function ReadKV(key: string) {
	const api_url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${key}`;

	try {
		const resp = await axios.get(api_url, {
			headers: {
				Authorization: api_key,
				"Content-Type": "application/json",
			},
		});
		if (resp.status == 200 && resp.data) {
			return resp.data as string;
		}
	} catch (e) {
		console.warn(`Read KV Storage [${key}] error: ${e}`);
	}
	return null;
}

export async function WriteKV(key: string, value: string) {
	const api_url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${namespace_id}/values/${key}`;

	try {
		const resp = await axios.put(api_url, value, {
			headers: {
				Authorization: api_key,
				"Content-Type": "text/plain",
			},
		});
		if (
			resp.status == 200 &&
			resp.data.success &&
			resp.data.success === true
		) {
			return true;
		}
	} catch (e) {
		console.warn(`Write KV Storage [${key}] error: ${e}`);
	}
	return false;
}
