const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export function parsePagination(searchParams: URLSearchParams) {
  const rawPage = searchParams.get("page")
  const rawLimit = searchParams.get("limit")

  let page = rawPage ? parseInt(rawPage, 10) : DEFAULT_PAGE
  let limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT

  if (isNaN(page) || page < 1) page = DEFAULT_PAGE
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT
  if (limit > MAX_LIMIT) limit = MAX_LIMIT

  const skip = (page - 1) * limit
  const take = limit

  return { skip, take, page, limit }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}
