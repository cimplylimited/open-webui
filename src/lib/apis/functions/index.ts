import { apiFetch } from '$lib/apis/client';

export const createNewFunction = async (token: string, func: object) => {
	return await apiFetch('/api/v1/functions/create', {
		method: 'POST',
		body: JSON.stringify({ ...func }),
		token
	});
};

export const getFunctions = async (token: string = '') => {
	return await apiFetch('/api/v1/functions/', { token: token || null });
};

export const exportFunctions = async (token: string = '') => {
	return await apiFetch('/api/v1/functions/export', { token: token || null });
};

export const getFunctionById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}`, { token });
};

export const updateFunctionById = async (token: string, id: string, func: object) => {
	return await apiFetch(`/api/v1/functions/id/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...func }),
		token
	});
};

export const deleteFunctionById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/delete`, { method: 'DELETE', token });
};

export const toggleFunctionById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/toggle`, { method: 'POST', token });
};

export const toggleGlobalById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/toggle/global`, { method: 'POST', token });
};

export const getFunctionValvesById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves`, { token });
};

export const getFunctionValvesSpecById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves/spec`, { token });
};

export const updateFunctionValvesById = async (token: string, id: string, valves: object) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves/update`, {
		method: 'POST',
		body: JSON.stringify({ ...valves }),
		token
	});
};

export const getUserValvesById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves/user`, { token });
};

export const getUserValvesSpecById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves/user/spec`, { token });
};

export const updateUserValvesById = async (token: string, id: string, valves: object) => {
	return await apiFetch(`/api/v1/functions/id/${id}/valves/user/update`, {
		method: 'POST',
		body: JSON.stringify({ ...valves }),
		token
	});
};
