export type DraftSnapshot = {
	promptText: string;
	attachments: unknown[];
	toolIds: string[];
	snapshotId: number;
	updatedAt: number;
};

export class DraftController {
	private key: string;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private lastSnapshotId = -1;

	constructor(draftKey = 'default') {
		this.key = `draft_${draftKey}`;
	}

	load(): DraftSnapshot | null {
		try {
			const raw = localStorage.getItem(this.key);
			if (!raw) return null;
			return JSON.parse(raw) as DraftSnapshot;
		} catch {
			return null;
		}
	}

	/** Debounced write — coalesces rapid changes into one write per 500ms window. */
	save(snapshot: DraftSnapshot): void {
		if (snapshot.snapshotId <= this.lastSnapshotId) return;
		this.lastSnapshotId = snapshot.snapshotId;
		if (this.timer !== null) clearTimeout(this.timer);
		this.timer = setTimeout(() => this._write(snapshot), 500);
	}

	/** Cancel pending debounce and write immediately. Call on submit intent, navigation, beforeunload. */
	flush(snapshot: DraftSnapshot): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (snapshot.snapshotId > this.lastSnapshotId) {
			this.lastSnapshotId = snapshot.snapshotId;
		}
		this._write(snapshot);
	}

	/** Clear persisted draft. Call only on confirmed submit success. */
	clear(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		try {
			localStorage.removeItem(this.key);
		} catch {
			// localStorage unavailable
		}
	}

	destroy(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	private _write(snapshot: DraftSnapshot): void {
		try {
			localStorage.setItem(this.key, JSON.stringify(snapshot));
		} catch {
			// localStorage full or unavailable
		}
	}
}
