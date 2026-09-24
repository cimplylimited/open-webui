import { apiFetch } from '$lib/apis/client';

export const uploadFile = async (token: string, file: File, signal?: AbortSignal) => {
	const data = new FormData();
	data.append('file', file);
	return await apiFetch('/api/v1/files/', { method: 'POST', body: data, token, signal });
};

export const uploadDir = async (token: string) => {
	return await apiFetch('/api/v1/files/upload/dir', { method: 'POST', token });
};

export const getFiles = async (token: string = '') => {
	return await apiFetch('/api/v1/files/', { token: token || null });
};

export const getFileById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/files/${id}`, { token });
};

export const updateFileDataContentById = async (token: string, id: string, content: string) => {
	return await apiFetch(`/api/v1/files/${id}/data/content/update`, {
		method: 'POST',
		body: JSON.stringify({ content }),
		token
	});
};

export const getFileContentById = async (id: string) => {
	return await apiFetch(`/api/v1/files/${id}/content`, {
		responseType: 'blob',
		credentials: 'include',
		token: null
	});
};

export const deleteFileById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/files/${id}`, { method: 'DELETE', token });
};

export const deleteAllFiles = async (token: string) => {
	return await apiFetch('/api/v1/files/all', { method: 'DELETE', token });
};
