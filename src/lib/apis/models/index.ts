import { apiFetch } from '$lib/apis/client';

export const getModels = async (token: string = '') => {
	return await apiFetch('/api/v1/models/', { token: token || null });
};

export const getBaseModels = async (token: string = '') => {
	return await apiFetch('/api/v1/models/base', { token: token || null });
};

export const createNewModel = async (token: string, model: object) => {
	return await apiFetch('/api/v1/models/create', {
		method: 'POST',
		body: JSON.stringify(model),
		token
	});
};

export const getModelById = async (token: string, id: string) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);
	return await apiFetch(`/api/v1/models/model?${searchParams.toString()}`, { token });
};

export const toggleModelById = async (token: string, id: string) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);
	return await apiFetch(`/api/v1/models/model/toggle?${searchParams.toString()}`, {
		method: 'POST',
		token
	});
};

export const updateModelById = async (token: string, id: string, model: object) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);
	return await apiFetch(`/api/v1/models/model/update?${searchParams.toString()}`, {
		method: 'POST',
		body: JSON.stringify(model),
		token
	});
};

export const deleteModelById = async (token: string, id: string) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);
	return await apiFetch(`/api/v1/models/model/delete?${searchParams.toString()}`, {
		method: 'DELETE',
		token
	});
};

export const deleteAllModels = async (token: string) => {
	return await apiFetch('/api/v1/models/delete/all', { method: 'DELETE', token });
};
