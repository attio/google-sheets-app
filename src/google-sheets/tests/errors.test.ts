import {describe, expect, it} from "vitest"
import {describeError} from "../errors"

describe(describeError, () => {
    it("lists the columns the sheet actually has", () => {
        const message = describeError({
            code: "COLUMNS_NOT_FOUND",
            columns: ["Emial"],
            header: ["Name", "Email"],
        })

        expect(message).toContain("Emial")
        expect(message).toContain("Available columns are: Name, Email.")
    })

    it("caps a very wide header instead of dumping every column", () => {
        const header = Array.from({length: 20}, (_, index) => `Column${index + 1}`)
        const message = describeError({code: "COLUMNS_NOT_FOUND", columns: ["Missing"], header})

        expect(message).toContain("Column15")
        expect(message).not.toContain("Column16")
        expect(message).toContain("and 5 more")
    })

    it("omits the column list when the header has no usable names", () => {
        const message = describeError({
            code: "COLUMNS_NOT_FOUND",
            columns: ["Missing"],
            header: ["", "  "],
        })

        expect(message).not.toContain("Available columns")
    })

    it("tells a headerless sheet to use column letters", () => {
        const message = describeError({code: "COLUMN_LETTERS_REQUIRED", columns: ["Email"]})

        expect(message).toContain("Email")
        expect(message).toContain("A-ZZ")
    })

    it("describes an empty first row on its own terms", () => {
        expect(describeError({code: "HEADER_ROW_EMPTY"})).toContain("first row of this sheet")
    })

    it("never leaks transport details", () => {
        expect(describeError({code: "RATE_LIMITED"})).not.toContain("429")
    })
})
