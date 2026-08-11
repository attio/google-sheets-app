import {complete} from "@attio/fetchable"
import {describe, expect, it} from "vitest"
import {findAllMatchingRows, findMatchingRow, headerFrom} from "../helpers/row-match"

const SHEET_WITH_HEADER = [
    ["Name", "Email"],
    ["Ada", "ada@example.com"],
    ["Grace", "grace@example.com"],
    ["Ada", "ada2@example.com"],
]

const HEADERLESS_SHEET = [
    ["Ada", "ada@example.com"],
    ["Grace", "grace@example.com"],
]

describe(findMatchingRow, () => {
    it("returns the first data row below the header", () => {
        expect(
            findMatchingRow({
                values: SHEET_WITH_HEADER,
                lookupColumns: [{column: "Name", value: "Ada"}],
                hasHeader: true,
            })
        ).toEqual(complete({rowNumber: 2, values: ["Ada", "ada@example.com"]}))
    })

    it("never matches the header row itself", () => {
        expect(
            findMatchingRow({
                values: SHEET_WITH_HEADER,
                lookupColumns: [{column: "A", value: "Name"}],
                hasHeader: true,
            })
        ).toEqual(complete(null))
    })

    it("matches on every supplied column", () => {
        expect(
            findMatchingRow({
                values: SHEET_WITH_HEADER,
                lookupColumns: [
                    {column: "Name", value: "Ada"},
                    {column: "Email", value: "ada2@example.com"},
                ],
                hasHeader: true,
            })
        ).toEqual(complete({rowNumber: 4, values: ["Ada", "ada2@example.com"]}))
    })

    it("matches row 1 when the sheet has no header", () => {
        expect(
            findMatchingRow({
                values: HEADERLESS_SHEET,
                lookupColumns: [{column: "A", value: "Ada"}],
                hasHeader: false,
            })
        ).toEqual(complete({rowNumber: 1, values: ["Ada", "ada@example.com"]}))
    })

    it("scans a single-row sheet when there is no header", () => {
        expect(
            findMatchingRow({
                values: [["Ada"]],
                lookupColumns: [{column: "A", value: "Ada"}],
                hasHeader: false,
            })
        ).toEqual(complete({rowNumber: 1, values: ["Ada"]}))
    })

    it("finds nothing in a header-only sheet", () => {
        expect(
            findMatchingRow({
                values: [["Name"]],
                lookupColumns: [{column: "A", value: "Name"}],
                hasHeader: true,
            })
        ).toEqual(complete(null))
    })

    it("returns no match when nothing matches", () => {
        expect(
            findMatchingRow({
                values: SHEET_WITH_HEADER,
                lookupColumns: [{column: "Name", value: "Nobody"}],
                hasHeader: true,
            })
        ).toEqual(complete(null))
    })
})

describe(findAllMatchingRows, () => {
    it("returns every matching row below the header", () => {
        expect(
            findAllMatchingRows({
                values: SHEET_WITH_HEADER,
                lookupColumns: [{column: "Name", value: "Ada"}],
                hasHeader: true,
            })
        ).toEqual(
            complete([
                {rowNumber: 2, values: ["Ada", "ada@example.com"]},
                {rowNumber: 4, values: ["Ada", "ada2@example.com"]},
            ])
        )
    })

    it("includes row 1 when the sheet has no header", () => {
        expect(
            findAllMatchingRows({
                values: HEADERLESS_SHEET,
                lookupColumns: [{column: "B", value: "ada@example.com"}],
                hasHeader: false,
            })
        ).toEqual(complete([{rowNumber: 1, values: ["Ada", "ada@example.com"]}]))
    })

    it("returns nothing for an empty sheet", () => {
        expect(
            findAllMatchingRows({
                values: [],
                lookupColumns: [{column: "A", value: "Ada"}],
                hasHeader: false,
            })
        ).toEqual(complete([]))
    })
})

describe(headerFrom, () => {
    it("reads row 1 as the header when the sheet has one", () => {
        expect(headerFrom(SHEET_WITH_HEADER, true)).toEqual(["Name", "Email"])
    })

    it("reports no header when row 1 is data", () => {
        expect(headerFrom(HEADERLESS_SHEET, false)).toEqual([])
    })

    it("reports no header for an empty sheet", () => {
        expect(headerFrom([], true)).toEqual([])
    })
})
