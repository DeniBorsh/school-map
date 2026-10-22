import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
	useDashboardData,
	type DashboardTotals,
	type DistrictRow,
} from "@/lib/useDashboardData";
import type { District, ExtraColumn, School } from "@/types";
import {
	fmt,
	fmtAggregatedExtra,
	fmtDecimal,
	fmtExtraValue,
	schoolWord,
	siteUrl,
} from "@/lib/format";
import { getMonitoringColor } from "@/data/districts";
import { SortArrow } from "@/components/ui/SortArrow";
import { FillBar } from "@/components/ui/FillBar";
import { BigStat } from "@/components/ui/BigStat";
import { TabBtn } from "@/components/ui/TabBtn";
import { SchoolTable } from "@/components/dashboard/SchoolTable";
import { ChechenGrid } from "@/components/dashboard/ChechenGrid";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAppSelector } from "@/store/hooks";

function StaleDataBanner() {
	const stale = useAppSelector((s) => s.data.stale);
	if (!stale) return null;
	return (
		<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
			<span>
				Приложение обновилось. Загрузите Excel-файл заново, чтобы
				показатели пересчитались.
			</span>
			<Link
				to="/admin"
				className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600"
			>
				Загрузить
			</Link>
		</div>
	);
}

function InfoItem({
	label,
	value,
}: {
	label: string;
	value: string | number | null;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700">
			<p className="wrap-break-word text-center text-sm font-semibold text-neutral-800 dark:text-neutral-200">
				{value ?? "—"}
			</p>
			<p className="mt-1 text-center text-[11px] font-medium leading-tight text-neutral-400 dark:text-neutral-500">
				{label}
			</p>
		</div>
	);
}

function monitoringTitle(score: number | null): string {
	if (score == null) return "Балл мониторинга не указан";
	return `Балл мониторинга: ${fmtDecimal(score)}`;
}

function InstitutionTypeFilter({
	institutionTypes,
	value,
	onToggle,
}: {
	institutionTypes: string[];
	value: string[];
	onToggle: (v: string | null) => void;
}) {
	if (institutionTypes.length === 0) return null;
	const allActive = value.length === 0;
	const chipClass = (active: boolean) =>
		`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
			active
				? "bg-blue-600 text-white shadow-sm"
				: "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
		}`;
	return (
		<div className="flex flex-wrap gap-2">
			<button onClick={() => onToggle(null)} className={chipClass(allActive)}>
				Все учреждения
			</button>
			{institutionTypes.map((t) => {
				const active = value.includes(t);
				return (
					<button
						key={t}
						onClick={() => onToggle(t)}
						className={`inline-flex items-center gap-1.5 ${chipClass(active)}`}
					>
						<span
							className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
								active
									? "border-white bg-white text-blue-600"
									: "border-neutral-300 dark:border-neutral-600"
							}`}
						>
							{active && (
								<svg
									className="h-3 w-3"
									fill="none"
									stroke="currentColor"
									strokeWidth={4}
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							)}
						</span>
						{t}
					</button>
				);
			})}
		</div>
	);
}

function DistrictSummaryPanel({
	selected,
	extraColumns,
}: {
	selected: DistrictRow;
	extraColumns: ExtraColumn[];
}) {
	const score = selected.district.monitoring_score;
	return (
		<>
			<h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
				{selected.shortName}
			</h3>
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2">
				{score != null && (
					<BigStat
						label="Балл мониторинга"
						value={fmtDecimal(score)}
						accent={getMonitoringColor(selected.district)}
					/>
				)}
				<BigStat
					label="Заполненность"
					value={`${selected.fillRate.toFixed(1)}%`}
					accent={selected.fillRate > 100 ? "#ef4444" : "#10b981"}
				/>
				<BigStat
					label="Кол-во обучающихся"
					value={selected.totalStudents.toLocaleString("ru")}
					accent="#3b82f6"
				/>
				<BigStat
					label="Мощность"
					value={selected.totalCapacity.toLocaleString("ru")}
					accent="#8b5cf6"
				/>
				<BigStat
					label="Кол-во учреждений"
					value={String(selected.schoolCount)}
					accent="#10b981"
				/>
				<BigStat
					label="Потребность"
					value={selected.demand.toLocaleString("ru")}
					accent={selected.demand > 0 ? "#ef4444" : "#10b981"}
				/>
				<BigStat
					label="Кол-во педагогов"
					value={selected.totalTeachers.toLocaleString("ru")}
					accent="#f59e0b"
				/>
				<BigStat
					label="Кол-во работников"
					value={selected.totalWorkers.toLocaleString("ru")}
					accent="#3b82f6"
				/>
				{extraColumns.map((col) => (
					<BigStat
						key={col.key}
						label={col.label}
						value={fmtAggregatedExtra(selected.extras[col.key], col.type)}
						accent="#64748b"
					/>
				))}
			</div>
			<div className="mt-2 hidden md:block">
				<Link
					to={`/map?district=${selected.district.id}`}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.97]"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					Показать на карте
				</Link>
			</div>
		</>
	);
}

function SchoolDetailPanel({
	school,
	district,
	extraColumns,
	onBack,
}: {
	school: School;
	district: District;
	extraColumns: ExtraColumn[];
	onBack: () => void;
}) {
	const url = siteUrl(school.site);
	const coords = school.coords
		? `${school.coords[0].toFixed(6)}, ${school.coords[1].toFixed(6)}`
		: null;

	return (
		<>
			<button
				onClick={onBack}
				className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900 active:scale-95"
			>
				<svg
					className="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Сводка района
			</button>
			<div>
				<p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
					{district.name}
				</p>
				<h3 className="mt-1 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
					{school.name}
				</h3>
				{school.institution_type && (
					<p className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
						{school.institution_type}
					</p>
				)}
			</div>
			<div className="grid grid-cols-3 gap-2">
				<InfoItem label="Мощность" value={fmt(school.capacity)} />
				<InfoItem label="Кол-во обучающихся" value={fmt(school.students)} />
				<InfoItem label="Сменность" value={fmt(school.shift)} />
				<InfoItem label="Кол-во работников" value={fmt(school.workers)} />
				<InfoItem label="Педработников" value={fmt(school.teachers)} />
				<InfoItem label="Координаты" value={coords} />
				<div className="col-span-3">
					<InfoItem label="Адрес" value={school.address} />
				</div>
				{extraColumns.map((col) => (
					<InfoItem
						key={col.key}
						label={col.label}
						value={fmtExtraValue(school.extras?.[col.key] ?? null, col.type)}
					/>
				))}
				{school.coords && district.id != null && (
					<Link
						to={`/map?district=${district.id}&school=${encodeURIComponent(school.name)}`}
						className="col-span-3 hidden items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.97] md:flex"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
							/>
						</svg>
						Показать на карте
					</Link>
				)}
				{url && (
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="col-span-3 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.97]"
					>
						Открыть сайт школы
					</a>
				)}
			</div>
		</>
	);
}

function RepublicTotalsGrid({
	totals,
	extraColumns,
}: {
	totals: DashboardTotals;
	extraColumns: ExtraColumn[];
}) {
	return (
		<div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 lg:grid-cols-3">
			<BigStat
				label="Заполненность школ"
				value={`${totals.fillRate.toFixed(1)}%`}
				accent={totals.fillRate > 100 ? "#ef4444" : "#10b981"}
			/>
			<BigStat
				label="Кол-во обучающихся"
				value={totals.students.toLocaleString("ru")}
				accent="#f59e0b"
			/>
			<BigStat
				label="Мест в школах"
				value={totals.capacity.toLocaleString("ru")}
				accent="#3b82f6"
			/>
			<BigStat
				label="Потребность"
				value={totals.demand.toLocaleString("ru")}
				accent={totals.demand > 0 ? "#ef4444" : "#10b981"}
			/>
			<BigStat
				label="Кол-во учреждений"
				value={totals.schools.toLocaleString("ru")}
				accent="#10b981"
			/>
			<BigStat
				label="Районов"
				value={totals.districts.toLocaleString("ru")}
				accent="#8b5cf6"
			/>
			<BigStat
				label="Кол-во педагогов"
				value={totals.teachers.toLocaleString("ru")}
				accent="#f59e0b"
			/>
			<BigStat
				label="Кол-во работников"
				value={totals.workers.toLocaleString("ru")}
				accent="#3b82f6"
			/>
			{extraColumns.map((col) => (
				<BigStat
					key={col.key}
					label={col.label}
					value={fmtAggregatedExtra(totals.extras[col.key], col.type)}
					accent="#64748b"
				/>
			))}
		</div>
	);
}

export function DashboardPage() {
	const {
		noData,
		rows,
		sorted,
		totals,
		selected,
		sortedSchools,
		setSelectedId,
		districtQuery,
		setDistrictQuery,
		schoolQuery,
		setSchoolQuery,
		districtSort,
		toggleDistrictSort,
		schoolSort,
		toggleSchoolSort,
		institutionTypeFilter,
		toggleInstitutionType,
		institutionTypes,
		extraColumns,
	} = useDashboardData();
	const [expanded, setExpanded] = useState(false);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);
	const [tab, setTab] = useState<"districts" | "republic">("districts");
	const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
	const [schoolTableExpanded, setSchoolTableExpanded] = useState(false);
	const detailPanelRef = useRef<HTMLDivElement>(null);

	const handleSelectSchool = (school: School) => {
		setSelectedSchool(school);
		setSchoolTableExpanded(false);
		// На планшете панель с деталями находится под таблицей — показываем её.
		if (
			window.matchMedia("(min-width: 768px) and (max-width: 1023.98px)")
				.matches
		) {
			requestAnimationFrame(() =>
				detailPanelRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				}),
			);
		}
	};

	useEffect(() => {
		setSelectedSchool(null);
		// На телефоне/планшете страница прокручивается целиком: без этого район,
		// выбранный из плиток внизу, открывался прокрученным вниз.
		window.scrollTo({ top: 0 });
	}, [selected?.district.id]);

	if (noData) {
		return (
			<div className="h-app flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-900 px-4 text-center">
				<svg
					className="h-16 w-16 text-neutral-300 dark:text-neutral-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
					Данные не загружены
				</h2>
				<p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
					Загрузите Excel-файл с данными школ, чтобы начать работу.
				</p>
				<Link
					to="/admin"
					className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
				>
					Загрузить данные
				</Link>
			</div>
		);
	}

	if (selected) {
		return (
			<div className="lg-h-app flex flex-col bg-neutral-50 dark:bg-neutral-900">
				<div className="mx-auto flex min-h-0 w-full max-w-screen-sm flex-1 flex-col md:max-w-none lg:mx-0 lg:flex-row">
					<div className="flex min-w-0 flex-col p-4 lg:min-h-0 lg:flex-1 lg:p-6">
						<div className="mb-4 flex flex-col gap-3">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
								<button
									onClick={() => setSelectedId(null)}
									className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900 active:scale-95"
								>
									<svg
										className="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 19l-7-7 7-7"
										/>
									</svg>
									<span className="hidden sm:inline">Все районы</span>
									<span className="sm:hidden">Назад</span>
								</button>
								<div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
								<h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
									{selected.shortName}
								</h2>
								<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
									<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
									{institutionTypeFilter.length > 0
										? institutionTypeFilter.join(", ")
										: "Все учреждения"}
								</span>
							</div>
							{institutionTypes.length > 0 && (
								<InstitutionTypeFilter
									institutionTypes={institutionTypes}
									value={institutionTypeFilter}
									onToggle={toggleInstitutionType}
								/>
							)}
						</div>

						<div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl md:h-[70vh] border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 lg:h-auto lg:min-h-0 lg:flex-1">
							<div className="flex shrink-0 flex-col gap-2 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
								<div className="flex items-center gap-3">
									<button
										onClick={() => setSelectedId(null)}
										title="Все районы"
										className="-ml-1 inline-flex cursor-pointer items-center justify-center rounded-lg p-1 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900 active:scale-95"
									>
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
									</button>
									<h3 className="whitespace-nowrap text-sm font-semibold text-neutral-700 dark:text-neutral-300">
										Показатели по школам
									</h3>
									<input
										type="text"
										value={schoolQuery}
										onChange={(e) => setSchoolQuery(e.target.value)}
										placeholder="Поиск школы..."
										className="min-w-0 w-36 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1 text-xs text-neutral-800 dark:text-neutral-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 dark:focus:ring-blue-500/30 sm:w-44"
									/>
								</div>
								<div className="flex items-center gap-3">
									<span className="whitespace-nowrap text-xs text-neutral-400 dark:text-neutral-500">
										{sortedSchools.length} {schoolWord(sortedSchools.length)}
									</span>
									<button
										onClick={() => setSchoolTableExpanded((e) => !e)}
										className="hidden cursor-pointer items-center gap-2 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-[#264d73] active:scale-95 lg:inline-flex"
										title={
											schoolTableExpanded
												? "Свернуть таблицу"
												: "Развернуть таблицу на всю ширину"
										}
									>
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											{schoolTableExpanded ? (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4"
												/>
											) : (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
												/>
											)}
										</svg>
										{schoolTableExpanded ? "Свернуть" : "Развернуть"}
									</button>
								</div>
							</div>
							<div className="flex-1 overflow-auto table-scroll">
								<SchoolTable
									schools={sortedSchools}
									extraColumns={extraColumns}
									sort={schoolSort}
									onToggleSort={toggleSchoolSort}
									selectedSchoolName={selectedSchool?.name ?? null}
									onSelectSchool={handleSelectSchool}
								/>
							</div>
						</div>
					</div>

					<div
						ref={detailPanelRef}
						className={`flex w-full shrink-0 scroll-mt-4 flex-col gap-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 md:p-6 lg:h-full lg:w-96 lg:overflow-y-auto lg:border-l lg:border-t-0 ${schoolTableExpanded ? "lg:hidden" : ""}`}
					>
						{selectedSchool ? (
							<SchoolDetailPanel
								school={selectedSchool}
								district={selected.district}
								extraColumns={extraColumns}
								onBack={() => setSelectedSchool(null)}
							/>
						) : (
							<DistrictSummaryPanel
								selected={selected}
								extraColumns={extraColumns}
							/>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="lg-h-app flex flex-col bg-neutral-50 dark:bg-neutral-900">
			<div className="mx-auto flex w-full max-w-screen-sm items-center gap-2 px-4 pt-4 md:max-w-none lg:hidden">
				<Link
					to="/map"
					className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 md:inline-flex"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					Карта
				</Link>
				<Link
					to="/admin"
					className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Админ-панель
				</Link>
				<button
					onClick={() => window.location.reload()}
					className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:text-sm"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h5M20 20v-5h-5M5 13a7 7 0 0112.9-3.7M19 11a7 7 0 01-12.9 3.7"
						/>
					</svg>
				</button>
				<ThemeToggle />
			</div>
			<div className="mx-auto flex min-w-0 w-full max-w-screen-sm flex-1 flex-col md:max-w-none lg:mx-0 lg:min-h-0 lg:flex-row lg:overflow-hidden">
				<div
					className={`flex min-w-0 flex-col p-4 lg:min-h-0 lg:p-6 ${expanded ? "lg:flex-1" : "lg:flex-1 lg:w-1/2 xl:w-[62%] lg:shrink-0"}`}
				>
					<StaleDataBanner />
					<div className="mb-3">
						<InstitutionTypeFilter
							institutionTypes={institutionTypes}
							value={institutionTypeFilter}
							onToggle={toggleInstitutionType}
						/>
					</div>
					<div className="flex h-[70vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 lg:h-auto lg:min-h-0 lg:flex-1">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 px-4 py-2.5 sm:px-5">
							<div className="flex items-center gap-2 sm:gap-3">
								<h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
									Рейтинг районов
								</h2>
								<input
									type="text"
									value={districtQuery}
									onChange={(e) => setDistrictQuery(e.target.value)}
									placeholder="Поиск района..."
									className="w-32 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1 text-xs text-neutral-800 dark:text-neutral-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 dark:focus:ring-blue-500/30 sm:w-40"
								/>
							</div>
							<button
								onClick={() => setExpanded((e) => !e)}
								className="hidden cursor-pointer items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#264d73] active:scale-95 md:inline-flex"
								title={expanded ? "Свернуть таблицу" : "Развернуть таблицу"}
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{expanded ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
										/>
									)}
								</svg>
								{expanded ? "Свернуть" : "Развернуть"}
							</button>
						</div>
						<div className="flex-1 overflow-auto table-scroll md:hidden">
							<div className="divide-y divide-neutral-100 dark:divide-neutral-700">
								{sorted.map((r, i) => {
									const monitoringColor = getMonitoringColor(r.district);
									const isOpen = expandedCard === r.district.id;
									const previewExtras = extraColumns.slice(0, 1);
									return (
										<div
											key={`${r.district.id}-${r.district.name}`}
											className={
												i % 2 === 0
													? "bg-white dark:bg-neutral-800"
													: "bg-neutral-50/50 dark:bg-neutral-800/50"
											}
										>
											<button
												onClick={() =>
													setExpandedCard(isOpen ? null : r.district.id!)
												}
												className="flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition active:bg-blue-50 dark:active:bg-blue-900/30"
											>
												<div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
													<span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
														{i + 1}
													</span>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-1.5">
														<span
															title={monitoringTitle(
																r.district.monitoring_score,
															)}
															className="h-2 w-2 shrink-0 rounded-full"
															style={{ backgroundColor: monitoringColor }}
														/>
														<p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
															{r.shortName}
														</p>
													</div>
													<div className="mt-1.5">
														<FillBar value={r.fillRate} />
													</div>
												</div>
												<svg
													className={`mt-1 h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600 transition-transform ${isOpen ? "rotate-90" : ""}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</button>
											{isOpen && (
												<div className="px-4 pb-3">
													<div className="grid grid-cols-3 gap-2 text-center text-[11px]">
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.totalCapacity.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Мощность
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.totalStudents.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Обуч-ся
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.schoolCount}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Кол-во учреждений
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.totalWorkers.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Кол-во работников
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.totalTeachers.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Кол-во педагогов
															</p>
														</div>
														{previewExtras.map((col) => (
															<div
																key={col.key}
																className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2"
															>
																<p className="font-bold text-neutral-800 dark:text-neutral-200">
																	{fmtAggregatedExtra(
																		r.extras[col.key],
																		col.type,
																	)}
																</p>
																<p
																	className="text-neutral-400 dark:text-neutral-500 truncate"
																	title={col.label}
																>
																	{col.label}
																</p>
															</div>
														))}
													</div>
													{r.studentsWithCapacity > r.totalCapacity && (
														<p className="mt-2 text-center text-xs font-semibold text-rose-500">
															Дефицит:{" "}
															{(
																r.studentsWithCapacity - r.totalCapacity
															).toLocaleString("ru")}{" "}
															мест
														</p>
													)}
													<button
														onClick={() => setSelectedId(r.district.id!)}
														className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 active:scale-[0.97]"
													>
														Подробнее по школам
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
						<div className="hidden flex-1 overflow-auto table-scroll md:block">
							<table className="w-full border-collapse text-[13px]">
								<thead className="sticky top-0 z-30 bg-[#1e3a5f]">
									<tr className="bg-[#1e3a5f] text-white">
										<th className="sticky left-0 z-40 w-12 min-w-12 max-w-12 bg-[#1e3a5f] py-3 pl-4 pr-1 text-left text-[11px] font-semibold uppercase tracking-wider text-white/70">
											#
										</th>
										<th
											className="sticky left-12 z-40 min-w-50 bg-[#1e3a5f] py-3 pl-5 pr-6 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition shadow-[inset_-1px_0_0_0_#d4d4d4,6px_0_8px_-6px_rgba(0,0,0,0.25)] dark:shadow-[inset_-1px_0_0_0_#525252,6px_0_8px_-6px_rgba(0,0,0,0.25)]"
											onClick={() => toggleDistrictSort("name")}
										>
											Район
											<SortArrow
												active={districtSort.key === "name"}
												dir={
													districtSort.key === "name" ? districtSort.dir : "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("fillRate")}
										>
											Заполненность
											<SortArrow
												active={districtSort.key === "fillRate"}
												dir={
													districtSort.key === "fillRate"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("schoolCount")}
										>
											Кол-во учреждений
											<SortArrow
												active={districtSort.key === "schoolCount"}
												dir={
													districtSort.key === "schoolCount"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("totalCapacity")}
										>
											Мощность
											<SortArrow
												active={districtSort.key === "totalCapacity"}
												dir={
													districtSort.key === "totalCapacity"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("students")}
										>
											Кол-во обучающихся
											<SortArrow
												active={districtSort.key === "students"}
												dir={
													districtSort.key === "students"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("workers")}
										>
											Кол-во работников
											<SortArrow
												active={districtSort.key === "workers"}
												dir={
													districtSort.key === "workers"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("teachers")}
										>
											Кол-во педагогов
											<SortArrow
												active={districtSort.key === "teachers"}
												dir={
													districtSort.key === "teachers"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										{expanded &&
											extraColumns.map((col) => {
												const sk = `extra:${col.key}`;
												return (
													<th
														key={col.key}
														className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
														onClick={() => toggleDistrictSort(sk)}
														title={col.label}
													>
														<span className="inline-flex items-center justify-center">
															<span className="line-clamp-3 max-w-[200px] whitespace-normal leading-snug">
																{col.label}
															</span>
															<SortArrow
																active={districtSort.key === sk}
																dir={
																	districtSort.key === sk
																		? districtSort.dir
																		: "asc"
																}
															/>
														</span>
													</th>
												);
											})}
									</tr>
								</thead>
								<tbody>
									{sorted.map((r, i) => {
										const stickyBg =
											(i % 2 === 0
												? "bg-white dark:bg-neutral-800"
												: "bg-neutral-100 dark:bg-neutral-800") +
											" group-hover:bg-blue-50 dark:group-hover:bg-blue-900";
										return (
											<tr
												key={`${r.district.id}-${r.district.name}`}
												onClick={() => setSelectedId(r.district.id!)}
												className={`group cursor-pointer border-b border-neutral-100 dark:border-neutral-700 transition hover:bg-blue-50 dark:hover:bg-blue-900 ${i % 2 === 0 ? "bg-white dark:bg-neutral-800" : "bg-neutral-100 dark:bg-neutral-800"}`}
											>
												<td
													className={`sticky left-0 z-10 w-12 min-w-12 max-w-12 ${stickyBg} py-4 pl-4 pr-1 font-medium text-neutral-400 dark:text-neutral-500 transition-colors`}
												>
													{i + 1}
												</td>
												<td
													className={`sticky left-12 z-20 ${stickyBg} py-4 pl-5 pr-6 transition-colors shadow-[inset_-1px_0_0_0_#d4d4d4,6px_0_8px_-6px_rgba(0,0,0,0.18)] dark:shadow-[inset_-1px_0_0_0_#525252,6px_0_8px_-6px_rgba(0,0,0,0.55)]`}
												>
													<div className="flex items-center gap-3">
														<span
															title={monitoringTitle(
																r.district.monitoring_score,
															)}
															className="h-2.5 w-2.5 shrink-0 rounded-full"
															style={{
																backgroundColor: getMonitoringColor(r.district),
															}}
														/>
														<span className="font-semibold text-neutral-800 dark:text-neutral-200">
															{r.shortName}
														</span>
													</div>
												</td>
												<td className="py-4 px-4 text-center">
													<FillBar value={r.fillRate} />
												</td>
												<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
													{r.schoolCount}
												</td>
												<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
													{r.totalCapacity.toLocaleString("ru")}
												</td>
												<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
													{r.totalStudents.toLocaleString("ru")}
												</td>
												<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
													{r.totalWorkers.toLocaleString("ru")}
												</td>
												<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
													{r.totalTeachers.toLocaleString("ru")}
												</td>
												{expanded &&
													extraColumns.map((col) => (
														<td
															key={col.key}
															className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300"
														>
															{fmtAggregatedExtra(r.extras[col.key], col.type)}
														</td>
													))}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{!expanded && (
					<div className="flex w-full flex-col gap-5 p-4 lg:w-1/2 xl:w-[38%] lg:overflow-y-auto lg:p-6 lg:pl-0">
						<div className="hidden shrink-0 items-center gap-2 lg:flex">
							<Link
								to="/map"
								className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-[0.97]"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
									/>
								</svg>
								Карта школ
							</Link>
							<Link
								to="/admin"
								className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-[0.97]"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								Админ-панель
							</Link>
							<ThemeToggle />
						</div>

						<div className="flex shrink-0 gap-1 rounded-2xl bg-neutral-200/60 dark:bg-neutral-700/60 p-1">
							<TabBtn
								active={tab === "districts"}
								onClick={() => setTab("districts")}
							>
								Районы
							</TabBtn>
							<TabBtn
								active={tab === "republic"}
								onClick={() => setTab("republic")}
							>
								Республика
							</TabBtn>
						</div>

						{tab === "republic" ? (
							// min-h-0 + собственная прокрутка: раньше карточка с overflow-hidden
							// сжималась до высоты колонки и нижние показатели обрезались.
							<div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 lg:min-h-0 lg:flex-1">
								<div className="thin-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
									<RepublicTotalsGrid
										totals={totals}
										extraColumns={extraColumns}
									/>
								</div>
							</div>
						) : (
							<ChechenGrid rows={rows} onSelect={(id) => setSelectedId(id)} />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
