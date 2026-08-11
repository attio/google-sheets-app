const MAX_LISTED_COLUMNS = 15

export type GoogleApiErrorCode =
    | "NOT_FOUND"
    | "UNAUTHENTICATED"
    | "PERMISSION_DENIED"
    | "RATE_LIMITED"
    | "INVALID_REQUEST"
    | "UPSTREAM_ERROR"
    | "NETWORK_ERROR"
    | "PARSE_ERROR"

// `detail` carries the underlying provider message for logging only. It must
// never be shown to users — `describeError` produces the user-facing string.
export type GoogleApiError = {code: GoogleApiErrorCode; detail?: string}

export type GoogleSheetsError =
    | GoogleApiError
    | {code: "SHEET_NOT_FOUND"; sheetName: string}
    | {code: "COLUMNS_NOT_FOUND"; columns: string[]; header: string[]}
    | {code: "COLUMN_LETTERS_REQUIRED"; columns: string[]}
    | {code: "HEADER_ROW_EMPTY"}

export function mapStatusToErrorCode(status: number): GoogleApiErrorCode {
    switch (status) {
        case 400:
            return "INVALID_REQUEST"
        case 401:
            return "UNAUTHENTICATED"
        case 403:
            return "PERMISSION_DENIED"
        case 404:
            return "NOT_FOUND"
        case 429:
            return "RATE_LIMITED"
        default:
            return "UPSTREAM_ERROR"
    }
}

export function isRetryable(error: GoogleSheetsError): boolean {
    return (
        error.code === "RATE_LIMITED" ||
        error.code === "UPSTREAM_ERROR" ||
        error.code === "NETWORK_ERROR"
    )
}

function describeAvailableColumns(header: string[]): string {
    const names = header.filter((name) => name.trim() !== "")
    if (names.length === 0) return ""

    const listed = names.slice(0, MAX_LISTED_COLUMNS)
    const remaining = names.length - listed.length
    const suffix = remaining > 0 ? `, and ${remaining} more` : ""
    return ` Available columns are: ${listed.join(", ")}${suffix}.`
}

export function describeError(error: GoogleSheetsError): string {
    switch (error.code) {
        case "NOT_FOUND":
            return "The spreadsheet or sheet could not be found. Check that it exists and that your Google connection has access to it."
        case "UNAUTHENTICATED":
            return "Your Google connection has expired or is invalid. Reconnect Google to continue."
        case "PERMISSION_DENIED":
            return "Your Google connection doesn't have access to this spreadsheet. Reconnect Google and grant access to Google Sheets and Drive."
        case "RATE_LIMITED":
            return "Google is temporarily rate-limiting requests. Please try again shortly."
        case "INVALID_REQUEST":
            return "The request to Google was invalid. Check the block configuration and try again."
        case "UPSTREAM_ERROR":
        case "PARSE_ERROR":
            return "An unexpected error occurred while calling Google. Please try again."
        case "NETWORK_ERROR":
            return "Couldn't reach Google. Check your connection and try again."
        case "SHEET_NOT_FOUND":
            return `The sheet "${error.sheetName}" was not found in the spreadsheet.`
        case "COLUMNS_NOT_FOUND":
            return `These columns were not found in the sheet's header row: ${error.columns.join(", ")}.${describeAvailableColumns(error.header)} You can also reference a column by letter (A-ZZ).`
        case "COLUMN_LETTERS_REQUIRED":
            return `This step is set up for a sheet without a header row, so columns must be referenced by letter (A-ZZ). Update these columns: ${error.columns.join(", ")}.`
        case "HEADER_ROW_EMPTY":
            return "The first row of this sheet is empty, so columns can't be matched by name. Add a header row, or turn off the header setting and reference columns by letter (A-ZZ)."
    }
}
