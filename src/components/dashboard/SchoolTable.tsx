import React, { useState } from "react";
import type { ExtraColumn, School } from "@/types";
import type { SortState } from "@/lib/useDashboardData";
import {
	fmt,
	fmtExtraValue,
	siteUrl,
	calcFillRate,
} from "@/lib/format";
import { SortArrow } from "@/components/ui/SortArrow";

const TH =
	"py-2.5 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-white/70 whitespace-nowrap";
const TD =
	"py-2.5 px-3 text-center font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap";

function ExtraPill({ value }: { value: boolean }) {
	const cls = value
		? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
		: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300";
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
		>
			{value ? "Да" : "Нет"}
		</span>
	);
}

function renderExtraCell(school: School, col: ExtraColumn) {
	const v = school.extras?.[col.key];
	if (col.type === "boolean") {
		return (
			<td className="py-2.5 px-3 text-center whitespace-nowrap">
				{v == null ? (
					<span className="text-neutral-400 dark:text-neutral-500">—</span>
				) : (
					<ExtraPill value={Boolean(v)} />
				)}
			</td>
		);
	}
	return <td className={TD}>{fmtExtraValue(v ?? null, col.type)}</td>;
}

interface SchoolTableProps {
	schools: School[];
	extraColumns: ExtraColumn[];
	sort: SortState<string>;
	onToggleSort: (key: string) => void;
	selectedSchoolName?: string | null;
	onSelectSchool?: (school: School) => void;
}

function MobileSchoolCards({
	schools,
	extraColumns,
	selectedSchoolName,
	onSelectSchool,
}: {
	schools: School[];
	extraColumns: ExtraColumn[];
	selectedSchoolName?: string | null;
	onSelectSchool?: (school: School) => void;
}) {
	const [openIdx, setOpenIdx] = useState<number | null>(null);

	return (
		<div className="divide-y divide-neutral-100 dark:divide-neutral-700 md:hidden">
			{schools.map((s, i) => {
				const fr = calcFillRate(s.students, s.capacity);
				const isOpen = openIdx === i;
				return (
					<div
						key={i}
						className={
							i % 2 === 0
								? "bg-white dark:bg-neutral-800"
								: "bg-neutral-50/50 dark:bg-neutral-800/50"
						}
					>
						<button
							onClick={() => {
								onSelectSchool?.(s);
								setOpenIdx(isOpen ? null : i);
							}}
							className={`flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition active:bg-blue-50 dark:active:bg-blue-900/30 ${
								selectedSchoolName === s.name
									? "bg-blue-50 dark:bg-blue-900/30"
									: ""
							}`}
						>
							<div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
								<span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
									{i + 1}
								</span>
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-1.5">
									<span
										title={
											fr < 100
												? `Заполненность ниже 100% (${fr.toFixed(0)}%)`
												: `Заполненность ${fr.toFixed(0)}%`
										}
										className={`h-2 w-2 shrink-0 rounded-full ${fr < 100 ? "bg-rose-500" : "bg-emerald-500"}`}
									/>
									<p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
										{s.name}
									</p>
								</div>
								<p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
									{fmt(s.students)} уч. / {fmt(s.capacity)} мест ·{" "}
									{fr.toFixed(0)}%
								</p>
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
											{fmt(s.capacity)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Мощность
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.students)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Обуч-ся
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.shift)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Сменность
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.workers)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Кол-во работников
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.teachers)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Кол-во педагогов
										</p>
									</div>
									{extraColumns.slice(0, 4).map((col) => (
										<div
											key={col.key}
											className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2"
										>
											<p className="font-bold text-neutral-800 dark:text-neutral-200">
												{fmtExtraValue(s.extras?.[col.key] ?? null, col.type)}
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
								{s.address && (
									<p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
										{s.address}
									</p>
								)}
								{s.site && (
									<a
										href={siteUrl(s.site)!}
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="mt-1 block text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
									>
										{s.site}
									</a>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function SchoolTable({
	schools,
	extraColumns,
	sort,
	onToggleSort,
	selectedSchoolName,
	onSelectSchool,
}: SchoolTableProps) {
	return (
		<>
			<MobileSchoolCards
				schools={schools}
				extraColumns={extraColumns}
				selectedSchoolName={selectedSchoolName}
				onSelectSchool={onSelectSchool}
			/>
			<table className="hidden w-full border-collapse text-[13px] md:table">
				<thead className="sticky top-0 z-30 bg-[#1e3a5f]">
					<tr className="bg-[#1e3a5f] text-white">
						<th className="sticky left-0 z-40 w-12 min-w-12 max-w-12 bg-[#1e3a5f] py-2.5 pl-4 pr-1 text-left text-[11px] font-semibold uppercase tracking-wider text-white/70">
							#
						</th>
						<th
							className="sticky left-12 z-40 bg-[#1e3a5f] py-2.5 pl-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition shadow-[inset_-1px_0_0_0_#d4d4d4,6px_0_8px_-6px_rgba(0,0,0,0.25)] dark:shadow-[inset_-1px_0_0_0_#525252,6px_0_8px_-6px_rgba(0,0,0,0.25)]"
							onClick={() => onToggleSort("name")}
						>
							Название
							<SortArrow
								active={sort.key === "name"}
								dir={sort.key === "name" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("capacity")}
						>
							Мощность
							<SortArrow
								active={sort.key === "capacity"}
								dir={sort.key === "capacity" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("students")}
						>
							Кол-во обучающихся
							<SortArrow
								active={sort.key === "students"}
								dir={sort.key === "students" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("shift")}
						>
							Сменность
							<SortArrow
								active={sort.key === "shift"}
								dir={sort.key === "shift" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("workers")}
						>
							Кол-во работников
							<SortArrow
								active={sort.key === "workers"}
								dir={sort.key === "workers" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("teachers")}
						>
							Кол-во педагогов
							<SortArrow
								active={sort.key === "teachers"}
								dir={sort.key === "teachers" ? sort.dir : "asc"}
							/>
						</th>
						<th
							className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
							onClick={() => onToggleSort("site")}
						>
							Сайт
							<SortArrow
								active={sort.key === "site"}
								dir={sort.key === "site" ? sort.dir : "asc"}
							/>
						</th>
						{extraColumns.map((col) => {
							const sk = `extra:${col.key}`;
							return (
								<th
									key={col.key}
									className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
									onClick={() => onToggleSort(sk)}
									title={col.label}
								>
									<span className="inline-flex items-center justify-center">
										<span className="line-clamp-3 max-w-[200px] whitespace-normal leading-snug">
											{col.label}
										</span>
										<SortArrow
											active={sort.key === sk}
											dir={sort.key === sk ? sort.dir : "asc"}
										/>
									</span>
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{schools.map((s, i) => {
						const fr = calcFillRate(s.students, s.capacity);
						const url = siteUrl(s.site);
						const isSel = selectedSchoolName === s.name;
						const stickyBg = isSel
							? "bg-blue-50 dark:bg-blue-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900"
							: i % 2 === 0
								? "bg-white dark:bg-neutral-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900"
								: "bg-neutral-100 dark:bg-neutral-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900";
						return (
							<tr
								key={i}
								onClick={() => onSelectSchool?.(s)}
								className={`group cursor-pointer border-b border-neutral-100 dark:border-neutral-700 transition hover:bg-blue-50 dark:hover:bg-blue-900 ${
									isSel
										? "bg-blue-50 dark:bg-blue-900"
										: i % 2 === 0
											? "bg-white dark:bg-neutral-800"
											: "bg-neutral-100 dark:bg-neutral-800"
								}`}
							>
								<td
									className={`sticky left-0 z-10 w-12 min-w-12 max-w-12 ${stickyBg} py-2.5 pl-4 pr-1 font-medium text-neutral-400 dark:text-neutral-500 transition-colors`}
								>
									{i + 1}
								</td>
								<td
									className={`sticky left-12 z-20 ${stickyBg} py-2.5 pl-3 pr-4 transition-colors shadow-[inset_-1px_0_0_0_#d4d4d4,6px_0_8px_-6px_rgba(0,0,0,0.18)] dark:shadow-[inset_-1px_0_0_0_#525252,6px_0_8px_-6px_rgba(0,0,0,0.55)]`}
								>
									<div className="flex w-[clamp(200px,30vw,340px)] items-center gap-3">
										<span
											title={
												fr < 100
													? `Заполненность ниже 100% (${fr.toFixed(0)}%)`
													: `Заполненность ${fr.toFixed(0)}%`
											}
											className={`h-2.5 w-2.5 shrink-0 rounded-full ${fr < 100 ? "bg-rose-500" : "bg-emerald-500"}`}
										/>
										<div className="min-w-0">
											<p
												className="line-clamp-2 font-semibold leading-snug text-neutral-800 dark:text-neutral-200"
												title={s.name}
											>
												{s.name}
											</p>
											{s.address && (
												<p
													className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500"
													title={s.address}
												>
													{s.address}
												</p>
											)}
										</div>
									</div>
								</td>
								<td className={TD}>{fmt(s.capacity)}</td>
								<td className={TD}>{fmt(s.students)}</td>
								<td className={TD}>{fmt(s.shift)}</td>
								<td className={TD}>{fmt(s.workers)}</td>
								<td className={TD}>{fmt(s.teachers)}</td>
								<td className="py-2.5 px-3 text-center">
									{url ? (
										<a
											title={s.site ?? undefined}
											href={url}
											target="_blank"
											rel="noopener noreferrer"
											onClick={(e) => e.stopPropagation()}
											className="mx-auto block max-w-[200px] truncate text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
										>
											{s.site}
										</a>
									) : (
										<span className="text-neutral-400 dark:text-neutral-500">
											—
										</span>
									)}
								</td>
								{extraColumns.map((col) => (
									<React.Fragment key={col.key}>
										{renderExtraCell(s, col)}
									</React.Fragment>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	);
}
