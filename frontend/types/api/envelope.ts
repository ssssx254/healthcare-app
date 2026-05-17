/**
 * Backend JSON (`Content-Type: application/json`) — бүх амжилттай хариу.
 * `apiRequest()` нь `data`-г шууд буцаадаг тул жагсаалтын хариуг `ApiPaginatedData<T>` гэж зааж өгнө.
 */
export type ApiSuccessEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  /** Backend-ийн гэрээний хувилбар (`apiResponse.js`-тай нийцнэ) */
  apiVersion?: string;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
  apiVersion?: string;
  errors?: { code?: string; details?: unknown };
};

export type ApiPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ApiPaginatedData<T> = {
  items: T[];
  meta: ApiPaginationMeta;
};
