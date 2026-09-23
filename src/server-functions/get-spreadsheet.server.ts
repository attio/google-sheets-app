import type {AsyncResult} from "@attio/fetchable"
import {z} from "zod"
import type {GoogleApiError} from "../google-sheets/errors"
import {googleDriveRequest} from "../google-sheets/request"

const fileSchema = z.object({id: z.string(), name: z.string()})

export default async function getSpreadsheet({
    spreadsheetId,
}: {
    spreadsheetId: string
}): AsyncResult<{id: string; name: string}, GoogleApiError> {
    return await googleDriveRequest({
        method: "GET",
        path: `/files/${spreadsheetId}`,
        query: {fields: "id,name", supportsAllDrives: "true"},
        schema: fileSchema,
    })
}
