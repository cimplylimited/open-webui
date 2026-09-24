import { apiFetch } from '$lib/apis/client';

export const getMemories = async (token: string) => {
	return await apiFetch('/api/v1/memories/', { token });
};

export const addNewMemory = async (token: string, content: string) => {
	return await apiFetch('/api/v1/memories/add', {
		method: 'POST',
		body: JSON.stringify({ content }),
		token
	});
};

export const updateMemoryById = async (token: string, id: string, content: string) => {
	return await apiFetch(`/api/v1/memories/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({ content }),
		token
	});
};

export const queryMemory = async (token: string, content: string) => {
	return await apiFetch('/api/v1/memories/query', {
		method: 'POST',
		body: JSON.stringify({ content }),
		token
	});
};

export const deleteMemoryById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/memories/${id}`, { method: 'DELETE', token });
};

export const deleteMemoriesByUserId = async (token: string) => {
	return await apiFetch('/api/v1/memories/delete/user', { method: 'DELETE', token });
};
