import type { DistrictRow } from "@/lib/useDashboardData";
import { getMonitoringColor } from "@/data/districts";

interface ChechenGridProps {
	rows: DistrictRow[];
	onSelect: (id: number) => void;
}

const SHORT: Record<string, string> = {
	"Грозный (город)": "Грозный",
	"Аргун (город)": "Аргун",
	"Итум-Калинский р-н": "Итум-Кали",
	"Веденский р-н": "Ведено",
	"Надтеречный р-н": "Надтеречн.",
	"Серноводский р-н": "Серновод.",
	"Шалинский р-н": "Шали",
	"Шатойский р-н": "Шатой",
	"Шаройский р-н": "Шарой",
	"Грозненский р-н": "Грознен.",
	"Урус-Мартановский р-н": "Урус-Март.",
	"Гудермесский р-н": "Гудермес",
	"Наурский р-н": "Наурский",
	"Курчалоевский р-н": "Курчалой",
	"Ачхой-Мартановский р-н": "Ачхой-М.",
	"Ножай-Юртовский р-н": "Ножай-Юрт",
	"Шелковской р-н": "Шелковск.",
};

const COLS = 6;

type CellDef =
	| { type: "district"; name: string }
	| { type: "grozny" }
	| { type: "empty" };

const GRID: CellDef[][] = [
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Наурский р-н" },
		{ type: "district", name: "Шелковской р-н" },
		{ type: "empty" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "district", name: "Надтеречный р-н" },
		{ type: "district", name: "Грозненский р-н" },
		{ type: "empty" },
		{ type: "empty" },
		{ type: "empty" },
	],
	[
		{ type: "district", name: "Серноводский р-н" },
		{ type: "district", name: "Ачхой-Мартановский р-н" },
		{ type: "grozny" },
		{ type: "district", name: "Аргун (город)" },
		{ type: "district", name: "Гудермесский р-н" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Урус-Мартановский р-н" },
		{ type: "district", name: "Шалинский р-н" },
		{ type: "district", name: "Курчалоевский р-н" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Шатойский р-н" },
		{ type: "district", name: "Веденский р-н" },
		{ type: "district", name: "Ножай-Юртовский р-н" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Итум-Калинский р-н" },
		{ type: "district", name: "Шаройский р-н" },
		{ type: "empty" },
		{ type: "empty" },
	],
];

function findRow(rows: DistrictRow[], name: string) {
	return rows.find((r) => r.district.name === name || r.shortName === name);
}

function CellButton({
	row,
	onSelect,
	small,
	label,
}: {
	row: DistrictRow | undefined;
	onSelect: (id: number) => void;
	small?: boolean;
	label?: string;
}) {
	if (!row) return null;
	const color = getMonitoringColor(row.district);
	const text = label ?? SHORT[row.district.name] ?? row.shortName;
	return (
		<button
			onClick={() => onSelect(row.district.id!)}
			className={`relative flex h-full w-full cursor-pointer transition hover:brightness-110 active:scale-[0.97] ${small ? "items-center justify-center rounded-[3px] ring-1 ring-black/40" : "items-end justify-start rounded-md"}`}
			style={{ backgroundColor: color }}
			title={
				row.district.monitoring_score == null
					? `${row.shortName} — балл мониторинга не указан`
					: `${row.shortName} — ${row.district.monitoring_score.toLocaleString("ru")}`
			}
		>
			<span
				className={`max-w-full truncate font-bold leading-tight text-white drop-shadow-sm ${
					small ? "text-[5px] sm:text-[6px]" : "p-1 text-[8px] sm:p-1.5 sm:text-[10px]"
				}`}
			>
				{text}
			</span>
		</button>
	);
}

export function ChechenGrid({
	rows,
	onSelect,
}: ChechenGridProps) {
	const groznyMain = findRow(rows, "Грозный (город)");
	const groznyColor = getMonitoringColor(groznyMain?.district);

	return (
		<div className="flex flex-col gap-2">
			<div
				className="mx-auto grid w-full max-w-[340px] gap-0.5 sm:max-w-[420px] sm:gap-[3px] md:max-w-[480px] lg:max-w-[min(516px,calc(100dvh-13rem))]"
				style={{
					gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
				}}
			>
				{GRID.map((row, ri) =>
					row.map((cell, ci) => {
						const key = `${ri}-${ci}`;
						return (
							// Квадрат через padding-top: работает и там, где
							// aspect-ratio не поддерживается или перебивается
							// высотой родителя (старые iPad / Android-планшеты).
							<div key={key} className="relative w-full pt-[100%]">
								<div className="absolute inset-0">
									{renderCell(cell)}
								</div>
							</div>
						);
					}),
				)}
			</div>
		</div>
	);

	function renderCell(cell: CellDef) {
		if (cell.type === "empty") return null;

		if (cell.type === "grozny") {
			return (
				<div
					className="relative h-full w-full overflow-hidden rounded-md"
					style={{ backgroundColor: groznyColor }}
					title="г. Грозный"
				>
					<button
						onClick={() => groznyMain && onSelect(groznyMain.district.id!)}
						className="absolute inset-0 z-10 cursor-pointer transition hover:bg-white/10 active:scale-[0.97]"
						title="г. Грозный"
					/>
					<span className="pointer-events-none absolute bottom-1 left-1.5 right-1 z-20 truncate text-[8px] font-bold text-white/90 drop-shadow-sm sm:text-[10px]">
						Грозный
					</span>
				</div>
			);
		}

		return (
			<CellButton
				row={findRow(rows, cell.name)}
				onSelect={onSelect}
				label={SHORT[cell.name]}
			/>
		);
	}
}
