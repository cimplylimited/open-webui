import { apiFetch } from '$lib/apis/client';

export const createNewGroup = async (token: string, group: object) => {
	return await apiFetch('/api/v1/groups/create', {
		method: 'POST',
		body: JSON.stringify({ ...group }),
		token
	});
};

export const getGroups = async (token: string = '') => {
	return await apiFetch('/api/v1/groups/', { token: token || null });
};

export const getGroupById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/groups/id/${id}`, { token });
};

export const updateGroupById = async (token: string, id: string, group: object) => {
	return await apiFetch(`/api/v1/groups/id/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...group }),
		token
	});
};

export const deleteGroupById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/groups/id/${id}/delete`, { method: 'DELETE', token });
};
