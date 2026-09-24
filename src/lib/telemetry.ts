export type ErrorContext = {
	component?: string;
	requestType?: string;
	modelId?: string;
	status?: number;
	message?: string;
};

export type TimingRecord = {
	operation: string;
	durationMs: number;
	status?: number;
	timestamp: number;
};

const MAX_ENTRIES = 200;

class RingBuffer<T> {
	private buf: T[] = [];
	constructor(private readonly max: number) {}
	push(item: T): void {
		if (this.buf.length >= this.max) this.buf.shift();
		this.buf.push(item);
	}
	all(): readonly T[] {
		return this.buf;
	}
}

const recentErrors = new RingBuffer<ErrorContext>(MAX_ENTRIES);
const recentTimings = new RingBuffer<TimingRecord>(MAX_ENTRIES);

export function reportError(ctx: ErrorContext): void {
	recentErrors.push(ctx);
	if (import.meta.env.DEV) {
		console.error('[owui:error]', ctx);
	}
}

export function recordTiming(record: Omit<TimingRecord, 'timestamp'>): void {
	recentTimings.push({ ...record, timestamp: Date.now() });
}

export function getRecentErrors(): readonly ErrorContext[] {
	return recentErrors.all();
}

export function getRecentTimings(): readonly TimingRecord[] {
	return recentTimings.all();
}

export function p95(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
}

// DevTools handle — accessible as window.__owui in the browser console
if (typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>)['__owui'] = {
		errors: () => recentErrors.all(),
		timings: () => recentTimings.all(),
		p95: (operation?: string) => {
			const vals = recentTimings
				.all()
				.filter((t) => !operation || t.operation.includes(operation))
				.map((t) => t.durationMs);
			return p95(vals);
		}
	};
}
