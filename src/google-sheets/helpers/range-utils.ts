export function indexToLetter(index: number): string {
    let n = index
    let result = ""
    while (n > 0) {
        const remainder = (n - 1) % 26
        result = String.fromCharCode(65 + remainder) + result
        n = Math.floor((n - 1) / 26)
    }
    return result
}

export function letterToIndex(letter: string): number {
    let result = 0
    for (const ch of letter.toUpperCase()) {
        result = result * 26 + (ch.charCodeAt(0) - 64)
    }
    return result
}

export function buildRowValues(items: Array<{letter: string; value: string}>): string[] {
    let maxIdx = 0
    for (const {letter} of items) {
        maxIdx = Math.max(maxIdx, letterToIndex(letter))
    }
    const row = new Array<string>(maxIdx).fill("")
    for (const {letter, value} of items) {
        row[letterToIndex(letter) - 1] = value
    }
    return row
}

// A1 notation for use in a request body, where it must NOT be percent-encoded — as in the
// `data[].range` entries of `values:batchUpdate`.
export function buildRange(sheetName: string, range?: string): string {
    const needsQuoting = range !== undefined || /[^A-Za-z0-9_]/.test(sheetName)
    return needsQuoting
        ? `'${sheetName.replace(/'/g, "''")}'${range !== undefined ? `!${range}` : ""}`
        : sheetName
}

// The same notation for use in a URL path segment.
export function encodeRange(sheetName: string, range?: string): string {
    return encodeURIComponent(buildRange(sheetName, range))
}

// Extracts the 1-based row number from an updated range like `Sheet1!A5:C5`,
// as returned by the Sheets `values.append` response.
export function parseAppendedRowNumber(updatedRange: string | undefined): number | null {
    if (updatedRange === undefined) return null
    const cells = updatedRange.includes("!")
        ? updatedRange.slice(updatedRange.indexOf("!") + 1)
        : updatedRange
    const match = /^[A-Z]+(\d+)/.exec(cells)
    return match ? Number(match[1]) : null
}
