import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { registerSW } from "virtual:pwa-register";

// Новый деплой: сервис-воркер скачивает свежую версию и перезагружает
// страницу сам (autoUpdate). Проверяем обновления при открытии,
// при возврате на вкладку и раз в 15 минут, а не только при перезагрузке.
registerSW({
	immediate: true,
	onRegisteredSW(_url, registration) {
		if (!registration) return;
		const check = () => {
			if (navigator.onLine) registration.update().catch(() => {});
		};
		setInterval(check, 15 * 60 * 1000);
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") check();
		});
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
