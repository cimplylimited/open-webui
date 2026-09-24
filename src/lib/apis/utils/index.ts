import { apiFetch } from '$lib/apis/client';

export const getGravatarUrl = async (email: string) => {
	return await apiFetch(`/api/v1/utils/gravatar?email=${email}`, { token: null }).catch(
		() => null
	);
};

export const formatPythonCode = async (code: string) => {
	return await apiFetch('/api/v1/utils/code/format', {
		method: 'POST',
		body: JSON.stringify({ code }),
		token: null
	});
};

export const downloadChatAsPDF = async (title: string, messages: object[]) => {
	return await apiFetch('/api/v1/utils/pdf', {
		method: 'POST',
		body: JSON.stringify({ title, messages }),
		token: null,
		responseType: 'blob'
	}).catch(() => null);
};

export const getHTMLFromMarkdown = async (md: string) => {
	const res = await apiFetch<{ html: string }>('/api/v1/utils/markdown', {
		method: 'POST',
		body: JSON.stringify({ md }),
		token: null
	});
	return res.html;
};

export const downloadDatabase = async (token: string) => {
	const blob = await apiFetch<Blob>('/api/v1/utils/db/download', {
		token,
		responseType: 'blob'
	});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'webui.db';
	document.body.appendChild(a);
	a.click();
	window.URL.revokeObjectURL(url);
};

export const downloadLiteLLMConfig = async (token: string) => {
	const blob = await apiFetch<Blob>('/api/v1/utils/litellm/config', {
		token,
		responseType: 'blob'
	});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'config.yaml';
	document.body.appendChild(a);
	a.click();
	window.URL.revokeObjectURL(url);
};
