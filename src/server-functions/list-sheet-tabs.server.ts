import type {AsyncResult} from "@attio/fetchable"
import type {GoogleApiError} from "../google-sheets/errors"
import {listSheetTabs as listSheetTabsCore, type SheetTab} from "../google-sheets/tabs"

export default async function listSheetTabs({
    spreadsheetId,
}: {
    spreadsheetId: string
}): AsyncResult<SheetTab[], GoogleApiError> {
    return await listSheetTabsCore({spreadsheetId})
}
