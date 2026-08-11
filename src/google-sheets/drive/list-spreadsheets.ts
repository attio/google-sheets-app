const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet"

function escapeDriveLiteral(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export function buildSpreadsheetsQuery(query: string): string {
    return [
        `mimeType='${SPREADSHEET_MIME}'`,
        "trashed=false",
        ...(query.length > 0 ? [`name contains '${escapeDriveLiteral(query)}'`] : []),
    ].join(" and ")
}
