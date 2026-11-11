export type Action = (
  request: () => Promise<unknown>,
  message: string,
) => Promise<boolean>;
