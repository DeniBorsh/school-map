// Загрузка Excel полностью сбрасывает кэш приложения: удаляются сохранённые
// данные, кэш сервис-воркера и сам сервис-воркер, страница перезагружается
// с сервера, и файл разбирается уже свежей версией кода. Сам файл на время
// перезагрузки лежит в sessionStorage.

const PENDING_KEY = "pending_upload_v1";
const DATA_KEYS = ["schools_data_cache_v3"];

function bytesToBase64(bytes: Uint8Array): string {
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) {
		bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

/**
 * Сбрасывает кэш и перезагружает страницу, сохранив файл до перезагрузки.
 * Возвращает false, если сброс невозможен (нет сети — без неё свежую версию
 * не скачать, а офлайн-копию терять нельзя): тогда файл разбирается сразу.
 */
export async function resetCacheAndReload(bytes: Uint8Array): Promise<boolean> {
	if (!navigator.onLine) return false;
	try {
		sessionStorage.setItem(PENDING_KEY, bytesToBase64(bytes));
	} catch {
		return false;
	}
	try {
		for (const key of DATA_KEYS) localStorage.removeItem(key);
		if ("serviceWorker" in navigator) {
			const regs = await navigator.serviceWorker.getRegistrations();
			await Promise.all(regs.map((r) => r.unregister()));
		}
		if ("caches" in window) {
			const keys = await caches.keys();
			await Promise.all(keys.map((k) => caches.delete(k)));
		}
	} catch {
		// Даже если часть кэша не удалилась, перезагрузка всё равно поможет.
	}
	window.location.reload();
	return true;
}

/** Файл, отложенный до перезагрузки; забирается один раз. */
export function takePendingUpload(): Uint8Array | null {
	try {
		const b64 = sessionStorage.getItem(PENDING_KEY);
		if (!b64) return null;
		sessionStorage.removeItem(PENDING_KEY);
		return base64ToBytes(b64);
	} catch {
		return null;
	}
}
