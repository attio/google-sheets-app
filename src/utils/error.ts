/**
 * Converts an unknown thrown value into a human-readable error message.
 */
export function toErrorMessage(error: unknown, fallback = "Unknown error"): string {
    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === "string") {
        return error
    }

    return fallback
}
