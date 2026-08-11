import {describe, expect, it} from "vitest"
import {toCellStrings, valueRangeSchema} from "../schemas"

describe(toCellStrings, () => {
    it("returns an empty grid when the range held no values", () => {
        expect(toCellStrings(undefined)).toEqual([])
    })

    it("passes strings through untouched", () => {
        expect(toCellStrings([["Ada", "ada@example.com"]])).toEqual([["Ada", "ada@example.com"]])
    })

    it("renders an unformatted number as the digits a user would type", () => {
        // The point of reading unformatted values: a cell displaying "$1,000.00" arrives as
        // 1000 and now matches a workflow value of "1000".
        expect(toCellStrings([[1000]])).toEqual([["1000"]])
    })

    it("keeps zero and negative numbers intact", () => {
        expect(toCellStrings([[0, -12.5]])).toEqual([["0", "-12.5"]])
    })

    it("renders booleans as lowercase text", () => {
        expect(toCellStrings([[true, false]])).toEqual([["true", "false"]])
    })

    it("preserves ragged rows", () => {
        expect(toCellStrings([["a", "b"], [], ["c"]])).toEqual([["a", "b"], [], ["c"]])
    })
})

describe("valueRangeSchema", () => {
    it("accepts the mixed JSON types an unformatted read returns", () => {
        const parsed = valueRangeSchema.safeParse({
            range: "'Sheet1'!A1:C2",
            values: [["Ada", 1000, true]],
        })

        expect(parsed.success).toBe(true)
    })

    it("accepts a response with no values at all", () => {
        expect(valueRangeSchema.safeParse({range: "'Sheet1'!A1:C2"}).success).toBe(true)
    })

    it("rejects a cell type Sheets never returns", () => {
        expect(valueRangeSchema.safeParse({values: [[{nested: "object"}]]}).success).toBe(false)
    })
})
