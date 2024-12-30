import { browser } from '$app/environment';

export const isBrowser = Boolean(browser);
export const alert = browser ? window.alert : console.error;
export const document = browser ? window.document : null;
export const window = browser ? window : null;
export const GL2 = browser ? WebGL2RenderingContext : null;
