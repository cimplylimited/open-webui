import { apiFetch } from '$lib/apis/client';

export const createNewTool = async (token: string, tool: object) => {
	return await apiFetch('/api/v1/tools/create', {
		method: 'POST',
		body: JSON.stringify({ ...tool }),
		token
	});
};

export const getTools = async (token: string = '') => {
	return await apiFetch('/api/v1/tools/', { token: token || null });
};

export const getToolList = async (token: string = '') => {
	return await apiFetch('/api/v1/tools/list', { token: token || null });
};

export const exportTools = async (token: string = '') => {
	return await apiFetch('/api/v1/tools/export', { token: token || null });
};

export const getToolById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}`, { token });
};

export const updateToolById = async (token: string, id: string, tool: object) => {
	return await apiFetch(`/api/v1/tools/id/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...tool }),
		token
	});
};

export const deleteToolById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}/delete`, { method: 'DELETE', token });
};

export const getToolValvesById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves`, { token });
};

export const getToolValvesSpecById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves/spec`, { token });
};

export const updateToolValvesById = async (token: string, id: string, valves: object) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves/update`, {
		method: 'POST',
		body: JSON.stringify({ ...valves }),
		token
	});
};

export const getUserValvesById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves/user`, { token });
};

export const getUserValvesSpecById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves/user/spec`, { token });
};

export const updateUserValvesById = async (token: string, id: string, valves: object) => {
	return await apiFetch(`/api/v1/tools/id/${id}/valves/user/update`, {
		method: 'POST',
		body: JSON.stringify({ ...valves }),
		token
	});
};
