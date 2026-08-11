import {z} from "zod"

// Sheets renders display strings by default, so a cell holding 1000 shown as "$1,000.00" comes
// back as "$1,000.00" and never matches a workflow value of "1000". Reading unformatted values
// fixes the comparison, but numbers and booleans then arrive as JSON types rather than strings
// — hence the widened cell schema and `toCellStrings` below. Dates stay formatted, because
// their unformatted form is a serial number (46237) that matches nothing a user would type.
export const VALUE_RENDER_QUERY: Record<string, string> = {
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
}

const cellValueSchema = z.union([z.string(), z.number(), z.boolean()])

type RawCellValue = z.infer<typeof cellValueSchema>

export function toCellStrings(values: RawCellValue[][] | undefined): string[][] {
    return (values ?? []).map((row) => row.map((cell) => String(cell)))
}

export const valueRangeSchema = z.object({
    range: z.string().optional(),
    majorDimension: z.string().optional(),
    values: z.array(z.array(cellValueSchema)).optional(),
})

export const spreadsheetSchema = z.object({
    sheets: z.array(
        z.object({
            properties: z.object({
                sheetId: z.number(),
                title: z.string(),
            }),
        })
    ),
})

export const batchUpdateResponseSchema = z.object({
    spreadsheetId: z.string().optional(),
    replies: z.array(z.unknown()).optional(),
})

export const appendResponseSchema = z.object({
    updates: z
        .object({
            updatedRange: z.string().optional(),
            updatedRows: z.number().optional(),
        })
        .optional(),
})

export const updateValuesResponseSchema = z.object({
    updatedRange: z.string().optional(),
    updatedRows: z.number().optional(),
})

export const batchUpdateValuesResponseSchema = z.object({
    totalUpdatedCells: z.number().optional(),
})
