import type { Account } from "../../shared/api/client";

export type Props = {
  account: Account | null;
  onAccount: (account: Account) => void;
};
