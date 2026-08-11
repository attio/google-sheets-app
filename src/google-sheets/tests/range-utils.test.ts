import {describe, expect, it} from "vitest"
import {
    buildRange,
    buildRowValues,
    encodeRange,
    indexToLetter,
    letterToIndex,
    parseAppendedRowNumber,
} from "../helpers/range-utils"

describe(buildRange, () => {
    it("leaves a simple sheet name unquoted", () => {
        expect(buildRange("Sheet1")).toBe("Sheet1")
    })

    it("quotes a sheet name whenever a cell range is appended", () => {
        expect(buildRange("Sheet1", "B5")).toBe("'Sheet1'!B5")
    })

    it("quotes a sheet name containing spaces or punctuation", () => {
        expect(buildRange("My Sheet")).toBe("'My Sheet'")
    })

    it("escapes apostrophes by doubling them", () => {
        expect(buildRange("Bob's Sheet", "A1")).toBe("'Bob''s Sheet'!A1")
    })

    it("is not percent-encoded, unlike encodeRange", () => {
        // `values:batchUpdate` carries ranges in the body, where encoding would corrupt them.
        expect(buildRange("My Sheet", "A1")).toBe("'My Sheet'!A1")
        expect(encodeRange("My Sheet", "A1")).toBe("'My%20Sheet'!A1")
    })
})

describe("indexToLetter", () => {
    it("maps 1-based indices to column letters", () => {
        expect(indexToLetter(1)).toBe("A")
        expect(indexToLetter(26)).toBe("Z")
        expect(indexToLetter(27)).toBe("AA")
        expect(indexToLetter(52)).toBe("AZ")
        expect(indexToLetter(53)).toBe("BA")
        expect(indexToLetter(702)).toBe("ZZ")
        expect(indexToLetter(703)).toBe("AAA")
    })
})

describe("letterToIndex", () => {
    it("maps column letters to 1-based indices", () => {
        expect(letterToIndex("A")).toBe(1)
        expect(letterToIndex("Z")).toBe(26)
        expect(letterToIndex("AA")).toBe(27)
        expect(letterToIndex("ZZ")).toBe(702)
    })

    it("is case-insensitive", () => {
        expect(letterToIndex("aa")).toBe(27)
    })
})

describe("indexToLetter / letterToIndex round-trip", () => {
    it("round-trips for the first 1000 indices", () => {
        for (let i = 1; i <= 1000; i++) {
            expect(letterToIndex(indexToLetter(i))).toBe(i)
        }
    })
})

describe("buildRowValues", () => {
    it("places values at the right column and pads gaps with empty strings", () => {
        expect(
            buildRowValues([
                {letter: "A", value: "x"},
                {letter: "C", value: "z"},
            ])
        ).toEqual(["x", "", "z"])
    })

    it("is independent of input order", () => {
        expect(
            buildRowValues([
                {letter: "C", value: "z"},
                {letter: "A", value: "x"},
            ])
        ).toEqual(["x", "", "z"])
    })

    it("returns an empty row for no items", () => {
        expect(buildRowValues([])).toEqual([])
    })
})

describe("encodeRange", () => {
    it("leaves simple sheet names unquoted", () => {
        expect(encodeRange("Sheet1")).toBe("Sheet1")
    })

    it("quotes and URL-encodes names with special characters", () => {
        expect(encodeRange("My Sheet")).toBe("'My%20Sheet'")
    })

    it("quotes the sheet name when a range is provided", () => {
        expect(encodeRange("Sheet1", "1:1")).toBe("'Sheet1'!1%3A1")
    })

    it("escapes single quotes by doubling them", () => {
        expect(encodeRange("O'Brien", "A1:B2")).toBe("'O''Brien'!A1%3AB2")
    })
})

describe("parseAppendedRowNumber", () => {
    it("extracts the row number from a sheet-qualified range", () => {
        expect(parseAppendedRowNumber("Sheet1!A5:C5")).toBe(5)
    })

    it("extracts the row number from a bare range", () => {
        expect(parseAppendedRowNumber("A5:C5")).toBe(5)
    })

    it("handles quoted sheet names", () => {
        expect(parseAppendedRowNumber("'My Sheet'!B10:D10")).toBe(10)
    })

    it("returns null when the range is missing", () => {
        expect(parseAppendedRowNumber(undefined)).toBeNull()
    })

    it("returns null when no leading cell reference is present", () => {
        expect(parseAppendedRowNumber("Sheet1!5:5")).toBeNull()
    })
})
