import type { Subject } from "@casl/ability";
import type { ReactNode } from "react";
import { useCan } from "./use-can.js";

export interface CanProps {
  readonly action: string;
  readonly subject: Subject;
  readonly field?: string;
  readonly not?: boolean;
  readonly fallback?: ReactNode;
  readonly children: ReactNode | ((isAllowed: boolean) => ReactNode);
}

export function Can({
  action,
  subject,
  field,
  not = false,
  fallback = null,
  children,
}: CanProps): ReactNode {
  const can = useCan(action, subject, field);
  const isAllowed = not ? !can : can;

  if (typeof children === "function") {
    return children(isAllowed);
  }

  return isAllowed ? children : fallback;
}
