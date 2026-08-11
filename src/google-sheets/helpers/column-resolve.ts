import {complete, errored, type Result} from "@attio/fetchable"
import type {GoogleSheetsError} from "../errors"
import {indexToLetter} from "./range-utils"

export type ColumnInput = {column: string; value: string}

export type ResolvedColumn = {letter: string; value: string}

// Only short alphabetic strings (A..ZZ) are interpreted as column letters when there's
// no header match. Longer words like "Name" or "Email" would otherwise be silently
// resolved as the column letter NAME (index 247247) or EMAIL (index 2514290), padding
// every written row with hundreds of thousands of empty cells.
const COLUMN_LETTER_PATTERN = /^[A-Za-z]{1,2}$/

export function isColumnLetter(column: string): boolean {
    return COLUMN_LETTER_PATTERN.test(column)
}

export function withoutBlankColumns(entries: ColumnInput[]): ColumnInput[] {
    return entries.filter(({column}) => column.trim() !== "")
}

function normalise(value: string): string {
    return value.trim().toLowerCase()
}

// Headers routinely carry stray casing and padding ("Email " vs "Email"), so an exact match
// is tried before a normalised one. Exact-first keeps resolution deterministic when a sheet
// has both "Email" and "email", and it also stops a two-letter header near-miss (config "ID"
// against header "Id") from falling through to the column-letter branch as index 238.
function findHeaderIndex(column: string, header: string[]): number {
    const exactIndex = header.indexOf(column)
    if (exactIndex >= 0) return exactIndex

    const normalisedColumn = normalise(column)
    return header.findIndex((name) => normalise(name) === normalisedColumn)
}

function resolveColumnLetter({
    column,
    header,
    hasHeader,
}: {
    column: string
    header: string[]
    hasHeader: boolean
}): string | null {
    if (hasHeader) {
        const headerIndex = findHeaderIndex(column, header)
        if (headerIndex >= 0) {
            return indexToLetter(headerIndex + 1)
        }
    }
    if (isColumnLetter(column)) {
        return column.toUpperCase()
    }
    return null
}

export function resolveColumns({
    entries,
    header,
    hasHeader,
}: {
    entries: ColumnInput[]
    header: string[]
    hasHeader: boolean
}): Result<ResolvedColumn[], GoogleSheetsError> {
    const resolved: ResolvedColumn[] = []
    const unresolved: string[] = []

    for (const {column, value} of entries) {
        const letter = resolveColumnLetter({column, header, hasHeader})
        if (letter === null) {
            unresolved.push(column)
            continue
        }
        resolved.push({letter, value})
    }

    if (unresolved.length === 0) return complete(resolved)

    if (!hasHeader) {
        return errored({code: "COLUMN_LETTERS_REQUIRED", columns: unresolved})
    }
    if (header.every((name) => name.trim() === "")) {
        return errored({code: "HEADER_ROW_EMPTY"})
    }
    return errored({code: "COLUMNS_NOT_FOUND", columns: unresolved, header})
}
