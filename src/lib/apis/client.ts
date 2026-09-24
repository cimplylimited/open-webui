import { getToken } from '$lib/auth';
import { recordTiming, reportError } from '$lib/telemetry';

export class ApiError extends Error {
	constructor(
		public status: number,
		public detail: string
	) {
		super(detail);
		this.name = 'ApiError';
	}
}

export function normalizeErrorMessage(err: unknown): string {
	if (!(err instanceof ApiError)) return 'Something went wrong, try again';
	if (err.status === 401) return 'Session expired, please sign in again';
	if (err.status === 413) return 'Request too large';
	if (err.status === 429) return 'Too many requests, slowing down';
	if (err.status >= 500) return 'Something went wrong, try again';
	return err.detail || 'Something went wrong, try again';
}

type ResponseType = 'json' | 'blob' | 'text' | 'response';

interface ApiFetchOptions extends RequestInit {
	responseType?: ResponseType;
	/** Explicit token override. Pass `null` for unauthenticated endpoints. Omit to read from getToken(). */
	token?: string | null;
	/** Full base URL prefix. Defaults to '' (relative path — nginx handles routing). */
	base?: string;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
	const { responseType = 'json', token: tokenOverride, base = '', ...init } = options;

	const token = tokenOverride !== undefined ? tokenOverride : getToken();

	const headers = new Headers(init.headers);
	if (token) headers.set('Authorization', `Bearer ${token}`);
	// Skip Content-Type for FormData — browser sets it with the correct boundary
	if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const start = performance.now();
	let res: Response;
	try {
		res = await fetch(`${base}${path}`, { ...init, headers });
	} catch (err) {
		recordTiming({ operation: path, durationMs: performance.now() - start });
		reportError({ requestType: path, message: 'network error' });
		throw err;
	}

	const fetchDurationMs = performance.now() - start;
	recordTiming({ operation: path, durationMs: fetchDurationMs, status: res.status });
	if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug-chat-load") && path.includes("/api/v1/chats/")) {
		console.info("[chat-load-timing] network-fetch", { path, durationMs: fetchDurationMs, status: res.status });
	}

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		let parsed: { detail?: string } = {};
		try {
			parsed = JSON.parse(text);
		} catch {
			// nginx error pages and other non-JSON bodies are expected
		}
		const detail = parsed.detail ?? `HTTP ${res.status}`;
		reportError({ requestType: path, status: res.status, message: detail });
		throw new ApiError(res.status, detail);
	}

	if (responseType === 'json') {
		const parseStart = performance.now();
		const parsed = await res.json();
		if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug-chat-load')) {
			console.info('[chat-load-timing] json-parse', { path, durationMs: performance.now() - parseStart });
		}
		return parsed as T;
	}
	if (responseType === 'blob') return res.blob() as unknown as T;
	if (responseType === 'text') return res.text() as unknown as T;
	return res as unknown as T;
}
