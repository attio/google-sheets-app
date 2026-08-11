import {complete, errored} from "@attio/fetchable"
import {describe, expect, it} from "vitest"
import {resolveColumns, withoutBlankColumns} from "../helpers/column-resolve"

const WITH_HEADER = {hasHeader: true}
const WITHOUT_HEADER = {hasHeader: false, header: []}

describe(resolveColumns, () => {
    it("resolves a header name to its column letter", () => {
        expect(
            resolveColumns({
                entries: [{column: "Email", value: "a@b.com"}],
                header: ["Name", "Email", "Age"],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "B", value: "a@b.com"}]))
    })

    it("falls back to a 1-2 letter column reference when there's no header match", () => {
        expect(
            resolveColumns({
                entries: [
                    {column: "A", value: "1"},
                    {column: "c", value: "3"},
                ],
                header: ["Name"],
                ...WITH_HEADER,
            })
        ).toEqual(
            complete([
                {letter: "A", value: "1"},
                {letter: "C", value: "3"},
            ])
        )
    })

    it("does not treat multi-letter words as column letters (the NAME/EMAIL footgun)", () => {
        expect(
            resolveColumns({
                entries: [
                    {column: "Name", value: "x"},
                    {column: "ABC", value: "y"},
                ],
                header: ["Other"],
                ...WITH_HEADER,
            })
        ).toEqual(errored({code: "COLUMNS_NOT_FOUND", columns: ["Name", "ABC"], header: ["Other"]}))
    })

    it("prefers a header match over the letter heuristic", () => {
        // "B" matches header index 0 → column A, not literal column B.
        expect(
            resolveColumns({
                entries: [{column: "B", value: "v"}],
                header: ["B", "A"],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "A", value: "v"}]))
    })

    it("matches a header name regardless of case", () => {
        expect(
            resolveColumns({
                entries: [{column: "email", value: "v"}],
                header: ["Name", "Email"],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "B", value: "v"}]))
    })

    it("matches a header name padded with whitespace in the sheet", () => {
        expect(
            resolveColumns({
                entries: [{column: "Email", value: "v"}],
                header: ["Name", " Email "],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "B", value: "v"}]))
    })

    it("resolves a two-letter near-miss to the header, not to a far-off column letter", () => {
        // Without normalisation "ID" misses header "Id" and falls through to the letter
        // branch as column index 238, padding written rows with 237 empty cells.
        expect(
            resolveColumns({
                entries: [{column: "ID", value: "v"}],
                header: ["Id", "Email"],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "A", value: "v"}]))
    })

    it("resolves duplicate header names to the leftmost column", () => {
        expect(
            resolveColumns({
                entries: [{column: "Email", value: "v"}],
                header: ["Email", "Email"],
                ...WITH_HEADER,
            })
        ).toEqual(complete([{letter: "A", value: "v"}]))
    })

    it("reports every unresolved column", () => {
        expect(
            resolveColumns({
                entries: [
                    {column: "A", value: "1"},
                    {column: "Unknown", value: "2"},
                    {column: "AlsoUnknown", value: "3"},
                ],
                header: ["Name"],
                ...WITH_HEADER,
            })
        ).toEqual(
            errored({
                code: "COLUMNS_NOT_FOUND",
                columns: ["Unknown", "AlsoUnknown"],
                header: ["Name"],
            })
        )
    })

    it("reports an empty header row separately from a missing column", () => {
        expect(
            resolveColumns({entries: [{column: "Email", value: "v"}], header: [], ...WITH_HEADER})
        ).toEqual(errored({code: "HEADER_ROW_EMPTY"}))
    })

    it("resolves column letters when the sheet has no header", () => {
        expect(
            resolveColumns({
                entries: [{column: "b", value: "v"}],
                ...WITHOUT_HEADER,
            })
        ).toEqual(complete([{letter: "B", value: "v"}]))
    })

    it("requires letters when the sheet has no header", () => {
        expect(
            resolveColumns({
                entries: [{column: "Email", value: "v"}],
                ...WITHOUT_HEADER,
            })
        ).toEqual(errored({code: "COLUMN_LETTERS_REQUIRED", columns: ["Email"]}))
    })

    it("ignores a header row that is present but not in use", () => {
        // Row 1 is data when the sheet is headerless, so its values must never resolve names.
        expect(
            resolveColumns({
                entries: [{column: "Email", value: "v"}],
                header: ["Name", "Email"],
                hasHeader: false,
            })
        ).toEqual(errored({code: "COLUMN_LETTERS_REQUIRED", columns: ["Email"]}))
    })
})

describe(withoutBlankColumns, () => {
    it("drops entries with a blank or whitespace-only column", () => {
        expect(
            withoutBlankColumns([
                {column: "Email", value: "a"},
                {column: "", value: "b"},
                {column: "   ", value: "c"},
            ])
        ).toEqual([{column: "Email", value: "a"}])
    })
})
