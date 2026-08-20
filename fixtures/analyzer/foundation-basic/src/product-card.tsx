import { permission } from "./permissions";

export function ProductCard() {
  return <button data-action={permission.action}>Delete product</button>;
}
