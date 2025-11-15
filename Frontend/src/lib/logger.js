const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production';

export const debug = (...args) => { if (!isProd) console.debug(...args); };
export const info = (...args) => { if (!isProd) console.info(...args); };
export const warn = (...args) => { console.warn(...args); };
export const error = (...args) => { console.error(...args); };

export default { debug, info, warn, error };
