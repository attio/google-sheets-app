import {type AsyncResult, complete, isErrored} from "@attio/fetchable"
import {z} from "zod"
import {buildSpreadsheetsQuery} from "../google-sheets/drive/list-spreadsheets"
import type {GoogleApiError} from "../google-sheets/errors"
import {googleDriveRequest} from "../google-sheets/request"

const filesListResponseSchema = z.object({
    files: z.array(z.object({id: z.string(), name: z.string()})),
})

export default async function listSpreadsheets({
    query,
}: {
    query: string
}): AsyncResult<Array<{id: string; name: string}>, GoogleApiError> {
    const result = await googleDriveRequest({
        method: "GET",
        path: "/files",
        query: {
            q: buildSpreadsheetsQuery(query),
            fields: "files(id,name)",
            orderBy: "modifiedTime desc",
            pageSize: "50",
            /**
             * Include items from all drives. This can impact performance but should be fine with the query.
             * Docs: https://developers.google.com/workspace/drive/api/guides/enable-shareddrives
             */
            corpora: "allDrives",
            spaces: "drive",
            includeItemsFromAllDrives: "true",
            supportsAllDrives: "true",
        },
        schema: filesListResponseSchema,
    })
    if (isErrored(result)) return result

    return complete(result.value.files)
}
