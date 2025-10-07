export class ColumnNumericTransformer {
  to(value?: number | null): number | null | undefined {
    return value === undefined ? undefined : value;
  }

  from(value?: string | null): number | null | undefined {
    if (value === null || value === undefined) {
      return value as undefined | null;
    }

    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
