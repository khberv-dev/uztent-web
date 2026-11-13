/** getNextPageParam for the API's {items, total, page, limit} pages. */
export function nextPageParam(lastPage) {
    return lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined
}

/** Flattens useInfiniteQuery data into one array. */
export function flattenPages(data) {
    return data?.pages.flatMap((page) => page.items) ?? []
}
