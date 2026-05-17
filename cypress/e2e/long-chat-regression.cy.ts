// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

type ChatCase = {
	id: string;
	title: string;
};

const OWNER_TOKEN = Cypress.env('OPEN_WEBUI_TOKEN');

if (!OWNER_TOKEN || typeof OWNER_TOKEN !== 'string') {
	throw new Error('Missing OPEN_WEBUI_TOKEN in Cypress env.');
}

const CHAT_CASES: ChatCase[] = [
	{
		id: '1edbec79-2781-419a-a085-65f96e891d9b',
		title: '[2026-05-16]_claudeso_Secrets Documentation Suite Review'
	},
	{
		id: '18c1da1f-62d6-4c1b-8297-36e4415d26d3',
		title: '[2026-05-12]_gpt54_Enterprise Security Hardening'
	}
];

const seedOversizedDraft = (win: Window, chatId: string) => {
	const oversizedPrompt = 'X'.repeat(25050);
	win.localStorage.setItem(
		`chat-input-${chatId}`,
		JSON.stringify({
			prompt: oversizedPrompt,
			files: [],
			selectedToolIds: ['dummy'],
			webSearchEnabled: true
		})
	);
};

const openChatWithToken = (chatId: string) => {
	cy.visit(`/c/${chatId}`, {
		onBeforeLoad: (win) => {
			win.localStorage.setItem('locale', 'en-US');
			win.localStorage.setItem('token', OWNER_TOKEN);
			seedOversizedDraft(win, chatId);
		}
	});
};

describe('Long Chat Regression', () => {
	after(() => {
		// eslint-disable-next-line cypress/no-unnecessary-waiting
		cy.wait(1000);
	});

	CHAT_CASES.forEach((chatCase) => {
		it(`stays responsive for ${chatCase.title}`, () => {
			const loadStart = Date.now();
			openChatWithToken(chatCase.id);

			cy.get('#chat-input', { timeout: 20000 }).should('be.visible');
			cy.then(() => {
				const loadMs = Date.now() - loadStart;
				cy.log(`load_ms=${loadMs}`);
				expect(loadMs).to.be.lessThan(20000);
			});

			cy.get('#chat-input').invoke('text').then((text) => {
				expect(text.trim()).to.eq('');
			});

			cy.window().then((win) => {
				expect(win.localStorage.getItem(`chat-input-${chatCase.id}`)).to.eq(null);
			});

			cy.get('#chat-input').click({ force: true }).type('   ', { force: true });
			cy.get('body').click(0, 0, { force: true });
			cy.window().then((win) => {
				expect(win.localStorage.getItem(`chat-input-${chatCase.id}`)).to.eq(null);
			});

			let remainingSaveFailures = 0;
			cy.intercept('POST', `**/api/v1/chats/${chatCase.id}`, (req) => {
				if (remainingSaveFailures > 0) {
					remainingSaveFailures -= 1;
					req.reply({ statusCode: 500, body: { detail: 'forced save failure' } });
					return;
				}
				req.continue();
			}).as('chatSave');

			cy.intercept('POST', '**/api/chat/completions', (req) => {
				req.reply({ statusCode: 500, body: { detail: 'forced completion failure' } });
			}).as('completion');

			let userBefore = 0;
			let assistantBefore = 0;
			cy.get('.chat-user').then(($els) => {
				userBefore = $els.length;
			});
			cy.get('.chat-assistant').then(($els) => {
				assistantBefore = $els.length;
			});

			cy.then(() => {
				remainingSaveFailures = 2;
			});

			cy.get('#chat-input').click({ force: true }).type('hold on', { force: true });
			cy.get('button[type="submit"]').click({ force: true });

			cy.wait('@completion', { timeout: 20000 });

			cy.get('.chat-user', { timeout: 12000 }).should(($els) => {
				expect($els.length).to.be.greaterThan(userBefore);
			});
			cy.get('.chat-assistant', { timeout: 12000 }).should(($els) => {
				expect($els.length).to.be.greaterThan(assistantBefore);
			});

			cy.contains('could not save this chat right now', {
				matchCase: false,
				timeout: 12000
			}).should('exist');

			cy.contains('Long chat mode is active', {
				matchCase: false,
				timeout: 12000
			}).should('exist');

			cy.get('#chat-input').click({ force: true }).type('still responsive', { force: true });
			cy.get('#chat-input').invoke('text').should('contain', 'still responsive');
		});
	});
});
