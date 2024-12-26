import { browser } from '$app/environment';

export const alert = browser ? window.alert : console.error;
export const document = browser ? window.document : null;
