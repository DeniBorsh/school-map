import {
	type ChangeEvent,
	type DragEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { parseExcelBuffer, readFileBytes } from "@/lib/excelParser";
import { resetCacheAndReload, takePendingUpload } from "@/lib/freshUpload";
import { setData } from "@/store/dataSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AdminDashboardPage() {
	const fileRef = useRef<HTMLInputElement>(null);
	const dispatch = useAppDispatch();
	const { loaded } = useAppSelector((s) => s.data);

	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadResult, setUploadResult] = useState<{
		ok: boolean;
		message: string;
	} | null>(null);

	function applyFile(bytes: Uint8Array) {
		try {
			const result = parseExcelBuffer(bytes);
			dispatch(setData(result));
			setUploadResult({
				ok: true,
				message: `Загружено: ${result.districts.length} районов, ${result.schools.length} школ`,
			});
		} catch {
			setUploadResult({
				ok: false,
				message: "Не удалось обработать файл. Проверьте формат (.xlsx)",
			});
		}
	}

	// Файл, загруженный до сброса кэша, разбираем уже свежей версией кода.
	useEffect(() => {
		const pending = takePendingUpload();
		if (pending) applyFile(pending);
	}, []);

	async function doUpload(file: File) {
		if (!file.name.toLowerCase().endsWith(".xlsx")) {
			setUploadResult({
				ok: false,
				message: "Только .xlsx файлы",
			});
			return;
		}

		setUploadResult(null);
		setUploading(true);

		try {
			const bytes = await readFileBytes(file);
			if (await resetCacheAndReload(bytes)) return;
			applyFile(bytes);
		} catch {
			setUploadResult({
				ok: false,
				message: "Не удалось обработать файл. Проверьте формат (.xlsx)",
			});
		} finally {
			setUploading(false);
		}

		if (fileRef.current) fileRef.current.value = "";
	}

	function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) doUpload(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		setDragging(true);
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) doUpload(file);
	}

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
			<div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<div className="mb-4 flex flex-wrap items-center gap-2">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
					>
						Главная
					</Link>
					<Link
						to="/map"
						className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:inline-flex"
					>
						Карта школ
					</Link>
					<ThemeToggle />
				</div>
				<h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
					Загрузка данных
				</h1>

				<section className="mt-6 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-8 sm:p-6">
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						Данные (Excel)
					</h2>

					<p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
						Статус:{" "}
						{loaded ? (
							<span className="font-medium text-green-600">
								данные загружены
							</span>
						) : (
							<span className="font-medium text-amber-600">
								данные отсутствуют
							</span>
						)}
					</p>

					<label
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition sm:p-8 ${
							dragging
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
								: "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
						}`}
					>
						<div className="text-3xl text-neutral-300 dark:text-neutral-600">
							{uploading ? (
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-600" />
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="32"
									height="32"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
							)}
						</div>
						<p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
							{uploading ? "Обработка..." : "Перетащите .xlsx сюда или нажмите"}
						</p>
						<p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
							Файл обрабатывается прямо в браузере — сервер не нужен
						</p>
						<input
							ref={fileRef}
							type="file"
							accept=".xlsx"
							onChange={handleFileInput}
							className="hidden"
							disabled={uploading}
						/>
					</label>

					{uploadResult && (
						<p
							className={`mt-4 text-sm font-medium ${uploadResult.ok ? "text-green-600" : "text-red-500"}`}
						>
							{uploadResult.message}
						</p>
					)}
				</section>

				<section className="mt-4 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-6 sm:p-6">
					<h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
						Инструкция по заполнению Excel
					</h2>

					<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
						Файл должен быть в формате <strong>.xlsx</strong>. Первая строка
						(или первая непустая) — заголовки столбцов; парсер ищет колонки по
						названию (регистр и пунктуация неважны), поэтому порядок может
						быть любым.
					</p>

					<div className="mt-5">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Обязательные колонки
						</h3>
						<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
							Распознаются по заголовку. Если колонка отсутствует — соответствующее
							поле школы будет пустым, но загрузка продолжится.
						</p>
						<div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
							<table className="w-full text-left text-xs">
								<thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
									<tr>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Колонка
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Тип
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Пример
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 text-neutral-700 dark:text-neutral-300">
									{[
										["Название школы", "Текст", "СОШ №1 г. Грозный"],
										["Сменность", "Число", "2"],
										["Мощность", "Число", "500"],
										["Количество обучающихся", "Число", "430"],
										["Количество работников", "Число", "60"],
										["Количество педработников", "Число", "35"],
										["Ссылка на сайт", "Текст/URL", "school1.edu"],
										["Широта", "Число", "43.3175"],
										["Долгота", "Число", "45.6940"],
										["Адрес", "Текст", "ул. Ленина, 1"],
										["Район", "Текст", "Грозный (город)"],
										[
											"Итоговый балл в мотивирующем мониторинге за 2024 г.",
											"Число (только для строк-районов)",
											"86.4",
										],
										[
											"Тип учреждения",
											"Текст",
											"Государственная школа",
										],
									].map(([name, type, example]) => (
										<tr key={name}>
											<td className="whitespace-nowrap px-3 py-1.5 font-medium">
												{name}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5 text-neutral-500 dark:text-neutral-400">
												{type}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5 text-neutral-400 dark:text-neutral-500">
												{example}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
							Также распознаются колонки-идентификаторы (
							<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
								ID
							</code>
							,{" "}
							<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
								Порядковый номер
							</code>
							) — они игнорируются.
						</p>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Произвольные колонки
						</h3>
						<p>
							Любая колонка, не входящая в обязательный список, добавляется на
							дашборд автоматически. Тип определяется по значениям:
						</p>
						<ul className="list-inside list-disc space-y-1.5 pl-1">
							<li>
								<strong>Процентная</strong> — колонка с Excel-форматом{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									0.0%
								</code>{" "}
								(или <code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">0%</code>),
								либо если хотя бы в одной ячейке встречается знак{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									%
								</code>
								. Диапазон значений неважен — могут быть и{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									0.85
								</code>
								, и{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									85
								</code>
								, и{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									"85%"
								</code>
								. Агрегируется как среднее по району, выводится в %.
							</li>
							<li>
								<strong>Булевая</strong> — заполняйте единообразно{" "}
								<strong>«Да» / «Нет»</strong>. Также распознаются{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									+/−
								</code>
								,{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									true/false
								</code>
								,{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
									0/1
								</code>
								. <strong>Пустая ячейка считается за «Нет»</strong> — это влияет
								на знаменатель агрегата. Агрегируется как доля «Да», выводится в
								%.
							</li>
							<li>
								<strong>Числовая</strong> — остальные числа. Агрегируется как
								сумма по району.
							</li>
						</ul>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Тип учреждения и фильтр на главной
						</h3>
						<p>
							Все уникальные значения колонки <strong>«Тип учреждения»</strong>{" "}
							превращаются в радио-кнопки на главной странице (плюс пункт{" "}
							<strong>«Все учреждения»</strong>). Выбор фильтрует таблицы и
							сводки; цветовая карта районов всегда показывает все школы.
						</p>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Строки-районы и правило подстановки
						</h3>
						<p>
							Строка считается <strong>школой</strong>, если у неё заполнен сайт
							либо обе координаты (широта и долгота). Иначе — если её название
							соответствует известному району — она считается{" "}
							<strong>строкой-районом</strong>. Прочие строки (
							<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
								ИТОГО по ЧР
							</code>
							,{" "}
							<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5">
								Государственные организации
							</code>
							) пропускаются.
						</p>
						<p>
							Значения из строк-районов используются{" "}
							<strong>только когда</strong> по школам этого района нет ни одного
							значения по данной колонке. Если хотя бы одна школа района
							содержит значение, агрегат строится по школам, а строка-район
							игнорируется.
						</p>
						<p>
							Цвет района берётся из заливки ячейки с колонкой{" "}
							<strong>
								«Итоговый балл в мотивирующем мониторинге»
							</strong>{" "}
							в строке-районе. Если заливки нет, используется базовый цвет
							района.
						</p>
					</div>
				</section>
			</div>
		</div>
	);
}
