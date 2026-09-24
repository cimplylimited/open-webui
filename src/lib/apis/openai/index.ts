import { WEBUI_BASE_URL } from '$lib/constants';
import { apiFetch } from '$lib/apis/client';

export const getOpenAIConfig = async (token: string = '') => {
	return await apiFetch('/openai/config', { token });
};

type OpenAIConfig = {
	ENABLE_OPENAI_API: boolean;
	OPENAI_API_BASE_URLS: string[];
	OPENAI_API_KEYS: string[];
	OPENAI_API_CONFIGS: object;
};

export const updateOpenAIConfig = async (token: string = '', config: OpenAIConfig) => {
	return await apiFetch('/openai/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const getOpenAIUrls = async (token: string = '') => {
	const res = await apiFetch<{ OPENAI_API_BASE_URLS: string[] }>('/openai/urls', { token });
	return res.OPENAI_API_BASE_URLS;
};

export const updateOpenAIUrls = async (token: string = '', urls: string[]) => {
	const res = await apiFetch<{ OPENAI_API_BASE_URLS: string[] }>('/openai/urls/update', {
		method: 'POST',
		body: JSON.stringify({ urls }),
		token
	});
	return res.OPENAI_API_BASE_URLS;
};

export const getOpenAIKeys = async (token: string = '') => {
	const res = await apiFetch<{ OPENAI_API_KEYS: string[] }>('/openai/keys', { token });
	return res.OPENAI_API_KEYS;
};

export const updateOpenAIKeys = async (token: string = '', keys: string[]) => {
	const res = await apiFetch<{ OPENAI_API_KEYS: string[] }>('/openai/keys/update', {
		method: 'POST',
		body: JSON.stringify({ keys }),
		token
	});
	return res.OPENAI_API_KEYS;
};

export const getOpenAIModels = async (token: string, urlIdx?: number) => {
	return await apiFetch(
		`/openai/models${typeof urlIdx === 'number' ? `/${urlIdx}` : ''}`,
		{ token }
	);
};

export const verifyOpenAIConnection = async (
	token: string = '',
	url: string = 'https://api.openai.com/v1',
	key: string = ''
) => {
	return await apiFetch('/openai/verify', {
		method: 'POST',
		body: JSON.stringify({ url, key }),
		token
	});
};

// Streaming — returns raw Response so the caller can read the SSE stream.
export const chatCompletion = async (
	token: string = '',
	body: object,
	url: string = `${WEBUI_BASE_URL}/api`
): Promise<[Response | null, AbortController]> => {
	const controller = new AbortController();
	const res = await apiFetch<Response>('/chat/completions', {
		base: url,
		method: 'POST',
		body: JSON.stringify(body),
		token,
		signal: controller.signal,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
	return [res, controller];
};

export const generateOpenAIChatCompletion = async (
	token: string = '',
	body: object,
	url: string = `${WEBUI_BASE_URL}/api`
) => {
	return await apiFetch('/chat/completions', {
		base: url,
		method: 'POST',
		body: JSON.stringify(body),
		token
	});
};

// Returns raw Response for audio blob streaming.
export const synthesizeOpenAISpeech = async (
	token: string = '',
	speaker: string = 'alloy',
	text: string = '',
	model: string = 'tts-1'
) => {
	return await apiFetch('/openai/audio/speech', {
		method: 'POST',
		body: JSON.stringify({ model, input: text, voice: speaker }),
		token,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
};
