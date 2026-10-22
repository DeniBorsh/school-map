import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	District,
	ExtraColumn,
	RepublicTotals,
	School,
} from "@/types";
import { normalizeParsedData } from "@/lib/excelParser";

const STORAGE_KEY = "schools_data_cache_v3";

interface DataState {
	districts: District[];
	schools: School[];
	extraColumns: ExtraColumn[];
	institutionTypes: string[];
	republicTotals: RepublicTotals | null;
	loaded: boolean;
}

interface PersistedShape {
	districts: District[];
	schools: School[];
	extraColumns: ExtraColumn[];
	institutionTypes: string[];
	republicTotals: RepublicTotals | null;
}

function loadFromStorage(): PersistedShape | null {
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
		return normalized;
	} catch {
		return null;
	}
}

function saveToStorage(state: PersistedShape) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
