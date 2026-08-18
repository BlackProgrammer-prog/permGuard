export type IssueSeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export type FindingConfidence = "certain" | "high" | "medium" | "low";

export interface SourceLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

export interface PermissionDescriptor<
  TAction extends string = string,
  TSubject extends string = string,
> {
  readonly action: TAction;
  readonly subject: TSubject;
  readonly field?: string;
}

export interface PermissionSnapshot<
  TAction extends string = string,
  TSubject extends string = string,
> {
  readonly version: 1;
  readonly permissions: readonly PermissionDescriptor<TAction, TSubject>[];
}

export interface AuthorizationIssue {
  readonly id: string;
  readonly severity: IssueSeverity;
  readonly confidence: FindingConfidence;
  readonly title: string;
  readonly explanation: string;
  readonly location: SourceLocation;
  readonly permission?: PermissionDescriptor;
}
