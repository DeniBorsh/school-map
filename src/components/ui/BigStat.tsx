export function BigStat({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent: string;
}) {
	return (
		<div className="flex min-w-0 flex-col items-center justify-center rounded-2xl bg-white dark:bg-neutral-800 p-3 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700 sm:p-4">
			<p
				className="max-w-full text-center text-xl font-bold tracking-tight whitespace-nowrap sm:text-2xl"
				style={{ color: accent }}
			>
				{value}
			</p>
			<p className="mt-1 max-w-full text-center text-[11px] font-medium leading-tight text-neutral-400 dark:text-neutral-500">
				{label}
			</p>
		</div>
	);
}
