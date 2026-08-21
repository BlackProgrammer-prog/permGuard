import type { MongoAbility } from "@casl/ability";

export type AppAction = "manage" | "read" | "update" | "delete" | "publish";

export type AppSubject = "all" | "Product";

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export interface CurrentUser {
  readonly id: string;
  readonly role: "admin" | "editor" | "viewer";
}
