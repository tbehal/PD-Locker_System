import { Response } from 'express';

const respond = {
  ok(res: Response, data: unknown, message = 'Success') {
    return res.json({ data, message });
  },
  list(res: Response, items: unknown[], message = 'Fetched') {
    return res.json({ data: items, count: items.length, message });
  },
  created(res: Response, data: unknown, message = 'Created') {
    return res.status(201).json({ data, message });
  },
  paginated(
    res: Response,
    items: unknown[],
    total: number,
    page: number,
    limit: number,
    message = 'Fetched',
  ) {
    return res.json({
      data: items,
      count: items.length,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      message,
    });
  },
};

export = respond;
