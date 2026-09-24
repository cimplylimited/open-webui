import { apiFetch } from '$lib/apis/client';

export const getModels = async (token: string = '', base: boolean = false) => {
	const res = await apiFetch<{ data: any[] }>(`/api/models${base ? '/base' : ''}`, { token });
	return res?.data ?? [];
};

type ChatCompletedForm = {
	model: string;
	messages: string[];
	chat_id: string;
	session_id: string;
};

export const chatCompleted = async (token: string, body: ChatCompletedForm) => {
	return await apiFetch('/api/chat/completed', {
		method: 'POST',
		body: JSON.stringify(body),
		token
	});
};

type ChatActionForm = {
	model: string;
	messages: string[];
	chat_id: string;
};

export const chatAction = async (token: string, action_id: string, body: ChatActionForm) => {
	return await apiFetch(`/api/chat/actions/${action_id}`, {
		method: 'POST',
		body: JSON.stringify(body),
		token
	});
};

export const stopTask = async (token: string, id: string) => {
	return await apiFetch(`/api/tasks/stop/${id}`, { method: 'POST', token });
};

export const getTaskConfig = async (token: string = '') => {
	return await apiFetch('/api/v1/tasks/config', { token });
};

export const updateTaskConfig = async (token: string, config: object) => {
	return await apiFetch('/api/v1/tasks/config/update', {
		method: 'POST',
		body: JSON.stringify(config),
		token
	});
};

export const generateTitle = async (
	token: string = '',
	model: string,
	messages: string[],
	chat_id?: string
) => {
	const res = await apiFetch<{ choices: { message: { content: string } }[] }>(
		'/api/v1/tasks/title/completions',
		{
			method: 'POST',
			body: JSON.stringify({ model, messages, ...(chat_id && { chat_id }) }),
			token
		}
	);
	return res?.choices[0]?.message?.content.replace(/["']/g, '') ?? 'New Chat';
};

export const generateTags = async (
	token: string = '',
	model: string,
	messages: string,
	chat_id?: string
) => {
	const res = await apiFetch<{ choices: { message: { content: string } }[] }>(
		'/api/v1/tasks/tags/completions',
		{
			method: 'POST',
			body: JSON.stringify({ model, messages, ...(chat_id && { chat_id }) }),
			token
		}
	);

	try {
		const response = res?.choices[0]?.message?.content ?? '';
		const sanitizedResponse = response.replace(/['''`]/g, '"');
		const jsonStartIndex = sanitizedResponse.indexOf('{');
		const jsonEndIndex = sanitizedResponse.lastIndexOf('}');

		if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
			const parsed = JSON.parse(sanitizedResponse.substring(jsonStartIndex, jsonEndIndex + 1));
			if (parsed && parsed.tags) {
				return Array.isArray(parsed.tags) ? parsed.tags : [];
			}
		}
		return [];
	} catch (e) {
		console.error('Failed to parse response: ', e);
		return [];
	}
};

export const generateEmoji = async (
	token: string = '',
	model: string,
	prompt: string,
	chat_id?: string
) => {
	const res = await apiFetch<{ choices: { message: { content: string } }[] }>(
		'/api/v1/tasks/emoji/completions',
		{
			method: 'POST',
			body: JSON.stringify({ model, prompt, ...(chat_id && { chat_id }) }),
			token
		}
	);

	const response = res?.choices[0]?.message?.content.replace(/["']/g, '') ?? null;
	if (response && /\p{Extended_Pictographic}/u.test(response)) {
		return response.match(/\p{Extended_Pictographic}/gu)?.[0] ?? null;
	}
	return null;
};

export const generateQueries = async (
	token: string = '',
	model: string,
	messages: object[],
	prompt: string,
	type: string = 'web_search'
) => {
	const res = await apiFetch<{ choices: { message: { content: string } }[] }>(
		'/api/v1/tasks/queries/completions',
		{
			method: 'POST',
			body: JSON.stringify({ model, messages, prompt, type }),
			token
		}
	);

	const response = res?.choices[0]?.message?.content ?? '';
	try {
		const jsonStartIndex = response.indexOf('{');
		const jsonEndIndex = response.lastIndexOf('}');
		if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
			const parsed = JSON.parse(response.substring(jsonStartIndex, jsonEndIndex + 1));
			if (parsed && parsed.queries) {
				return Array.isArray(parsed.queries) ? parsed.queries : [];
			}
		}
		return [response];
	} catch (e) {
		console.error('Failed to parse response: ', e);
		return [response];
	}
};

export const generateAutoCompletion = async (
	token: string = '',
	model: string,
	prompt: string,
	messages?: object[],
	type: string = 'search query',
	signal?: AbortSignal
) => {
	const res = await apiFetch<{ choices: { message: { content: string } }[] }>(
		'/api/v1/tasks/auto/completions',
		{
			method: 'POST',
			body: JSON.stringify({ model, prompt, ...(messages && { messages }), type, stream: false }),
			token,
			signal
		}
	).catch(() => null);

	if (!res) return '';

	const response = res?.choices[0]?.message?.content ?? '';
	try {
		const jsonStartIndex = response.indexOf('{');
		const jsonEndIndex = response.lastIndexOf('}');
		if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
			const parsed = JSON.parse(response.substring(jsonStartIndex, jsonEndIndex + 1));
			return parsed?.text ?? '';
		}
		return response;
	} catch (e) {
		console.error('Failed to parse response: ', e);
		return response;
	}
};

export const generateMoACompletion = async (
	token: string = '',
	model: string,
	prompt: string,
	responses: string[]
) => {
	const controller = new AbortController();
	const res = await apiFetch('/api/v1/tasks/moa/completions', {
		method: 'POST',
		body: JSON.stringify({ model, prompt, responses, stream: true }),
		token,
		signal: controller.signal,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
	return [res, controller];
};

export const getPipelinesList = async (token: string = '') => {
	const res = await apiFetch<{ data: any[] }>('/api/v1/pipelines/list', { token });
	return res?.data ?? [];
};

export const uploadPipeline = async (token: string, file: File, urlIdx: string) => {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('urlIdx', urlIdx);
	return await apiFetch('/api/v1/pipelines/upload', { method: 'POST', body: formData, token });
};

export const downloadPipeline = async (token: string, url: string, urlIdx: string) => {
	return await apiFetch('/api/v1/pipelines/add', {
		method: 'POST',
		body: JSON.stringify({ url, urlIdx }),
		token
	});
};

export const deletePipeline = async (token: string, id: string, urlIdx: string) => {
	return await apiFetch('/api/v1/pipelines/delete', {
		method: 'DELETE',
		body: JSON.stringify({ id, urlIdx }),
		token
	});
};

export const getPipelines = async (token: string, urlIdx?: string) => {
	const searchParams = new URLSearchParams();
	if (urlIdx !== undefined) searchParams.append('urlIdx', urlIdx);
	const res = await apiFetch<{ data: any[] }>(
		`/api/v1/pipelines/?${searchParams.toString()}`,
		{ token }
	);
	return res?.data ?? [];
};

export const getPipelineValves = async (token: string, pipeline_id: string, urlIdx: string) => {
	const searchParams = new URLSearchParams();
	if (urlIdx !== undefined) searchParams.append('urlIdx', urlIdx);
	return await apiFetch(
		`/api/v1/pipelines/${pipeline_id}/valves?${searchParams.toString()}`,
		{ token }
	);
};

export const getPipelineValvesSpec = async (token: string, pipeline_id: string, urlIdx: string) => {
	const searchParams = new URLSearchParams();
	if (urlIdx !== undefined) searchParams.append('urlIdx', urlIdx);
	return await apiFetch(
		`/api/v1/pipelines/${pipeline_id}/valves/spec?${searchParams.toString()}`,
		{ token }
	);
};

export const updatePipelineValves = async (
	token: string = '',
	pipeline_id: string,
	valves: object,
	urlIdx: string
) => {
	const searchParams = new URLSearchParams();
	if (urlIdx !== undefined) searchParams.append('urlIdx', urlIdx);
	return await apiFetch(
		`/api/v1/pipelines/${pipeline_id}/valves/update?${searchParams.toString()}`,
		{ method: 'POST', body: JSON.stringify(valves), token }
	);
};

export const getBackendConfig = async () => {
	return await apiFetch('/api/config', { token: null, credentials: 'include' });
};

export const getChangelog = async () => {
	return await apiFetch('/api/changelog', { token: null });
};

export const getVersionUpdates = async () => {
	return await apiFetch('/api/version/updates', { token: null });
};

export const getModelFilterConfig = async (token: string) => {
	return await apiFetch('/api/config/model/filter', { token });
};

export const updateModelFilterConfig = async (
	token: string,
	enabled: boolean,
	models: string[]
) => {
	return await apiFetch('/api/config/model/filter', {
		method: 'POST',
		body: JSON.stringify({ enabled, models }),
		token
	});
};

export const getWebhookUrl = async (token: string) => {
	const res = await apiFetch<{ url: string }>('/api/webhook', { token });
	return res.url;
};

export const updateWebhookUrl = async (token: string, url: string) => {
	const res = await apiFetch<{ url: string }>('/api/webhook', {
		method: 'POST',
		body: JSON.stringify({ url }),
		token
	});
	return res.url;
};

export const getCommunitySharingEnabledStatus = async (token: string) => {
	return await apiFetch('/api/community_sharing', { token });
};

export const toggleCommunitySharingEnabledStatus = async (token: string) => {
	return await apiFetch('/api/community_sharing/toggle', { token });
};

export const getModelConfig = async (token: string): Promise<GlobalModelConfig> => {
	const res = await apiFetch<{ models: GlobalModelConfig }>('/api/config/models', { token });
	return res.models;
};

export interface ModelConfig {
	id: string;
	name: string;
	meta: ModelMeta;
	base_model_id?: string;
	params: ModelParams;
}

export interface ModelMeta {
	description?: string;
	capabilities?: object;
	profile_image_url?: string;
}

export interface ModelParams {}

export type GlobalModelConfig = ModelConfig[];

export const updateModelConfig = async (token: string, config: GlobalModelConfig) => {
	return await apiFetch('/api/config/models', {
		method: 'POST',
		body: JSON.stringify({ models: config }),
		token
	});
};
