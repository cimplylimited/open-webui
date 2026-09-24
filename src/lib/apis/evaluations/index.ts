import { apiFetch } from '$lib/apis/client';

export const getConfig = async (token: string = '') => {
	return await apiFetch('/api/v1/evaluations/config', { token: token || null });
};

export const updateConfig = async (token: string, config: object) => {
	return await apiFetch('/api/v1/evaluations/config', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const getAllFeedbacks = async (token: string = '') => {
	return await apiFetch('/api/v1/evaluations/feedbacks/all', { token: token || null });
};

export const exportAllFeedbacks = async (token: string = '') => {
	return await apiFetch('/api/v1/evaluations/feedbacks/all/export', { token: token || null });
};

export const createNewFeedback = async (token: string, feedback: object) => {
	return await apiFetch('/api/v1/evaluations/feedback', {
		method: 'POST',
		body: JSON.stringify({ ...feedback }),
		token
	});
};

export const getFeedbackById = async (token: string, feedbackId: string) => {
	return await apiFetch(`/api/v1/evaluations/feedback/${feedbackId}`, { token });
};

export const updateFeedbackById = async (token: string, feedbackId: string, feedback: object) => {
	return await apiFetch(`/api/v1/evaluations/feedback/${feedbackId}`, {
		method: 'POST',
		body: JSON.stringify({ ...feedback }),
		token
	});
};

export const deleteFeedbackById = async (token: string, feedbackId: string) => {
	return await apiFetch(`/api/v1/evaluations/feedback/${feedbackId}`, { method: 'DELETE', token });
};
