import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	District,
	ExtraColumn,
	RepublicTotals,
	School,
} from "@/types";
import {
	normalizeParsedData,
	parseExcelBuffer,
	PARSER_VERSION,
} from "@/lib/excelParser";

const STORAGE_KEY = "schools_data_cache_v3";
// Исходный .xlsx (base64): нужен, чтобы после обновления парсера
// разобрать файл заново без повторной загрузки.
const SOURCE_KEY = "schools_source_file_v1";

interface DataState {
	districts: District[];
	schools: School[];
	extraColumns: ExtraColumn[];
	institutionTypes: string[];
	republicTotals: RepublicTotals | null;
	loaded: boolean;
	// Данные разобраны старой версией парсера, а исходного файла нет.
	stale: boolean;
}

interface PersistedShape {
	districts: District[];
	schools: School[];
	extraColumns: ExtraColumn[];
	institutionTypes: string[];
	republicTotals: RepublicTotals | null;
}

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

export function rememberSourceFile(bytes: Uint8Array) {
	try {
		localStorage.setItem(SOURCE_KEY, bytesToBase64(bytes));
	} catch {
		try {
			localStorage.removeItem(SOURCE_KEY);
		} catch {}
	}
}

function reparseSourceFile(): PersistedShape | null {
	try {
		const b64 = localStorage.getItem(SOURCE_KEY);
		if (!b64) return null;
		const data = parseExcelBuffer(base64ToBytes(b64));
		saveToStorage(data);
		return data;
	} catch {
		return null;
	}
}

function loadFromStorage(): (PersistedShape & { stale: boolean }) | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (
			!parsed ||
			!Array.isArray(parsed.districts) ||
			!Array.isArray(parsed.schools)
		) {
			return null;
		}
		if (parsed.parserVersion !== PARSER_VERSION) {
			const fresh = reparseSourceFile();
			if (fresh) return { ...fresh, stale: false };
		}
		const normalized = normalizeParsedData({
			districts: parsed.districts,
			schools: parsed.schools,
			extraColumns: Array.isArray(parsed.extraColumns)
				? parsed.extraColumns
				: [],
			institutionTypes: Array.isArray(parsed.institutionTypes)
				? parsed.institutionTypes
				: [],
			republicTotals: parsed.republicTotals ?? null,
		});
		return {
			...normalized,
			stale: parsed.parserVersion !== PARSER_VERSION,
		};
	} catch {
		return null;
	}
}

function saveToStorage(state: PersistedShape) {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...state, parserVersion: PARSER_VERSION }),
		);
	} catch {}
}

const cached = loadFromStorage();

const initialState: DataState = {
	districts: cached?.districts ?? [],
	schools: cached?.schools ?? [],
	extraColumns: cached?.extraColumns ?? [],
	institutionTypes: cached?.institutionTypes ?? [],
	republicTotals: cached?.republicTotals ?? null,
	loaded: cached !== null,
	stale: cached?.stale ?? false,
};

export const dataSlice = createSlice({
	name: "data",
	initialState,
	reducers: {
		setData(state, action: PayloadAction<PersistedShape>) {
			state.districts = action.payload.districts;
			state.schools = action.payload.schools;
			state.extraColumns = action.payload.extraColumns;
			state.institutionTypes = action.payload.institutionTypes;
			state.republicTotals = action.payload.republicTotals ?? null;
			state.loaded = true;
			state.stale = false;
			saveToStorage({
				districts: action.payload.districts,
				schools: action.payload.schools,
				extraColumns: action.payload.extraColumns,
				institutionTypes: action.payload.institutionTypes,
				republicTotals: action.payload.republicTotals ?? null,
			});
		},
	},
});

export const { setData } = dataSlice.actions;
