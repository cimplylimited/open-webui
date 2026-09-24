import { apiFetch } from '$lib/apis/client';

type PromptItem = {
	command: string;
	title: string;
	content: string;
	access_control?: null | object;
};

export const createNewPrompt = async (token: string, prompt: PromptItem) => {
	return await apiFetch('/api/v1/prompts/create', {
		method: 'POST',
		body: JSON.stringify({ ...prompt, command: `/${prompt.command}` }),
		token
	});
};

export const getPrompts = async (token: string = '') => {
	return await apiFetch('/api/v1/prompts/', { token: token || null });
};

export const getPromptList = async (token: string = '') => {
	return await apiFetch('/api/v1/prompts/list', { token: token || null });
};

export const getPromptByCommand = async (token: string, command: string) => {
	return await apiFetch(`/api/v1/prompts/command/${command}`, { token });
};

export const updatePromptByCommand = async (token: string, prompt: PromptItem) => {
	return await apiFetch(`/api/v1/prompts/command/${prompt.command}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...prompt, command: `/${prompt.command}` }),
		token
	});
};

export const deletePromptByCommand = async (token: string, command: string) => {
	command = command.charAt(0) === '/' ? command.slice(1) : command;
	return await apiFetch(`/api/v1/prompts/command/${command}/delete`, { method: 'DELETE', token });
};
