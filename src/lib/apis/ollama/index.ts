import { apiFetch } from '$lib/apis/client';

export const verifyOllamaConnection = async (
	token: string = '',
	url: string = '',
	key: string = ''
) => {
	return await apiFetch('/ollama/verify', {
		method: 'POST',
		body: JSON.stringify({ url, key }),
		token
	});
};

export const getOllamaConfig = async (token: string = '') => {
	return await apiFetch('/ollama/config', { token });
};

type OllamaConfig = {
	ENABLE_OLLAMA_API: boolean;
	OLLAMA_BASE_URLS: string[];
	OLLAMA_API_CONFIGS: object;
};

export const updateOllamaConfig = async (token: string = '', config: OllamaConfig) => {
	return await apiFetch('/ollama/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const getOllamaUrls = async (token: string = '') => {
	const res = await apiFetch<{ OLLAMA_BASE_URLS: string[] }>('/ollama/urls', { token });
	return res.OLLAMA_BASE_URLS;
};

export const updateOllamaUrls = async (token: string = '', urls: string[]) => {
	const res = await apiFetch<{ OLLAMA_BASE_URLS: string[] }>('/ollama/urls/update', {
		method: 'POST',
		body: JSON.stringify({ urls }),
		token
	});
	return res.OLLAMA_BASE_URLS;
};

export const getOllamaVersion = async (token: string, urlIdx?: number) => {
	const res = await apiFetch<{ version: string }>(
		`/ollama/api/version${urlIdx ? `/${urlIdx}` : ''}`,
		{ token }
	);
	return res?.version ?? false;
};

export const getOllamaModels = async (token: string = '', urlIdx: null | number = null) => {
	const res = await apiFetch<{ models: any[] }>(
		`/ollama/api/tags${urlIdx !== null ? `/${urlIdx}` : ''}`,
		{ token }
	);
	return (res?.models ?? [])
		.map((model) => ({ id: model.model, name: model.name ?? model.model, ...model }))
		.sort((a, b) => a.name.localeCompare(b.name));
};

// The following functions return raw Response objects — the caller reads the SSE/NDJSON stream.

export const generatePrompt = async (token: string = '', model: string, conversation: string) => {
	if (conversation === '') conversation = '[no existing conversation]';
	return await apiFetch<Response>('/ollama/api/generate', {
		method: 'POST',
		body: JSON.stringify({
			model,
			prompt: `Conversation:
			${conversation}

			As USER in the conversation above, your task is to continue the conversation. Remember, Your responses should be crafted as if you're a human conversing in a natural, realistic manner, keeping in mind the context and flow of the dialogue. Please generate a fitting response to the last message in the conversation, or if there is no existing conversation, initiate one as a normal person would.

			Response:
			`
		}),
		token,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
};

export const generateEmbeddings = async (token: string = '', model: string, text: string) => {
	return await apiFetch<Response>('/ollama/api/embeddings', {
		method: 'POST',
		body: JSON.stringify({ model, prompt: text }),
		token,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
};

export const generateTextCompletion = async (token: string = '', model: string, text: string) => {
	return await apiFetch<Response>('/ollama/api/generate', {
		method: 'POST',
		body: JSON.stringify({ model, prompt: text, stream: true }),
		token,
		responseType: 'response'
	}).catch((err) => {
		console.error(err);
		return null;
	});
};

export const generateChatCompletion = async (token: string = '', body: object) => {
	const controller = new AbortController();
	const res = await apiFetch<Response>('/ollama/api/chat', {
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

export const createModel = async (
	token: string,
	tagName: string,
	content: string,
	urlIdx: string | null = null
) => {
	return await apiFetch<Response>(
		`/ollama/api/create${urlIdx !== null ? `/${urlIdx}` : ''}`,
		{
			method: 'POST',
			body: JSON.stringify({ name: tagName, modelfile: content }),
			token,
			responseType: 'response'
		}
	).catch((err) => {
		console.error(err);
		return null;
	});
};

export const deleteModel = async (token: string, tagName: string, urlIdx: string | null = null) => {
	await apiFetch(`/ollama/api/delete${urlIdx !== null ? `/${urlIdx}` : ''}`, {
		method: 'DELETE',
		body: JSON.stringify({ name: tagName }),
		token
	});
	return true;
};

export const pullModel = async (token: string, tagName: string, urlIdx: number | null = null) => {
	const controller = new AbortController();
	const res = await apiFetch<Response>(
		`/ollama/api/pull${urlIdx !== null ? `/${urlIdx}` : ''}`,
		{
			method: 'POST',
			body: JSON.stringify({ name: tagName }),
			token,
			signal: controller.signal,
			responseType: 'response'
		}
	).catch((err) => {
		console.error(err);
		return null;
	});
	return [res, controller];
};

export const downloadModel = async (
	token: string,
	download_url: string,
	urlIdx: string | null = null
) => {
	return await apiFetch<Response>(
		`/ollama/models/download${urlIdx !== null ? `/${urlIdx}` : ''}`,
		{
			method: 'POST',
			body: JSON.stringify({ url: download_url }),
			token,
			responseType: 'response'
		}
	).catch((err) => {
		console.error(err);
		return null;
	});
};

export const uploadModel = async (token: string, file: File, urlIdx: string | null = null) => {
	const formData = new FormData();
	formData.append('file', file);
	return await apiFetch<Response>(
		`/ollama/models/upload${urlIdx !== null ? `/${urlIdx}` : ''}`,
		{
			method: 'POST',
			body: formData,
			token,
			responseType: 'response'
		}
	).catch((err) => {
		console.error(err);
		return null;
	});
};
