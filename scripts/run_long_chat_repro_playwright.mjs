import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TOKEN = process.env.OPEN_WEBUI_TOKEN;

if (!TOKEN) {
  throw new Error('Missing OPEN_WEBUI_TOKEN environment variable.');
}

const chats = [
  {
    id: '1edbec79-2781-419a-a085-65f96e891d9b',
    title: '[2026-05-16]_claudeso_Secrets Documentation Suite Review'
  },
  {
    id: '18c1da1f-62d6-4c1b-8297-36e4415d26d3',
    title: '[2026-05-12]_gpt54_Enterprise Security Hardening'
  }
];

const results = [];

const nowMs = () => Date.now();

for (const chat of chats) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(
    ({ token, chatId }) => {
      localStorage.setItem('locale', 'en-US');
      localStorage.setItem('token', token);
      const oversizedPrompt = 'X'.repeat(25050);
      localStorage.setItem(
        `chat-input-${chatId}`,
        JSON.stringify({
          prompt: oversizedPrompt,
          files: [],
          selectedToolIds: ['dummy'],
          webSearchEnabled: true
        })
      );
    },
    { token: TOKEN, chatId: chat.id }
  );

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push({
      message: error?.message ?? String(error),
      stack: error?.stack ?? ''
    });
    console.error('pageerror:', error?.message ?? String(error));
    if (error?.stack) {
      console.error(error.stack);
    }
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
      console.error('console:error:', message.text());
    }
  });

  const chatResult = {
    chatId: chat.id,
    title: chat.title,
    checks: []
  };

  const record = (name, passed, details = '') => {
    chatResult.checks.push({ name, passed, details });
  };

  try {
    let remainingSaveFailures = 0;
    let completionCalls = 0;

    await page.route(`**/api/v1/chats/${chat.id}`, async (route) => {
      if (remainingSaveFailures > 0) {
        remainingSaveFailures -= 1;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'forced save failure' })
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/chat/completions', async (route) => {
      completionCalls += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced completion failure' })
      });
    });

    const loadStart = nowMs();
    await page.goto(`${BASE_URL}/c/${chat.id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (page.url().includes('/auth')) {
      record('chat opens without auth redirect', false, `redirected to ${page.url()}`);
      throw new Error('Auth redirect');
    }

    await page.waitForSelector('#chat-input', { state: 'visible', timeout: 30000 });
    const loadMs = nowMs() - loadStart;
    record('chat opens without long freeze', loadMs < 20000, `loadMs=${loadMs}`);

    const initialInputText = (await page.locator('#chat-input').innerText()).trim();
    const cachedDraftAfterRestore = await page.evaluate((chatId) => localStorage.getItem(`chat-input-${chatId}`), chat.id);
    record(
      'oversized cached draft is dropped on restore',
      initialInputText.length === 0 && cachedDraftAfterRestore === null,
      `inputLen=${initialInputText.length}, cachePresent=${cachedDraftAfterRestore !== null}`
    );

    await page.locator('#chat-input').click();
    await page.keyboard.type('   ');
    await page.mouse.click(5, 5);
    await page.waitForTimeout(300);
    const cacheAfterWhitespace = await page.evaluate((chatId) => localStorage.getItem(`chat-input-${chatId}`), chat.id);
    record('whitespace-only draft does not persist', cacheAfterWhitespace === null, `cachePresent=${cacheAfterWhitespace !== null}`);

    const userBefore = await page.locator('.chat-user').count();
    const assistantBefore = await page.locator('.chat-assistant').count();

    await page.locator('#chat-input').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('hold on');

    remainingSaveFailures = 2;

    await page.click('button[type="submit"]');

    const completionStart = nowMs();
    while (completionCalls < 1 && nowMs() - completionStart < 15000) {
      await page.waitForTimeout(100);
    }

    const userCountWaitStart = nowMs();
    let userAfter = userBefore;
    while (userAfter <= userBefore && nowMs() - userCountWaitStart < 15000) {
      userAfter = await page.locator('.chat-user').count();
      await page.waitForTimeout(150);
    }

    const assistantCountWaitStart = nowMs();
    let assistantAfter = assistantBefore;
    while (assistantAfter <= assistantBefore && nowMs() - assistantCountWaitStart < 15000) {
      assistantAfter = await page.locator('.chat-assistant').count();
      await page.waitForTimeout(150);
    }

    record(
      "submitting 'hold on' still queues response path after save failures",
      completionCalls > 0 && userAfter > userBefore && assistantAfter > assistantBefore,
      `completionCalls=${completionCalls}, userBefore=${userBefore}, userAfter=${userAfter}, assistantBefore=${assistantBefore}, assistantAfter=${assistantAfter}`
    );

    const warningVisible = await page
      .getByText(/could not save this chat right now/i)
      .isVisible()
      .catch(() => false);
    record('save failure warning toast appears', warningVisible, warningVisible ? 'visible' : 'not visible');

    const contextNoticeVisible = await page
      .getByText(/Long chat mode is active/i)
      .isVisible()
      .catch(() => false);
    record('context windowing notice appears on long chats', contextNoticeVisible, contextNoticeVisible ? 'visible' : 'not visible');

    await page.locator('#chat-input').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('still responsive');
    const responsiveText = await page.locator('#chat-input').innerText();
    record('chat input remains responsive after submit flow', /still responsive/i.test(responsiveText), `input='${responsiveText.trim()}'`);
  } catch (error) {
    record('test execution', false, error instanceof Error ? error.message : String(error));
    if (pageErrors.length > 0) {
      record('page errors', false, JSON.stringify(pageErrors.slice(0, 3)));
    }
    if (consoleErrors.length > 0) {
      record('console errors', false, consoleErrors.slice(0, 3).join(' | '));
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  results.push(chatResult);
}

const summary = results.map((r) => {
  const passed = r.checks.filter((c) => c.passed).length;
  const failed = r.checks.length - passed;
  return { chatId: r.chatId, title: r.title, passed, failed };
});

console.log(JSON.stringify({ summary, results }, null, 2));
